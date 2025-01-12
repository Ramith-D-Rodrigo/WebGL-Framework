//class to represent a shader

class Shader {
    private vertexShader!: string;
    private fragmentShader!: string;

    private shaderProgram!: WebGLProgram | null;

    private uniformModel!: WebGLUniformLocation | null;
    private uniformModelInverse!: WebGLUniformLocation | null;
    private uniformProjection!: WebGLUniformLocation | null;
    private uniformView!: WebGLUniformLocation | null;
    private uniformTexture!: WebGLUniformLocation | null;
    private uniformAmbientColor!: WebGLUniformLocation | null;
    private uniformAmbientIntensity!: WebGLUniformLocation | null;
    private uniformDiffuseIntensity!: WebGLUniformLocation | null;
    private uniformDirection!: WebGLUniformLocation | null;
    private uniformDepthTexture!: WebGLUniformLocation | null;
    private uniformDepthUVTransform!: WebGLUniformLocation | null;
    private uniformDepthScale!: WebGLUniformLocation | null;
    private uniformResolution!: WebGLUniformLocation | null;

    private glContext!: WebGL2RenderingContext;

    private static instance: Shader | null = null;

    private constructor(glContext: WebGL2RenderingContext) {
        if(Shader.instance) {
            return Shader.instance;
        }

        this.vertexShader = '';
        this.fragmentShader = '';
        this.shaderProgram = null;
        this.uniformModel = null;
        this.uniformModelInverse = null;
        this.uniformProjection = null;
        this.uniformView = null;
        this.uniformTexture = null;
        this.uniformAmbientColor = null;
        this.uniformAmbientIntensity = null;
        this.uniformDiffuseIntensity = null;
        this.uniformDirection = null
        this.uniformDepthTexture = null;
        this.uniformDepthUVTransform = null;
        this.uniformDepthScale = null;
        this.uniformResolution = null;

        this.glContext = glContext;

        Shader.instance = this;
    }

    public static getInstance(glContext: WebGL2RenderingContext): Shader {
        return new Shader(glContext);
    }

    public createFromString(vertexShader: string, fragmentShader: string): void {
        this.compileShader(vertexShader, fragmentShader);
    }

    public async createFromFiles(vertexShaderPath: string, fragmentShaderPath: string): Promise<void> {
        this.vertexShader = await this.loadShaderFromFile(vertexShaderPath);
        this.fragmentShader = await this.loadShaderFromFile(fragmentShaderPath);

        this.createFromString(this.vertexShader, this.fragmentShader);
    }

    public useShader(): void {
        this.glContext.useProgram(this.shaderProgram);
    }

    public clearShader(): void {
        if(this.shaderProgram) {
            this.glContext.deleteProgram(this.shaderProgram);
            this.shaderProgram = null;
        }

        if(this.uniformModel) {
            this.uniformModel = null;
        }

        if(this.uniformModelInverse) {
            this.uniformModelInverse = null;
        }

        if(this.uniformProjection) {
            this.uniformProjection = null;
        }

        if(this.uniformView) {
            this.uniformView = null
        }

        if(this.uniformAmbientColor) {
            this.uniformAmbientColor = null;
        }

        if(this.uniformAmbientIntensity) {
            this.uniformAmbientIntensity = null;
        }

        if(this.uniformDiffuseIntensity) {
            this.uniformDiffuseIntensity = null;
        }

        if(this.uniformDirection) {
            this.uniformDirection = null;
        }

        if(this.uniformDepthTexture) {
            this.uniformDepthTexture = null;
        }

        if(this.uniformDepthUVTransform) {
            this.uniformDepthUVTransform = null;
        }

        if(this.uniformTexture) {
            this.uniformTexture = null;
        }

        if(this.uniformDepthScale) {
            this.uniformDepthScale = null;
        }

        if(this.uniformResolution) {
            this.uniformResolution = null;
        }
    }

