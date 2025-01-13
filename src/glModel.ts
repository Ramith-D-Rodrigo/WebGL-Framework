import GLMesh from "./glMesh";
import GLTexture from "./glTexture";
import { load } from '@loaders.gl/core';
import { GLTFLoader, GLTFPostprocessed, postProcessGLTF } from '@loaders.gl/gltf';
import { GLTFMeshPrimitivePostprocessed, GLTFNodePostprocessed, GLTFScenePostprocessed } from "@loaders.gl/gltf/dist/lib/types/gltf-postprocessed-schema";
import { GLSceneObject } from "./glSceneObject";
import { mat4, quat, vec3 } from "gl-matrix";
import { calculateAvgNormal, Mesh, MeshWithTextureType, Model } from "./common/index";

class GLModel extends Model {
    private textureList: Map<string, GLTexture>;
    private glContext: WebGL2RenderingContext;
    private plainTexture: GLTexture | null;

    constructor(gl: WebGL2RenderingContext) {
        super();
        this.textureList = new Map();
        this.glContext = gl;
        this.plainTexture = null;
    }

    /**
     * Loads the model from the specified file path.
     * @param filePath Path to the GLTF file
     */
    public async loadModel(filePath: string): Promise<void> {
        const data = await load(filePath, GLTFLoader);

        // Process the loaded GLTF data
        this.processedData = postProcessGLTF(data);
        console.log('Processed GLTF data:', this.processedData);

        this.calculateModelInfo();
    }

    public async createModelSceneObject(position : vec3, rotation : vec3, scale : vec3): Promise<GLSceneObject> {
        let quatRotation = quat.create();
        quatRotation = quat.fromEuler(quatRotation, rotation[0], rotation[1], rotation[2]);

        return this.createModelSceneObjectFromQuats(position, quatRotation, scale);
    }

    public async createModelSceneObjectFromQuats(position : vec3, rotation : quat, scale : vec3): Promise<GLSceneObject> {
        if(!this.processedData) {
            throw new Error('No processed data found');
        }
        const rootSceneObject = GLSceneObject.createWithQuats(position, rotation, scale, []);

        await this.processGLTFData(this.processedData, rootSceneObject);

        return rootSceneObject;
    }

    private async processGLTFData(processedGLTF: GLTFPostprocessed, rootSceneObject: GLSceneObject) {
        // Access the GLTF JSON data and buffers

        // traverse all the scenes
        for(let i = 0; i < processedGLTF.scenes.length; i++) {
            const scene = processedGLTF.scenes[i];
            await this.processScene(scene, rootSceneObject);
        }
    }

    private async processScene(scene: GLTFScenePostprocessed, rootSceneObject: GLSceneObject) {
        if(!scene.nodes) {
            return;
        }

        //traverse all the nodes
        for(let i = 0; i < scene.nodes.length; i++) {
            const node = scene.nodes[i];
            const child = await this.processNode(node);
            rootSceneObject.addChild(child);
        }
    }

    private async processNode(node: GLTFNodePostprocessed) : Promise<GLSceneObject> {
        const localTranslation = node.translation ? 
        node.translation as vec3
        : vec3.create();
        const localRotation = node.rotation ? 
        node.rotation as quat
        : quat.create();
        const localScale = node.scale ? 
        node.scale as vec3
        : vec3.fromValues(1, 1, 1); 
    
        const sceneObject = GLSceneObject.createWithQuats(localTranslation, localRotation, localScale, []);

        if(node.mesh) {
            //traverse all the primitives of the mesh
            for(let i = 0; i < node.mesh.primitives.length; i++) {
                const primitive = node.mesh.primitives[i];
                const result = await this.processPrimitive(primitive);
                if(result){
                    sceneObject.addVisualObject(result);
                }
            }

        }
        
        if(node.children) {
            for(let i = 0; i < node.children.length; i++) {
                const childNode = node.children[i];
                const child = await this.processNode(childNode);
                sceneObject.addChild(child);
            }
        }
        return sceneObject;
    }

