import { vec3 } from "gl-matrix";
import GLLight from "./glLight";
import { DirectionalLightType } from "../common";

class GLDirectionalLight extends GLLight implements DirectionalLightType {
    direction: vec3;

    constructor(diffuseIntensity: number, color: vec3, ambientIntensity: number, direction: vec3, gl: WebGL2RenderingContext) {
        super(diffuseIntensity, color, ambientIntensity, gl);
        this.direction = direction;
    }

    public static createLight(gl: WebGL2RenderingContext) : GLDirectionalLight {
        return new GLDirectionalLight(0.5, vec3.fromValues(1.0, 1.0, 1.0), 1, vec3.fromValues(0.0, -1.0, 0.0), gl);
    }

    public useLight(ambientIntensityLocation: WebGLUniformLocation | null, ambientColorLocation: WebGLUniformLocation | null, 
        diffuseIntensityLocation: WebGLUniformLocation | null, directionLocation: WebGLUniformLocation | null) {
        super.useLightBase(ambientIntensityLocation, ambientColorLocation, diffuseIntensityLocation);
        this.glContext.uniform3f(directionLocation, this.direction[0], this.direction[1], this.direction[2]);
    }
}

export default GLDirectionalLight;
