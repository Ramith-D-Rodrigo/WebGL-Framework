import {Scene} from "./common/index";
import GLTexture from "./glTexture";
import GLMesh from "./glMesh";
import { GLSceneObject } from "./glSceneObject";

class GLScene extends Scene<GLMesh, GLTexture>{

    private static instance: GLScene | null = null;

    private constructor() {
        super();
        if(GLScene.instance) {
            return GLScene.instance;
        }
        this.sceneObjects = [];
        GLScene.instance = this;
    }

    public static getInstance(): GLScene {
        return new GLScene();
    }

    public removeAllSceneObjects(gl: WebGL2RenderingContext): void {
        for(const obj of this.sceneObjects) {
            const sceneObject = obj as GLSceneObject;
            sceneObject.clear(gl);
        }

        this.sceneObjects = [];
    }
}

export default GLScene;
