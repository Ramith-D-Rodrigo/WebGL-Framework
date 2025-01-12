import dat from "dat.gui";

class CustomGUI {
    private gui: dat.GUI;

    constructor() {
        //left aligned GUI
        this.gui = new dat.GUI({ autoPlace: false });
        this.gui.domElement.style.position = 'absolute';
        this.gui.domElement.style.top = '0';
        this.gui.domElement.style.left = '0';
        const customContainer = document.getElementById('gui');
        if (customContainer) {
            customContainer.appendChild(this.gui.domElement);
        }
        else{
            document.body.appendChild(this.gui.domElement);
        }
    }

    public addField(object: any, field: string, fieldName?: string) {
        const con = this.gui.add(object, field).listen();

        if(fieldName)
            con.name(fieldName);
    }

    public addFolder(folderName: string) {
        return this.gui.addFolder(folderName);
    }

    public addFieldToFolder(folder: dat.GUI, object: any, field: string, fieldName?: string) {
        const con = folder.add(object, field).listen();

        if(fieldName)
            con.name(fieldName);
    }
}

export default CustomGUI;