    private compileShader(vertexShader: string, fragmentShader: string): void {
        let glShaderProgram: WebGLProgram | null = this.glContext.createProgram();
        if (!glShaderProgram) {
            console.error('Failed to create shader program');
            return;
        }

        this.shaderProgram = glShaderProgram;

        this.addShader(this.shaderProgram, vertexShader, this.glContext.VERTEX_SHADER);
        this.addShader(this.shaderProgram, fragmentShader, this.glContext.FRAGMENT_SHADER);

        //Link the shader program
        this.glContext.linkProgram(this.shaderProgram);
        //log the shader program
        if (!this.glContext.getProgramParameter(this.shaderProgram, this.glContext.LINK_STATUS)) {
            console.error(this.glContext.getProgramInfoLog(this.shaderProgram));
            return;
        }

        //Validate the shader program
        this.glContext.validateProgram(this.shaderProgram);
        //log the shader program
        if (!this.glContext.getProgramParameter(this.shaderProgram, this.glContext.VALIDATE_STATUS)) {
            console.error(this.glContext.getProgramInfoLog(this.shaderProgram));
            return;
        }

        //Get the uniform locations
        this.uniformProjection = this.glContext.getUniformLocation(this.shaderProgram, 'projection');
        this.uniformModel = this.glContext.getUniformLocation(this.shaderProgram, 'model');
        this.uniformModelInverse = this.glContext.getUniformLocation(this.shaderProgram, 'modelInverse');
        this.uniformView = this.glContext.getUniformLocation(this.shaderProgram, 'view');
        this.uniformTexture = this.glContext.getUniformLocation(this.shaderProgram, 'theTexture');
        this.uniformAmbientColor = this.glContext.getUniformLocation(this.shaderProgram, 'directionalLight.color');
        this.uniformAmbientIntensity = this.glContext.getUniformLocation(this.shaderProgram, 'directionalLight.ambientIntensity');
        this.uniformDiffuseIntensity = this.glContext.getUniformLocation(this.shaderProgram, 'directionalLight.diffuseIntensity');
        this.uniformDirection = this.glContext.getUniformLocation(this.shaderProgram, 'directionalLight.direction');
        this.uniformDepthTexture = this.glContext.getUniformLocation(this.shaderProgram, 'depthTexture');
        this.uniformDepthUVTransform = this.glContext.getUniformLocation(this.shaderProgram, 'depthUVTransform');
        this.uniformDepthScale = this.glContext.getUniformLocation(this.shaderProgram, 'depthScale');
        this.uniformResolution = this.glContext.getUniformLocation(this.shaderProgram, 'resolution');
    }

    private addShader(shaderProgram: WebGLProgram, shaderCode: string, shaderType: number): void {
        //first create the shader
        let shader: WebGLShader | null = this.glContext.createShader(shaderType);
        if (!shader) {
            console.error('Failed to create shader');
            return;
        }

        this.glContext.shaderSource(shader, shaderCode);
        this.glContext.compileShader(shader);

        //error logging
        if (!this.glContext.getShaderParameter(shader, this.glContext.COMPILE_STATUS)) {
            console.error(this.glContext.getShaderInfoLog(shader));
            return;
        }

        //Attach the shader to the shader program
        this.glContext.attachShader(shaderProgram, shader);
    }

    private async loadShaderFromFile(filePath: string): Promise<string> {
        //read the file
        let req = await fetch(filePath);
        return req.text();
    }

    public getUniformModel(): WebGLUniformLocation | null {
        return this.uniformModel;
    }

    public getUniformModelInverse(): WebGLUniformLocation | null {
        return this.uniformModelInverse;
    }

    public getUniformProjection(): WebGLUniformLocation | null {
        return this.uniformProjection;
    }

    public getUniformView(): WebGLUniformLocation | null {
        return this.uniformView;
    }

    public getUniformTexture(): WebGLUniformLocation | null {
        return this.uniformTexture;
    }

    public getUniformAmbientColor(): WebGLUniformLocation | null {
        return this.uniformAmbientColor;
    }

    public getUniformAmbientIntensity(): WebGLUniformLocation | null {
        return this.uniformAmbientIntensity;
    }

    public getUniformDiffuseIntensity(): WebGLUniformLocation | null {
        return this.uniformDiffuseIntensity;
    }

    public getUniformDirection(): WebGLUniformLocation | null {
        return this.uniformDirection;
    }

    public getUniformDepthTexture(): WebGLUniformLocation | null {
        return this.uniformDepthTexture;
    }

    public getUniformDepthUVTransform(): WebGLUniformLocation | null {
        return this.uniformDepthUVTransform;
    }

    public getUniformDepthScale(): WebGLUniformLocation | null {
        return this.uniformDepthScale;
    }

    public getUniformResolution(): WebGLUniformLocation | null {
        return this.uniformResolution;
    }
}

export default Shader;