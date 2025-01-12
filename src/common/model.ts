import { GLTFMeshPrimitivePostprocessed, GLTFPostprocessed } from "@loaders.gl/gltf";

class Model {
    protected totalVertices: number;
    protected totalIndices: number;
    protected totalPolygons: number;
    protected processedData: GLTFPostprocessed | null;

    constructor() {
        this.totalVertices = 0;
        this.totalIndices = 0;
        this.totalPolygons = 0;
        this.processedData = null;
    }

    protected checkForAlphaBlending(primitive: GLTFMeshPrimitivePostprocessed) : boolean {
        if(!primitive.material) {
            return false;
        }

        const alphaMode = primitive.material.alphaMode;
        if(alphaMode === 'BLEND') {
            return true;
        }

        return false;
    }

    public getModelInfo() : {totalVertices: number, totalIndices: number, totalPolygons: number} {
        return {
            totalVertices: this.totalVertices,
            totalIndices: this.totalIndices,
            totalPolygons: this.totalPolygons
        }
    }

    protected calculateModelInfo() {
        if(!this.processedData) {
            throw new Error('No processed data found');
        }

        for(let i = 0; i < this.processedData.meshes.length; i++) {
            const mesh = this.processedData.meshes[i];
            for(let j = 0; j < mesh.primitives.length; j++) {
                const primitive = mesh.primitives[j];
                if(this.checkForAlphaBlending(primitive)) {
                    continue;
                }

                if(!primitive.indices) {
                    throw new Error('No indices found for the primitive');
                }

                this.totalPolygons += primitive.indices.count / 3;
                this.totalVertices += primitive.attributes.POSITION.count;
                this.totalIndices += primitive.indices.count;
            }
        }
    }
}

export default Model;