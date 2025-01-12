import {DirectionalLightType} from "./light/DirectionalLight";
import { SceneObject } from "./SceneObject";

class Scene<M, T> {
    protected sceneObjects: SceneObject<M,T>[] = [];
    protected lights: DirectionalLightType[] = [];

    constructor() {
    }

    public addSceneObject(sceneObject: SceneObject<M,T>): void {
        this.sceneObjects.push(sceneObject);
    }

    public getSceneObjects(): SceneObject<M,T>[] {
        return this.sceneObjects;
    }

    public addLight(light: DirectionalLightType): void {
        this.lights.push(light);
    }

    public getLights(): DirectionalLightType[] {
        return this.lights;
    }

    public getTotalVertices(): number {
        let totalVertices: number = 0;
        for(let i = 0; i < this.sceneObjects.length; i++) {
            totalVertices += this.sceneObjects[i].getVerticesCount();
        }
        return totalVertices;
    }

    public getTotalIndices(): number {
        let totalIndices: number = 0;
        for(let i = 0; i < this.sceneObjects.length; i++) {
            totalIndices += this.sceneObjects[i].getIndicesCount();
        }
        return totalIndices;
    }

    public getTotalPolygons(): number {
        let totalPolygons: number = 0;
        for(let i = 0; i < this.sceneObjects.length; i++) {
            totalPolygons += this.sceneObjects[i].getPolygonCount();
        }
        return totalPolygons;
    }
}

export default Scene;
