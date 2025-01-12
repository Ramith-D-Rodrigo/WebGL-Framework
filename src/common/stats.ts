import * as dat from 'dat.gui';

const MAX_CSV_RECORDS = 1000;

class Stats {
    private gui!: dat.GUI;
    private guiObject!: any;

    private previousFrameTimestamp: number;
    private ext: any; // For WebGL timer query extension
    private gl?: WebGL2RenderingContext;
    private gpuQueries: { query: WebGLQuery }[] = [];
    private activeQuery!: WebGLQuery | null;

    private currJSMeasure: number = 0;

    private recording: boolean = false;
    private frameTimes: number[] = [];
    private jsTimes: number[] = [];
    private fps: number[] = [];
    private webGLTimes: number[] = [];
    private webGPUTimes: number[] = [];

    private recordingGUIButton: any;

    private resultBuffer?: GPUBuffer;
    
    constructor(gl: WebGL2RenderingContext | null, resultBuffer: GPUBuffer | null) {
        if (gl !== null) {
            this.gl = gl;
            this.ext = this.gl.getExtension('EXT_disjoint_timer_query_webgl2');
        }

        if(resultBuffer !== null) {
            this.resultBuffer = resultBuffer;
        }

        this.previousFrameTimestamp = 0;

        // Initialize GUI fields for FPS, CPU time, and GPU time
        this.guiObject = {
            FPS: 0,
            Frame_Time: 0,
            JS_TIME: 0,
            WEBGL_TIME: 0,
            WEBGPU_TIME: 0,
            toggleRecording: () => {
                this.toggleRecord();
            }

        };
        this.gui = new dat.GUI({ name: 'Profiler' });
        this.gui.add(this.guiObject, 'FPS').listen();
        this.gui.add(this.guiObject, 'Frame_Time', 'Frame Time').listen();
        this.gui.add(this.guiObject, 'JS_TIME', 'JS Time').listen();
        this.gui.add(this.guiObject, 'WEBGL_TIME', 'WebGL Time').listen();
        this.gui.add(this.guiObject, 'WEBGPU_TIME', 'WebGPU Time').listen();
        this.recordingGUIButton = this.gui.add(this.guiObject, 'toggleRecording').name('Start Recording');
        
    }

    public toggleRecord() {
        if(this.recording){
            // stop and save recording
            this.recording = false;

            //export to csv
            exportCSV(this.frameTimes, this.jsTimes, this.fps, this.webGLTimes, this.webGPUTimes);

            this.recordingGUIButton.name('Start Recording');
        }
        else {
            this.recording = true;
            this.frameTimes = [];
            this.jsTimes = [];
            this.fps = [];
            this.webGLTimes = [];
            this.webGPUTimes = [];
            this.recordingGUIButton.name('Stop Recording');
        }
    }

    public updateFrameTime(timestamp: number) {
        if (this.previousFrameTimestamp !== 0) {
            this.guiObject.Frame_Time = timestamp - this.previousFrameTimestamp;
        }
        this.previousFrameTimestamp = timestamp;
    }

    public startJSMeasure() {
        this.currJSMeasure = performance.now();
    }

    public endJSMeasure() {
        this.guiObject.JS_TIME = performance.now() - this.currJSMeasure;
    }

    public updateFPS(fps: number) {
        this.guiObject.FPS = fps;

        // we can use this to record the performance
        if(this.recording) {
            this.frameTimes.push(this.guiObject.Frame_Time);
            this.jsTimes.push(this.guiObject.JS_TIME);
            this.fps.push(this.guiObject.FPS);
            this.webGLTimes.push(this.guiObject.WEBGL_TIME);
            this.webGPUTimes.push(this.guiObject.WEBGPU_TIME);

            //stop the recording after MAX_CSV_RECORDS
            if(this.frameTimes.length >= MAX_CSV_RECORDS) {
                this.recordingGUIButton.name('Start Recording');
                this.recording = false;

                //export to csv
                exportCSV(this.frameTimes, this.jsTimes, this.fps, this.webGLTimes, this.webGPUTimes);
            }
        }
    }

    public startGPUMeasure() {
        if (this.gl && this.ext) {
            if (this.activeQuery) {
                // End the previous query if it's still active
                this.gl.endQuery(this.ext.TIME_ELAPSED_EXT);
            }
        
            this.activeQuery = this.gl.createQuery();
            if (this.activeQuery !== null) {
                this.gl.beginQuery(this.ext.TIME_ELAPSED_EXT, this.activeQuery);
            }
        }
    }

    public endGPUMeasure() {
        if (this.gl && this.ext && this.activeQuery) {
            this.gl.endQuery(this.ext.TIME_ELAPSED_EXT);
            // Add the active query to the gpuQueries array and reset it
            this.gpuQueries.push({ query: this.activeQuery });
            this.activeQuery = null;
        }
    }

    public updateGPUTime() {
        let totalGpuDuration = 0;

        this.gpuQueries.forEach((queryInfo, index) => {
            if (this.gl) {
                const available = this.gl.getQueryParameter(queryInfo.query, this.gl.QUERY_RESULT_AVAILABLE);
                const disjoint = this.gl.getParameter(this.ext.GPU_DISJOINT_EXT);

                if (available && !disjoint) {
                    const elapsed = this.gl.getQueryParameter(queryInfo.query, this.gl.QUERY_RESULT);
                    const duration = elapsed * 1e-6;  // Convert nanoseconds to milliseconds
                    totalGpuDuration += duration;
                    this.gl.deleteQuery(queryInfo.query);
                    this.gpuQueries.splice(index, 1);  // Remove the processed query
                }
            }
        });

        this.guiObject.WEBGL_TIME = totalGpuDuration;

        if(this.resultBuffer){
            const resultBuffer = this.resultBuffer as GPUBuffer;
            if (resultBuffer.mapState === 'unmapped') {
                resultBuffer.mapAsync(GPUMapMode.READ).then(() => {
                    const times = new BigInt64Array(resultBuffer.getMappedRange());
                    this.guiObject.WEBGPU_TIME = Number(times[1] - times[0]) * 1e-6;  // Convert nanoseconds to milliseconds
                    this.resultBuffer?.unmap();
                });
            }
        }
    }
}

const exportCSV = (frameTimes: number[], jsTimes: number[], fps: number[], webGLTimes: number[], webGPUTimes: number[]) => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Frame Time,JS Time,FPS,WebGL Time,WebGPU Time\n";
    frameTimes.forEach((frameTime, index) => {
        csvContent += `${frameTime},${jsTimes[index]},${fps[index]},${webGLTimes[index]},${webGPUTimes[index]}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "performance.csv");
    document.body.appendChild(link); // Required for FF
    link.click();
    document.body.removeChild(link);
}

export default Stats;
