import { vec3 } from "gl-matrix";
import { LightType } from "../common";

class GLLight implements LightType {
    color: vec3;
    ambientIntensity: number;
    diffuseIntensity: number;
    protected glContext: WebGL2RenderingContext;

    constructor(diffuseIntensity: number, color: vec3, ambientIntensity: number, glContent: WebGL2RenderingContext) {
        this.diffuseIntensity = diffuseIntensity;
        this.color = color;
        this.ambientIntensity = ambientIntensity;
        this.glContext = glContent;
    }

    public static create(gl: WebGL2RenderingContext) {
        return new GLLight(0.5, vec3.fromValues(1.0, 1.0, 1.0), 1, gl);
    }

    public useLightBase(ambientIntensityLocation: WebGLUniformLocation | null, ambientColorLocation: WebGLUniformLocation | null, 
        diffuseIntensityLocation: WebGLUniformLocation | null) {
        this.glContext.uniform3f(ambientColorLocation, this.color[0], this.color[1], this.color[2]);
        this.glContext.uniform1f(ambientIntensityLocation, this.ambientIntensity);
        this.glContext.uniform1f(diffuseIntensityLocation, this.diffuseIntensity);
    }

}

export default GLLight;
