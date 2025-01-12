//Default class for WebGL rendering

import { mat4 } from "gl-matrix";
import Camera from "./camera";
import InputManager from "./InputManager";
import {DirectionalLightType} from "./light/DirectionalLight";
import Scene from "./scene";
import { SceneObject } from "./SceneObject";

class Renderer<M, T> {
    protected canvas!: HTMLCanvasElement | OffscreenCanvas;
    protected width: number  = 800;
    protected height: number = 600;

    protected lastTime: number = 0;
    protected fps: number = 0;

    protected inputManager: InputManager | null = null;
    protected activeCamera: Camera | null = null;
    protected scene: Scene<M, T> | null = null;

    public constructor(canvas: HTMLCanvasElement | OffscreenCanvas, width: number | null, height: number | null) {

        this.canvas = canvas;

        if(width !== null) {
            canvas.width = width;
            this.width = width;
        }
        else{
            canvas.width = this.width;
        }


        if(height !== null) {
            canvas.height = height;
            this.height = height;
        }
        else {
            canvas.height = this.height;
        }

        this.inputManager = InputManager.getInstance();
    }


    public getHeight(): number {
        return this.height;
    }

    public getWidth(): number {
        return this.width;
    }

    public setActiveCamera(camera: Camera): void {
        this.activeCamera = camera;
    }

    protected calculateDeltaTime(now: number): number {
        now *= 0.001; // convert to seconds
        let deltaTime: number = now - this.lastTime;
        this.lastTime = now;
        return deltaTime;
    }

    protected processUserInput(): {viewMatrix: mat4, projectionMatrix: mat4} {
        let viewMatrix: mat4 = mat4.create();
        let projectionMatrix: mat4 = mat4.create();

        if(this.activeCamera && this.inputManager) {
            this.activeCamera.keyControl(this.inputManager.getKeys(), 0.1);
            this.activeCamera.mouseControl(this.inputManager.getMouseXMove(), this.inputManager.getMouseYMove());
            viewMatrix = this.activeCamera.calculateViewMatrix();
            projectionMatrix = this.activeCamera.getProjectionMatrix();
        }

        return {viewMatrix, projectionMatrix};
    }


    public addLightToScene(light: DirectionalLightType): void {
        if(!this.scene) {
            throw new Error('Scene is not initialized');
        }
        this.scene.addLight(light);
    }

    
    public addSceneObjectToScene(sceneObject: SceneObject<M, T>): void {
        if(!this.scene) {
            throw new Error('Scene is not initialized');
        }

        this.scene.addSceneObject(sceneObject);
    }

    public getFPS(): number {
        return this.fps;
    }

    public getSceneInfo(): {totalVertices: number, totalIndices: number, totalPolygons: number, totalObjects: number} {
        if(!this.scene) {
            throw new Error('Scene is not initialized');
        }

        return {
            totalVertices: this.scene.getTotalVertices(),
            totalIndices: this.scene.getTotalIndices(),
            totalPolygons: this.scene.getTotalPolygons(),
            totalObjects: this.scene.getSceneObjects().length,
        };
    }
}

export default Renderer;
