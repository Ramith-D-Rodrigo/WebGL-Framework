import Texture from "./common/texture";

//class to load and store textures
class GLTexture extends Texture<WebGLTexture> {
    private bitMap: ImageBitmap;

    private constructor(bitMap: ImageBitmap, gl: WebGL2RenderingContext) {
        super();
        this.texture = null;
        this.bitMap = bitMap;
    }

    public static async createTextureFromFilePath(fileLocation: string, gl: WebGL2RenderingContext): Promise<GLTexture> {
        const image = await GLTexture.loadImage(fileLocation);
        if(!image) {
            throw new Error('Failed to load texture ' + fileLocation);
        }
        const bitMap = await createImageBitmap(image);
        const texture = new GLTexture(bitMap, gl);
        
        const result = GLTexture.tryLoadTexture(texture, gl);
        if(!result) {
            throw new Error('Failed to load texture ' + fileLocation);
        }

        return texture;
    }

    public static async createTextureFromImage(image: HTMLImageElement, gl: WebGL2RenderingContext): Promise<GLTexture> {
        const bitMap = await createImageBitmap(image);
        const texture = new GLTexture(bitMap, gl);
        const result = GLTexture.tryLoadTexture(texture, gl);
        if(!result) {
            throw new Error('Failed to load texture from image');
        }

        return texture;
    }

    public static createTextureFromBitmap(bitmap: ImageBitmap, gl: WebGL2RenderingContext): GLTexture {
        const texture = new GLTexture(bitmap, gl);
        const result = GLTexture.tryLoadTexture(texture, gl);
        if(!result) {
            throw new Error('Failed to load texture from bitmap');
        }

        return texture;
    }

    private static tryLoadTexture(texture: GLTexture, gl: WebGL2RenderingContext) : boolean {
        let result = texture.loadTextureAlpha(gl);
        if(!result) {
            result = texture.loadTexture(gl);
        }

        return result;
    }


    private loadTexture(gl: WebGL2RenderingContext) : boolean {
        if(!this.bitMap) {
            console.error('Failed to load texture');
            return false;
        }

        //bind the image to the texture
        this.bindTextureAndParameters(gl);

        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, this.bitMap.width, this.bitMap.height, 0, gl.RGB, gl.UNSIGNED_BYTE, this.bitMap);
        gl.generateMipmap(gl.TEXTURE_2D);

        //unbind the texture
        gl.bindTexture(gl.TEXTURE_2D, null);
        return true;
    }

    private loadTextureAlpha(gl: WebGL2RenderingContext) : boolean {
        if(!this.bitMap) {
            console.error('Failed to load texture');
            return false;
        }

        //bind image to the texture
        this.bindTextureAndParameters(gl);

        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.bitMap.width, this.bitMap.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, this.bitMap);
        //gl.generateMipmap(gl.TEXTURE_2D);

        //unbind the texture
        gl.bindTexture(gl.TEXTURE_2D, null);
        this.bitMap.close();
        return true;
    }

    private async bindTextureAndParameters(gl: WebGL2RenderingContext) {
        this.texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.texture);

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);  //when zooming out
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);  //when zooming in
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAX_LOD, 8);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_LOD, 0);

        //max aniostropy
        const ext = gl.getExtension('EXT_texture_filter_anisotropic');
        if(ext) {
            gl.texParameterf(gl.TEXTURE_2D, ext.TEXTURE_MAX_ANISOTROPY_EXT, 1);
        }
    }


    public clearTexture(gl: WebGL2RenderingContext) {
        gl.deleteTexture(this.texture);
        this.texture = null;
        this.bitMap.close();
    }

    public useTexture(gl: WebGL2RenderingContext, uniformTexture: WebGLUniformLocation) {
        gl.activeTexture(gl.TEXTURE0); //texture unit 0
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.uniform1i(uniformTexture, 0); //set the texture to use texture unit 0
    }

    public static async createPlainTexture(glContext: WebGL2RenderingContext): Promise<GLTexture> {
        const plainTexture = await GLTexture.createTextureFromFilePath("assets/textures/plain.png", glContext);
        return plainTexture;
    }
}

export default GLTexture;