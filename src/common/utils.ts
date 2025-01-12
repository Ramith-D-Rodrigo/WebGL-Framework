import { vec3 } from 'gl-matrix';

function calculateAvgNormal(indices: number[] | Uint16Array | Uint32Array, vertices: number[] | Float32Array, vertexLength: number): Float32Array {
    let normals: Float32Array = new Float32Array(vertices.length);
    for(let i = 0; i < indices.length; i += 3) {
        let index1 = indices[i] * vertexLength;
        let index2 = indices[i + 1] * vertexLength;
        let index3 = indices[i + 2] * vertexLength;

        let v1: vec3 = vec3.fromValues(
            vertices[index2] - vertices[index1],
            vertices[index2 + 1] - vertices[index1 + 1], 
            vertices[index2 + 2] - vertices[index1 + 2]
        );

        let v2: vec3 = vec3.fromValues(
            vertices[index3] - vertices[index1],
            vertices[index3 + 1] - vertices[index1 + 1], 
            vertices[index3 + 2] - vertices[index1 + 2]
        );

        let normal: vec3 = vec3.cross(vec3.create(), v1, v2);
        normal = vec3.normalize(normal, normal);

        normals[index1] += normal[0];
        normals[index1 + 1] += normal[1];
        normals[index1 + 2] += normal[2];

        normals[index2] += normal[0];
        normals[index2 + 1] += normal[1];
        normals[index2 + 2] += normal[2];

        normals[index3] += normal[0];
        normals[index3 + 1] += normal[1];
        normals[index3 + 2] += normal[2];
    }

    for(let i = 0; i < normals.length / vertexLength; i++) {
        let normal: vec3 = vec3.fromValues(normals[i], normals[i + 1], normals[i + 2]);
        normal = vec3.normalize(normal, normal);
        normal[i] = normal[0];
        normal[i + 1] = normal[1];
        normal[i + 2] = normal[2];
    }

    return normals;
}

function checkWebGLVendor(gl: WebGLRenderingContext): void {
    const ext = gl.getExtension('WEBGL_debug_renderer_info') as WEBGL_debug_renderer_info;
    const vendor = gl.getParameter(ext.UNMASKED_VENDOR_WEBGL);
    const renderer = gl.getParameter(ext.UNMASKED_RENDERER_WEBGL);
    console.log(`WebGL vendor: ${vendor}, renderer: ${renderer}`);
}

function checkWebGPUVendor(adapter: GPUAdapter): void {
    console.log(`WebGPU vendor: ${adapter.info.vendor}, architecture: ${adapter.info.architecture}`);
}

export { calculateAvgNormal, checkWebGLVendor, checkWebGPUVendor };