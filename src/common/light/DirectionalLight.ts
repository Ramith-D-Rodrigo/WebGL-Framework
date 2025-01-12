import { vec3 } from "gl-matrix";
import { LightType } from "./light";

interface DirectionalLight extends LightType {
    direction: vec3;
}

export type { DirectionalLight as DirectionalLightType };
