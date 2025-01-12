import Mesh from "./common/mesh";

class GLMesh extends Mesh<WebGLBuffer> {
    private VertexArrayObject!: WebGLVertexArrayObject | null;
    private indexFormat!: number;

    //numVertices, numIndices, numNormals, numUvs are the number of elements in the respective arrays (Not the actual number of vertices, indices, normals, uvs)
    constructor(vertices: Float32Array, numVertices: number, indices: Uint32Array | Uint16Array, numIndices: number, indexFormat: number, glContext: WebGL2RenderingContext) {
        super();
        this.indexCount = numIndices;
        this.vertexCount = numVertices / Mesh.STRIDE;
        this.indexFormat = indexFormat;
        this.createMesh(vertices, indices, glContext);
    }

    private createMesh(vertices: Float32Array, indices: Uint32Array | Uint16Array, glContext: WebGL2RenderingContext): void {
        // Create the mesh
        this.createBuffers(glContext);
        this.bind(glContext);
        this.createObjectShape(vertices, indices, glContext);
        this.unbind(glContext);
    }


    public renderMesh(glContext: WebGL2RenderingContext): void {
        // Render the mesh
        glContext.bindVertexArray(this.VertexArrayObject);
        glContext.bindBuffer(glContext.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        glContext.drawElements(glContext.TRIANGLES, this.indexCount, this.indexFormat, 0);
        glContext.bindVertexArray(null);
        glContext.bindBuffer(glContext.ELEMENT_ARRAY_BUFFER, null);
    }

    public clearMesh(glContext: WebGL2RenderingContext): void {
        // Clear the mesh
        if (this.indexBuffer) {
            glContext.deleteBuffer(this.indexBuffer);
            this.indexBuffer = null;
        }

        if (this.vertexBuffer) {
            glContext.deleteBuffer(this.vertexBuffer);
            this.vertexBuffer = null;
        }

        if (this.uvBuffer) {
            glContext.deleteBuffer(this.uvBuffer);
            this.uvBuffer = null;
        }

        if (this.normalBuffer) {
            glContext.deleteBuffer(this.normalBuffer);
            this.normalBuffer = null;
        }

        if (this.VertexArrayObject) {
            glContext.deleteVertexArray(this.VertexArrayObject);
            this.VertexArrayObject = null;
        }

        this.indexCount = 0;
    }

    private createBuffers(glContext: WebGL2RenderingContext): void {
        let VAO: WebGLVertexArrayObject | null = glContext.createVertexArray();
        if (!VAO) {
            console.error('Failed to create Vertex Array Object');
            return;
        }
        this.VertexArrayObject = VAO;

        let IBO: WebGLBuffer | null = glContext.createBuffer();
        if (!IBO) {
            console.error('Failed to create Index Buffer Object');
            return;
        }
        this.indexBuffer = IBO;

        let VBO: WebGLBuffer | null = glContext.createBuffer();
        if (!VBO) {
            console.error('Failed to create Vertex Buffer Object');
            return;
        }
        this.vertexBuffer = VBO;
    }

    // Bind the VAO and buffers
    private bind(glContext: WebGL2RenderingContext): void {
        glContext.bindVertexArray(this.VertexArrayObject);
        glContext.bindBuffer(glContext.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        glContext.bindBuffer(glContext.ARRAY_BUFFER, this.vertexBuffer);
        glContext.vertexAttribPointer(0, 3, glContext.FLOAT, false, Mesh.STRIDE * Float32Array.BYTES_PER_ELEMENT, 0);
        glContext.enableVertexAttribArray(0);

        glContext.bindBuffer(glContext.ARRAY_BUFFER, this.vertexBuffer);
        glContext.vertexAttribPointer(1, 3, glContext.FLOAT, false, Mesh.STRIDE * Float32Array.BYTES_PER_ELEMENT, 3 * Float32Array.BYTES_PER_ELEMENT);
        glContext.enableVertexAttribArray(1);

        glContext.bindBuffer(glContext.ARRAY_BUFFER, this.vertexBuffer);
        glContext.vertexAttribPointer(2, 2, glContext.FLOAT, false, Mesh.STRIDE * Float32Array.BYTES_PER_ELEMENT, 6 * Float32Array.BYTES_PER_ELEMENT);
        glContext.enableVertexAttribArray(2);
    }

    // Create the object shape with separate buffers
    private createObjectShape(vertices: Float32Array, indices: Uint32Array | Uint16Array, glContext: WebGL2RenderingContext): void {
        // Bind and buffer data for vertices
        glContext.bindBuffer(glContext.ARRAY_BUFFER, this.vertexBuffer);
        glContext.bufferData(glContext.ARRAY_BUFFER, vertices, glContext.STATIC_DRAW);

        // Bind and buffer data for indices
        glContext.bindBuffer(glContext.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        glContext.bufferData(glContext.ELEMENT_ARRAY_BUFFER, indices, glContext.STATIC_DRAW);
    }

    // Unbind the VAO and buffers
    private unbind(glContext: WebGL2RenderingContext): void {
        glContext.bindBuffer(glContext.ARRAY_BUFFER, null);
        glContext.bindVertexArray(null);
        glContext.bindBuffer(glContext.ELEMENT_ARRAY_BUFFER, null); // should unbind after unbinding the VAO
    }
}

export default GLMesh;
