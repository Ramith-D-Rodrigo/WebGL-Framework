import { mat4, quat, vec3 } from "gl-matrix";

class SceneObject<M,T> {
    private position: vec3;
    private rotation: quat;
    private scale: vec3;
    
    protected visualObjects: MeshWithTexture<M,T>[];
    protected children: SceneObject<M,T>[] = [];

    protected totalVertices: number | null = null;
    protected totalIndices: number | null = null;
    protected totalPolygons: number | null = null;

    public constructor(position: vec3, rotation: quat, scale: vec3, visualObjects: MeshWithTexture<M,T>[]) {
        this.position = position;
        this.rotation = rotation;
        this.scale = scale;
        this.visualObjects = visualObjects;
    }

    public getPosition(): vec3 {
        return this.position;
    }

    public getRotation(): quat {
        return this.rotation;
    }

    public getScale(): vec3 {
        return this.scale;
    }

    public getVisualObjects(): MeshWithTexture<M,T>[] {
        return this.visualObjects;
    }

    public getChildren(): SceneObject<M,T>[] {
        return this.children;
    }

    public setPosition(position: vec3): void {
        this.position = position;
    }

    public setRotation(rotation: quat): void {
        this.rotation = rotation;
    }

    public setScale(scale: vec3): void {
        this.scale = scale;
    }

    public setVisualObjects(visualObjects: MeshWithTexture<M,T>[]): void {
        this.visualObjects = visualObjects;
    }

    public addVisualObject(visualObject: MeshWithTexture<M,T>): void {
        this.visualObjects.push(visualObject);
    }

    public move(translation: vec3): void {
        this.position = vec3.add(this.position, this.position, translation);
    }

    public rotate(rotation: vec3): void {
        const quatRotation = quat.fromEuler(quat.create(), rotation[0], rotation[1], rotation[2]);
        this.rotation = quat.multiply(quat.create(), this.rotation, quatRotation);
    }

    public scaleBy(scale: vec3): void {
        this.scale = vec3.add(this.scale, this.scale, scale);
    }

    public calculateModelMatrix(): mat4 {
        let modelMatrix: mat4 = mat4.create();
        modelMatrix = mat4.fromRotationTranslationScale(modelMatrix, this.rotation, this.position, this.scale);
        return modelMatrix;
    }

    public addChild(child: SceneObject<M,T>): void {
        this.children.push(child);
    }

    public calculateInverseMatrix(modelMatrix: mat4): mat4 {
        const inverseMatrix = mat4.create();
        mat4.invert(inverseMatrix, modelMatrix);
        return inverseMatrix;
    }

    // Abstract methods
    public getIndicesCount(): number {
        return 0;
    }

    public getVerticesCount(): number {
        return 0;
    }

    public getPolygonCount(): number {
        return 0;
    }
}

type MeshWithTexture<M, T> = {
    mesh: M,
    texture: T
}

export { SceneObject };
export type { MeshWithTexture as MeshWithTextureType };
