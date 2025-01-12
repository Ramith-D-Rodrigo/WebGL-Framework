
class Texture<T> {
    protected texture: T | null;

    protected constructor() {
        this.texture = null;
    }

    protected static async loadImage(filePath: string) : Promise<HTMLImageElement | null> {
        let blob = await Texture.getImageBlob(filePath);
        if(!blob) {
            console.error('Failed to load texture ' + filePath);
            return null;
        }

        let image = new Image();
        image.src = URL.createObjectURL(blob);
        await image.decode();
        return image;
    }

    protected static async getImageBlob(filePath: string) : Promise<Blob | null> {
        let response = await fetch(filePath);
        if(!response.ok) {
            console.error('Failed to load texture ' + filePath);
            return null;
        }

        return await response.blob();
    }
}

export default Texture;