import { glMatrix, mat4, vec3 } from "gl-matrix";
import { MOVE_FORWARD, MOVE_BACKWARD, MOVE_LEFT, MOVE_RIGHT } from "./cameraControls";

//camera class
class Camera {
    private position: vec3;
    private up!: vec3;   //camera up vector
    private front: vec3;
    private right: vec3;
    private worldUp: vec3;

    private yaw: number;    //degrees
    private pitch: number;  //degrees

    private movementSpeed: number;
    private mouseSensitivity: number; //turning speed

    private projectionMatrix: mat4 = mat4.create();

    constructor(startPosition: vec3, startUp: vec3, startYaw: number, startPitch: number, startMovementSpeed: number, startMouseSensitivity: number,
        VerticalFieldOfViewDeg: number, aspectRatio: number, nearPlane: number, farPlane: number, isWebGPU: boolean) {
        this.position = startPosition;
        this.worldUp = startUp;
        this.yaw = startYaw;
        this.pitch = startPitch;
        this.front = vec3.create();
        this.front[2] = -1.0;   //camera starts looking down the negative z-axis
        this.right = vec3.create();
        this.up = vec3.create();

        this.movementSpeed = startMovementSpeed;
        this.mouseSensitivity = startMouseSensitivity;

        if(isWebGPU) {
            mat4.perspectiveZO(this.projectionMatrix, glMatrix.toRadian(VerticalFieldOfViewDeg), aspectRatio, nearPlane, farPlane);
        }
        else{
            mat4.perspective(this.projectionMatrix, glMatrix.toRadian(VerticalFieldOfViewDeg), aspectRatio, nearPlane, farPlane);
        }

        this.update();
    }

    private update(): void {
        //calculate the front vector
        this.front[0] = Math.cos(glMatrix.toRadian(this.yaw)) * Math.cos(glMatrix.toRadian(this.pitch));
        this.front[1] = Math.sin(glMatrix.toRadian(this.pitch));
        this.front[2] = Math.sin(glMatrix.toRadian(this.yaw)) * Math.cos(glMatrix.toRadian(this.pitch));
        this.front = vec3.normalize(this.front, this.front);

        //calculate the right vector
        this.right = vec3.normalize(this.right, vec3.cross(this.right, this.front, this.worldUp));

        //calculate the up vector
        this.up = vec3.normalize(this.up, vec3.cross(this.up, this.right, this.front));
    }

    public keyControl(keys: Map<string, boolean>, deltaTime: number): void {
        let velocity: number = this.movementSpeed * deltaTime;

        if(keys.get(MOVE_FORWARD)) {
            vec3.add(this.position, this.position, vec3.scale(vec3.create(), this.front, velocity));
        }

        if(keys.get(MOVE_BACKWARD)) {
            vec3.sub(this.position, this.position, vec3.scale(vec3.create(), this.front, velocity));
        }

        if(keys.get(MOVE_LEFT)) {
            vec3.sub(this.position, this.position, vec3.scale(vec3.create(), this.right, velocity));
        }

        if(keys.get(MOVE_RIGHT)) {
            vec3.add(this.position, this.position, vec3.scale(vec3.create(), this.right, velocity));
        }
    }

    public mouseControl(xChange: number, yChange: number): void {
        xChange *= this.mouseSensitivity;
        yChange *= this.mouseSensitivity;

        this.yaw += xChange;
        this.pitch += yChange;

        if(this.pitch > 89.0) { //prevent camera from flipping
            this.pitch = 89.0;
        }

        if(this.pitch < -89.0) {    //prevent camera from flipping
            this.pitch = -89.0;
        }

        this.update();
    }

    public calculateViewMatrix(): mat4 {
        let viewMatrix: mat4 = mat4.create();
        let center: vec3 = vec3.add(vec3.create(), this.position, this.front);
        mat4.lookAt(viewMatrix, this.position, center, this.up);
        return viewMatrix;
    }

    public getProjectionMatrix(): mat4 {
        return this.projectionMatrix;
    }

    public getPosition(): vec3 {
        return this.position;
    }

    public setPosition(position: vec3): void {
        this.position = position;
    }

    public getYaw(): number {
        return this.yaw;
    }

    public setYaw(yaw: number): void {
        this.yaw = yaw;
    }

    public getPitch(): number {
        return this.pitch;
    }

    public setPitch(pitch: number): void {
        this.pitch = pitch;
    }

}
export default Camera;
