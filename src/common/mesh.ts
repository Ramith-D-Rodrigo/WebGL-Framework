class Mesh<T> {
    protected vertexBuffer: T | null; 
    protected indexBuffer: T | null;
    protected normalBuffer: T | null;
    protected uvBuffer: T | null;

    protected indexCount : number;
    protected vertexCount : number;

    public static readonly STRIDE : number = 3 + 3 + 2;

    constructor() {
        this.vertexBuffer = null;
        this.indexBuffer = null;
        this.normalBuffer = null;
        this.uvBuffer = null;
        this.indexCount = 0;
        this.vertexCount = 0;
    }

    public getIndicesCount(): number {
        return this.indexCount;
    }

    public getVerticesCount(): number {
        return this.vertexCount;
    }

    public getPolygonCount(): number {
        return this.indexCount / 3;
    }
}

export default Mesh;
