//Default class for WebGL rendering

import { mat4, quat, vec3, vec4 } from "gl-matrix";
import GLScene from "./glScene"
import Shader from "./shader";
import {GLSceneObject } from "./glSceneObject";
import GLModel from "./glModel";
import GLMesh from "./glMesh";
import GLTexture from "./glTexture";
import GLDirectionalLight from "./light/glDirectionalLight";
import {Renderer} from "./common";
import vertexShader from "./shaders/basic/simpleShader.vert.glsl";
import fragmentShader from "./shaders/basic/simpleShader.frag.glsl";
import xrVertexShader from "./shaders/xr/simpleShader.vert.glsl";
import xrFragmentShader from "./shaders/xr/simpleShader.frag.glsl";

class GLRenderer extends Renderer<GLMesh, GLTexture> {
    private gl!: WebGL2RenderingContext;

    private shader: Shader | null = null;

    private static instance: GLRenderer | null = null;

    private blitFramebuffer: WebGLFramebuffer | null = null;
    private blitTexture: WebGLTexture | null = null;

    private depthTexture: WebGLTexture | null = null;

    public static async RendererInstance(canvas: HTMLCanvasElement | OffscreenCanvas, options: WebGLContextAttributes) : Promise<GLRenderer> {
        let renderer = new GLRenderer(canvas, null, null, options);
        renderer.init();
        await renderer.loadShader(vertexShader, fragmentShader);
        return renderer;
    }

    public static async RendererInstanceWithSize(canvas: HTMLCanvasElement | OffscreenCanvas, width: number, height: number, options: WebGLContextAttributes) : Promise<GLRenderer> {
        let renderer = new GLRenderer(canvas, width, height, options);
        renderer.init();
        await renderer.loadShader(vertexShader, fragmentShader);
        return renderer;
    }

    public static async RendererInstanceWithXR(canvas: HTMLCanvasElement | OffscreenCanvas, options: WebGLContextAttributes) : Promise<GLRenderer> {
        options = {...options, xrCompatible: true};

        let renderer = new GLRenderer(canvas, null, null, options);
        renderer.getGL().enable(renderer.getGL().DEPTH_TEST);
        await renderer.loadShader(xrVertexShader, xrFragmentShader);
        renderer.initDepthTexture();
        return renderer;
    }
        

    private constructor(canvas: HTMLCanvasElement | OffscreenCanvas, width: number | null, height: number | null, options : WebGLContextAttributes) {
        if(GLRenderer.instance) {
            console.error('Renderer already exists');
            return GLRenderer.instance;
        }

        super(canvas, width, height);

        let context : WebGL2RenderingContext | null = canvas.getContext('webgl2', options); //remove css background blending
        if (!context) {
            console.error('WebGL not supported');
            return;
        }

        this.gl = context;
        this.scene = GLScene.getInstance();
        this.shader = Shader.getInstance(this.gl);
        GLRenderer.instance = this;
    }

    public setViewPort(x: number, y: number, width: number, height: number) : void {
        this.gl.viewport(x, y, width, height);
    }

    private init(): void {
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);  // Set the viewport
        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.depthFunc(this.gl.LESS);
        this.gl.depthMask(true);
        this.gl.stencilMask(0);    // Disables stencil writes if not using stencil
        
        // Blending
        this.gl.enable(this.gl.BLEND);
        this.gl.blendEquation(this.gl.FUNC_ADD);
        this.gl.blendFunc(this.gl.ONE, this.gl.ZERO);
        
        // Color write mask
        this.gl.colorMask(true, true, true, true);   // Enable all color channels
        
