import { vec3 } from "gl-matrix";

interface Light {
    color: vec3;
    ambientIntensity: number;
    diffuseIntensity: number;
}

export type { Light as LightType };
