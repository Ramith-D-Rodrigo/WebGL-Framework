import {LightType} from "./light/light";
import {DirectionalLightType} from "./light/DirectionalLight";
import Camera from "./camera";
import InputManager from "./InputManager";
import Mesh from "./mesh";
import Renderer from "./renderer";
import Scene from "./scene";
import { SceneObject } from "./SceneObject";
import Texture from "./texture";
import {calculateAvgNormal, checkWebGLVendor, checkWebGPUVendor} from "./utils";
import { MeshWithTextureType } from "./SceneObject";
import Stats from "./stats";
import CustomGUI from "./CustomGUI";
import CameraManipulator from "./CameraManipulator";
import Model from "./model";

//export all modules
export { Camera, InputManager, Mesh, Renderer, Scene, SceneObject, Texture, calculateAvgNormal, Stats, CustomGUI, checkWebGLVendor, checkWebGPUVendor, CameraManipulator, Model };

//export the Light interface
export type { LightType, DirectionalLightType, MeshWithTextureType};
