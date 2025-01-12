import { vec3 } from "gl-matrix";
import Camera from "./camera";
import CustomGUI from "./CustomGUI";

class guiCameraManipulator {

    private liveCameraData: {
        x: number,
        y: number,
        z: number,
        yaw: number,
        pitch: number,
    };

    constructor(camera: Camera, gui: CustomGUI) {
        this.liveCameraData = {
            x: camera.getPosition()[0],
            y: camera.getPosition()[1],
            z: camera.getPosition()[2],
            yaw: camera.getYaw(),
            pitch: camera.getPitch(),
        };
            
        const cameraFolder = gui.addFolder("Camera");
        
        // Add fields for live tracking (these will automatically update in real-time)
        gui.addFieldToFolder(cameraFolder, this.liveCameraData, "x", "X");
        gui.addFieldToFolder(cameraFolder, this.liveCameraData, "y", "Y");
        gui.addFieldToFolder(cameraFolder, this.liveCameraData, "z", "Z");
        gui.addFieldToFolder(cameraFolder, this.liveCameraData, "yaw", "Yaw");
        gui.addFieldToFolder(cameraFolder, this.liveCameraData, "pitch", "Pitch");

        const inputCameraData = { ...this.liveCameraData,
            setCamera: () => {
                // Update the camera using input data
                camera.setPosition(vec3.fromValues(inputCameraData.x, inputCameraData.y, inputCameraData.z));
                camera.setYaw(inputCameraData.yaw);
                camera.setPitch(inputCameraData.pitch);
            }
        }; // Clone for manual input
        
        // Add fields for manual input (these won't auto-update)
        cameraFolder.add(inputCameraData, "x").name("Set X");
        cameraFolder.add(inputCameraData, "y").name("Set Y");
        cameraFolder.add(inputCameraData, "z").name("Set Z");
        cameraFolder.add(inputCameraData, "yaw").name("Set Yaw");
        cameraFolder.add(inputCameraData, "pitch").name("Set Pitch");
        
        cameraFolder.add(inputCameraData, "setCamera").name("Apply");
    }

    public updateCameraData(camera: Camera) {
        this.liveCameraData.x = camera.getPosition()[0];
        this.liveCameraData.y = camera.getPosition()[1];
        this.liveCameraData.z = camera.getPosition()[2];
        this.liveCameraData.yaw = camera.getYaw();
        this.liveCameraData.pitch = camera.getPitch();
    }
}

export default guiCameraManipulator;