        // Multisample settings (default WebGL framebuffer settings)
        if (this.gl instanceof WebGL2RenderingContext) {
            this.gl.disable(this.gl.SAMPLE_ALPHA_TO_COVERAGE);
        }
    }

    private async loadShader(vertexShader: string, fragmentShader: string) : Promise<void> {
        if(!this.shader) {
            throw new Error('Shader is not initialized');
        }
        return this.shader.createFromString(vertexShader, fragmentShader);
    }

    private initDepthTexture(): void {
        this.depthTexture = this.gl.createTexture();
        if(!this.depthTexture) {
            throw new Error('Failed to create depth texture');
        }
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.depthTexture);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
        this.gl.bindTexture(this.gl.TEXTURE_2D, null);
    }

    // Clear the canvas
    public clear(): void {
        this.gl.clearColor(1.0, 1.0, 1.0, 1.0); // white
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    }

    public getGL(): WebGL2RenderingContext {
        return this.gl;
    }

    public render(now: number): void {
        const deltaTime = this.calculateDeltaTime(now);

        this.fps = 1 / deltaTime;

        if(!this.scene) {
            throw new Error('Scene is not initialized');
        }

        if(!this.shader) {
            throw new Error('Shader is not initialized');
        }

        this.clear();
        this.shader.useShader();

        const uniforms = this.getUniforms();

        this.useLights(this.scene as GLScene, uniforms);

        let viewMatrix: mat4 = mat4.create();
        let projectionMatrix : mat4 = mat4.create();

        ({viewMatrix, projectionMatrix} = this.processUserInput());

        this.gl.uniformMatrix4fv(uniforms.uniformProjection, false, projectionMatrix);
        this.gl.uniformMatrix4fv(uniforms.uniformView, false, viewMatrix);

        const sceneObjects = this.scene.getSceneObjects();
        for(let i = 0; i < sceneObjects.length; i++) {
            this.renderSceneObject(sceneObjects[i] as GLSceneObject, mat4.create(), uniforms.uniformModel as WebGLUniformLocation, 
            uniforms.uniformModelInverse as WebGLUniformLocation, uniforms.uniformTexture as WebGLUniformLocation);
        }

        this.gl.useProgram(null); // Un assign the shader program

        //requestAnimationFrame(this.render.bind(this));
    }

    public renderXR(now: number, frame: XRFrame, refSpace: XRReferenceSpace, backgroundColor: vec4, glLayer: XRWebGLLayer): void {
        const deltaTime = this.calculateDeltaTime(now);
        if(!this.scene) {
            throw new Error('Scene is not initialized');
        }
        
        if(!this.shader) {
            throw new Error('Shader is not initialized');
        }

        const pose = frame.getViewerPose(refSpace);
        if(!pose) {
            return;
        }

        const views = pose.views;

        // Bind the framebuffer to the baseLayer's framebuffer
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, glLayer.framebuffer);
        
        this.gl.clearColor(backgroundColor[0], backgroundColor[1], backgroundColor[2], backgroundColor[3]);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
        this.shader.useShader();

        for(let i = 0; i < views.length; i++) {
            const viewport = glLayer.getViewport(views[i]) as XRViewport;
            this.setViewPort(viewport.x, viewport.y, viewport.width, viewport.height);
            const uniforms = this.getUniforms();
            this.useLights(this.scene as GLScene, uniforms);

            const projectionMatrix = views[i].projectionMatrix;
            const viewMatrix = views[i].transform.inverse.matrix;
    
            this.gl.uniformMatrix4fv(uniforms.uniformProjection, false, projectionMatrix);
            this.gl.uniformMatrix4fv(uniforms.uniformView, false, viewMatrix);

            const depthInfo = frame.getDepthInformation(views[i]);

            if(depthInfo) {
                this.setupDepth(depthInfo, uniforms, viewport.width, viewport.height);
            }

            const sceneObjects = this.scene.getSceneObjects();
            for(let i = 0; i < sceneObjects.length; i++) {
                this.renderSceneObject(sceneObjects[i] as GLSceneObject, mat4.create(), uniforms.uniformModel as WebGLUniformLocation, 
                uniforms.uniformModelInverse as WebGLUniformLocation, uniforms.uniformTexture as WebGLUniformLocation);
            }
        }

        this.gl.useProgram(null); // Un assign the shader program
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null); // Unbind the framebuffer
    }

    public renderTexture(now: number, canvasTexture: HTMLCanvasElement | OffscreenCanvas) : void {
        let deltaTime = this.calculateDeltaTime(now);
    
        this.fps = 1 / deltaTime;
        this.clear();

        // Create and bind a texture from the canvas (consider creating once)
        if(!this.blitTexture) {
            this.blitTexture = this.gl.createTexture();
        }
        // Create a framebuffer (consider creating once)
        if(!this.blitFramebuffer) {
            this.blitFramebuffer = this.gl.createFramebuffer();
        }
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.blitTexture);
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, canvasTexture);
    
        this.gl.bindFramebuffer(this.gl.READ_FRAMEBUFFER, this.blitFramebuffer); // Use READ_FRAMEBUFFER in WebGL 2.0
        this.gl.framebufferTexture2D(this.gl.READ_FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0, this.gl.TEXTURE_2D, this.blitTexture, 0);
        
        // Bind the default framebuffer (for drawing to the screen)
        this.gl.bindFramebuffer(this.gl.DRAW_FRAMEBUFFER, null);
    
        // Blit from the offscreen framebuffer to the default framebuffer
        this.gl.blitFramebuffer(
            0, canvasTexture.height, canvasTexture.width, 0, // source (flip the width and height because of different coordinate systems)
            0, 0, canvasTexture.width, canvasTexture.height,     // destination
            this.gl.COLOR_BUFFER_BIT, this.gl.NEAREST
        );
    
        // Clean up
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null); //Unbind the framebuffer (both READ_FRAMEBUFFER and DRAW_FRAMEBUFFER)
        this.gl.bindTexture(this.gl.TEXTURE_2D, null); // Unbind the texture

        // Request the next animation frame
        //requestAnimationFrame((now) => this.renderTexture(now, canvasTexture));
    }
    
    private setupDepth(depthData: XRCPUDepthInformation, uniforms: Uniforms, viewportWidth: number, viewportHeight: number): void {
        this.gl.activeTexture(this.gl.TEXTURE1);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.depthTexture);
        this.gl.texImage2D(
            this.gl.TEXTURE_2D,
            0,
            this.gl.LUMINANCE_ALPHA,
            depthData.width,
            depthData.height,
            0,
            this.gl.LUMINANCE_ALPHA,
            this.gl.UNSIGNED_BYTE,
            new Uint8Array(depthData.data, 0, depthData.data.byteLength)
        );
        this.gl.uniform1i(uniforms.uniformDepthTexture, 1);

        // Set up UV transform
        const uvTransformLocation = uniforms.uniformDepthUVTransform;
        const matrix = depthData.normDepthBufferFromNormView.matrix;
        
        //bind the uv transform matrix
        this.gl.uniformMatrix4fv(uvTransformLocation, false, matrix);

        // Set the depth scale
        const depthScaleLocation = uniforms.uniformDepthScale;
        this.gl.uniform1f(depthScaleLocation, depthData.rawValueToMeters);

        // Set the resolution
        this.gl.uniform2f(uniforms.uniformResolution, viewportWidth, viewportHeight);
    }


    private getUniforms() : Uniforms {
        if(!this.shader) {
            throw new Error('Shader is not initialized');
        }

        return {
            uniformModel: this.shader.getUniformModel(),
            uniformModelInverse: this.shader.getUniformModelInverse(),
            uniformProjection: this.shader.getUniformProjection(),
            uniformView: this.shader.getUniformView(),
            uniformTexture: this.shader.getUniformTexture(),
            uniformAmbientColor: this.shader.getUniformAmbientColor(),
            uniformAmbientIntensity: this.shader.getUniformAmbientIntensity(),
            uniformDiffuseIntensity: this.shader.getUniformDiffuseIntensity(),
            uniformDirection: this.shader.getUniformDirection(),
            uniformDepthTexture: this.shader.getUniformDepthTexture(),
            uniformDepthUVTransform: this.shader.getUniformDepthUVTransform(),
            uniformDepthScale: this.shader.getUniformDepthScale(),
            uniformResolution: this.shader.getUniformResolution()
        };
    }

    private useLights(scene: GLScene, uniforms: Uniforms) : void {
        const lights = scene.getLights() as GLDirectionalLight[];
        for(let i = 0; i < lights.length; i++) {
            lights[i].useLight(uniforms.uniformAmbientIntensity, uniforms.uniformAmbientColor, uniforms.uniformDiffuseIntensity, uniforms.uniformDirection);
        }
    }

    private renderSceneObject(sceneObject: GLSceneObject, parentModelMatrix: mat4, uniformModel: WebGLUniformLocation, uniformModelInverse: WebGLUniformLocation,
        uniformTexture: WebGLUniformLocation
    ): void {
        let modelMatrix = sceneObject.calculateModelMatrix();
        modelMatrix = mat4.multiply(modelMatrix, parentModelMatrix, modelMatrix);

        this.gl.uniformMatrix4fv(uniformModel, false, modelMatrix);
        
        let inverseModelMatrix = sceneObject.calculateInverseMatrix(modelMatrix);

        this.gl.uniformMatrix4fv(uniformModelInverse, false, inverseModelMatrix);

        let visualObjects = sceneObject.getVisualObjects();
        for(let j = 0; j < visualObjects.length; j++) {
            visualObjects[j].texture.useTexture(this.gl, uniformTexture);
            visualObjects[j].mesh.renderMesh(this.gl);
        }

        const children = sceneObject.getChildren() as GLSceneObject[];
        for(let i = 0; i < children.length; i++) {
            this.renderSceneObject(children[i], modelMatrix, uniformModel, uniformModelInverse, uniformTexture);
        }
    }

    public async loadModelData(modelFilePath: string) : Promise<GLModel> {
        if(!this.scene) {
            throw new Error('Scene is not initialized');
        }

        const model = new GLModel(this.gl);
        await model.loadModel(modelFilePath);
        return model;
    }

    public async createModelSceneObject(model: GLModel, position: vec3, rotation: vec3, scale: vec3) : Promise<GLSceneObject> {
        if(!this.scene) {
            throw new Error('Scene is not initialized');
        }

        return await model.createModelSceneObject(position, rotation, scale);
    }

    public async createModelSceneObjectFromQuats(model: GLModel, position: vec3, rotation: quat, scale: vec3) : Promise<GLSceneObject> {
        if(!this.scene) {
            throw new Error('Scene is not initialized');
        }

        return await model.createModelSceneObjectFromQuats(position, rotation, scale);
    }

    public createDirectionalLight(diffuseIntensity: number, color: vec3, ambientIntensity: number, direction: vec3) : GLDirectionalLight {
        return new GLDirectionalLight(diffuseIntensity, color, ambientIntensity, direction, this.gl);
    }

    public clearScene(): void {
        if(!this.scene){
            throw new Error('Scene is not initialized');
        }

        const scene = this.scene as GLScene;
        scene.removeAllSceneObjects(this.gl);
    }
}

// Create a type to hold all Uniforms
type Uniforms = {
    uniformModel: WebGLUniformLocation | null,
    uniformModelInverse: WebGLUniformLocation | null,
    uniformProjection: WebGLUniformLocation | null,
    uniformView: WebGLUniformLocation | null,
    uniformTexture: WebGLUniformLocation | null,
    uniformAmbientColor: WebGLUniformLocation | null,
    uniformAmbientIntensity: WebGLUniformLocation | null,
    uniformDiffuseIntensity: WebGLUniformLocation | null,
    uniformDirection: WebGLUniformLocation | null,
    uniformDepthTexture: WebGLUniformLocation | null,
    uniformDepthUVTransform: WebGLUniformLocation | null,
    uniformDepthScale: WebGLUniformLocation | null,
    uniformResolution: WebGLUniformLocation | null,
};

export default GLRenderer;
