import { quat, vec3 } from "gl-matrix";
import GLMesh from "./glMesh";
import GLTexture from "./glTexture";
import { MeshWithTextureType, SceneObject } from "./common/index";

class GLSceneObject extends SceneObject<GLMesh, GLTexture> {

    private constructor(position: vec3, rotation: quat, scale: vec3, visualObjects: MeshWithTextureType<GLMesh, GLTexture>[]) {
        super(position, rotation, scale, visualObjects);
    }

    public static create(position: vec3, rotation: vec3, scale: vec3, visualObjects: MeshWithTextureType<GLMesh, GLTexture>[]): GLSceneObject {
        const quatRotation = quat.fromEuler(quat.create(), rotation[0], rotation[1], rotation[2]);
        return new GLSceneObject(position, quatRotation, scale, visualObjects);
    }

    public static createWithQuats(position: vec3, rotationQuat: quat, scale: vec3, visualObjects: MeshWithTextureType<GLMesh, GLTexture>[]): GLSceneObject {
        return new GLSceneObject(position, rotationQuat, scale, visualObjects);
    }

    public static createAtOrigin(visualObjects: MeshWithTextureType<GLMesh, GLTexture>[]): GLSceneObject {
        const quatRotation = quat.fromEuler(quat.create(), 0, 0, 0);
        return new GLSceneObject(vec3.create(), quatRotation, vec3.fromValues(1, 1, 1), visualObjects);
    }

    public getIndicesCount(): number {
        if(this.totalIndices !== null) {
            return this.totalIndices;
        }

        let count = 0;
        for(let i = 0; i < this.visualObjects.length; i++) {
            count += this.visualObjects[i].mesh.getIndicesCount();
        }
        
        // Add the children's indices count
        for(let i = 0; i < this.children.length; i++) {
            const child =  this.children[i] as GLSceneObject;
            count += child.getIndicesCount();
        }

        this.totalIndices = count;
        return this.totalIndices;
    }

    public getVerticesCount(): number {
        if(this.totalVertices !== null) {
            return this.totalVertices;
        }

        let count = 0;
        for(let i = 0; i < this.visualObjects.length; i++) {
            count += this.visualObjects[i].mesh.getVerticesCount();
        }

        // Add the children's vertices count
        for(let i = 0; i < this.children.length; i++) {
            const child =  this.children[i] as GLSceneObject;
            count += child.getVerticesCount();
        }

        this.totalVertices = count;
        return this.totalVertices;
    }

    public getPolygonCount(): number {
        if(this.totalPolygons !== null) {
            return this.totalPolygons;
        }

        let count = 0;
        for(let i = 0; i < this.visualObjects.length; i++) {
            count += this.visualObjects[i].mesh.getPolygonCount();
        }

        // Add the children's polygon count
        for(let i = 0; i < this.children.length; i++) {
            const child =  this.children[i] as GLSceneObject;
            count += child.getPolygonCount();
        }

        this.totalPolygons = count;
        return this.totalPolygons;
    }

    public clear(gl: WebGL2RenderingContext): void {
        for(let i = 0; i < this.visualObjects.length; i++) {
            this.visualObjects[i].mesh.clearMesh(gl);
            //this.visualObjects[i].texture.clearTexture(gl);
        }

        for(let i = 0; i < this.children.length; i++) {
            const child =  this.children[i] as GLSceneObject;
            child.clear(gl);
        }
    }
}


export { GLSceneObject};