    private async processPrimitive(primitive: GLTFMeshPrimitivePostprocessed) : Promise<MeshWithTextureType<GLMesh, GLTexture> | null> {
        if(this.checkForAlphaBlending(primitive)) {
            console.log('Alpha blending found');
            return null;
        }

        // Get the attributes
        const vertices = primitive.attributes.POSITION.value as Float32Array;
        const numVertices = primitive.attributes.POSITION.count * 3; //here multiply by 3 because the vertices are stored as [x, y, z, x, y, z, ...]

        // Get the indices
        if(!primitive.indices) {
            throw new Error('No indices found for the primitive');
        }
        const indices = primitive.indices.value as Uint32Array;
        const numIndices = primitive.indices.count;
        const indexType = primitive.indices.componentType;

        let indicesArr : Uint16Array | Uint32Array;
        let indexFormat;
        if(indexType === 5123) {
            indicesArr = new Uint16Array(indices);
            indexFormat = this.glContext.UNSIGNED_SHORT;
        }
        else if(indexType === 5125) {
            indicesArr = new Uint32Array(indices);
            indexFormat = this.glContext.UNSIGNED_INT;
        }
        else {
            throw new Error('Invalid index format!'); 
        }

        let normals : Float32Array;
        let numNormals; 
        if(!primitive.attributes.NORMAL) {
            normals = calculateAvgNormal(indicesArr, vertices, 3);
            numNormals = normals.length;
        }
        else{
            normals = primitive.attributes.NORMAL.value as Float32Array;
            numNormals = primitive.attributes.NORMAL.count * 3; //similar to vertices
        }

        let textureCoord;
        let numTextureCoords;
        if(primitive.attributes.TEXCOORD_0) {
            textureCoord = primitive.attributes.TEXCOORD_0.value as Float32Array;
            numTextureCoords = primitive.attributes.TEXCOORD_0.count * 2;
        }
        else {
            textureCoord = new Float32Array();
            numTextureCoords = 0;
        }

        this.totalVertices += numVertices / 3; // because each vertex has 3 components
        this.totalIndices += numIndices;
        this.totalPolygons += numIndices / 3;

        const vertexStride = Mesh.STRIDE;
        const interleavedVertexCount = numVertices / 3;
        const interleavedVertices = new Float32Array(interleavedVertexCount * vertexStride);
    
        for (let i = 0; i < interleavedVertexCount; ++i) {
            // Interleave position
            interleavedVertices[i * vertexStride + 0] = vertices[i * 3 + 0];
            interleavedVertices[i * vertexStride + 1] = vertices[i * 3 + 1];
            interleavedVertices[i * vertexStride + 2] = vertices[i * 3 + 2];
    
            // Interleave normal
            interleavedVertices[i * vertexStride + 3] = normals[i * 3 + 0];
            interleavedVertices[i * vertexStride + 4] = normals[i * 3 + 1];
            interleavedVertices[i * vertexStride + 5] = normals[i * 3 + 2];
    
            // Interleave UV
            interleavedVertices[i * vertexStride + 6] = textureCoord[i * 2 + 0];
            interleavedVertices[i * vertexStride + 7] = textureCoord[i * 2 + 1];
        }

        //create a new mesh
        const mesh = new GLMesh(interleavedVertices, interleavedVertexCount * vertexStride, indicesArr, numIndices, indexFormat, this.glContext);

        // process the material
        const finalTexture = await this.processMaterial(primitive);

        const meshWithTexture : MeshWithTextureType<GLMesh, GLTexture> = {
            mesh: mesh,
            texture: finalTexture
        }

        return meshWithTexture;
    }

    private async processMaterial(primitive: GLTFMeshPrimitivePostprocessed) : Promise<GLTexture> {
        let finalTexture : GLTexture;

        if(!this.plainTexture) {
            this.plainTexture = await GLTexture.createPlainTexture(this.glContext);
        }
        
        if(!primitive.material){
            console.log('No material found');
            finalTexture = this.plainTexture;
            return finalTexture;
        }

        const pbrMetallicRoughness = primitive.material.pbrMetallicRoughness;
        if(!pbrMetallicRoughness) {
            console.log('No pbrMetallicRoughness found');
            finalTexture = this.plainTexture;
            return finalTexture;
        }

        const baseColorTexture = pbrMetallicRoughness.baseColorTexture;
        if(!baseColorTexture) {
            console.log('No baseColorTexture found');
            finalTexture = this.plainTexture;
            return finalTexture;
        }

        const textureId = baseColorTexture.texture.id;
        //check if the texture is already loaded
        if(this.textureList.has(textureId)) {
            return this.textureList.get(textureId) as GLTexture;
        }
        
        const gltfImage = baseColorTexture.texture.source;
        
        if(!gltfImage) {
            console.log('No source found for baseColorTexture');
            finalTexture = this.plainTexture;
            return finalTexture;
        }

        const bitMap = gltfImage.image as unknown as ImageBitmap;

        const gpuTexture = GLTexture.createTextureFromBitmap(bitMap, this.glContext);

        finalTexture = gpuTexture;
        this.textureList.set(textureId, gpuTexture);
        return finalTexture;
    }
}

export default GLModel;
