class InputManager {
    private keys!: Map<string, boolean>;
    private mouseXMove!: number;
    private mouseYMove!: number;
    private isMousePressed!: boolean;

    private mouseMovementTimerId!: number | null;

    private static instance: InputManager | null = null;

    private constructor() {
        this.keys = new Map<string, boolean>();

        this.mouseXMove = 0;
        this.mouseYMove = 0;
        this.mouseMovementTimerId = null;
        this.isMousePressed = false;

        //Set up the key event listeners
        window.addEventListener('keydown', this.keyCallback.bind(this));
        window.addEventListener('keyup', this.keyCallback.bind(this));

        //Set up the mouse event listeners
        window.addEventListener('mousemove', this.mouseCallback.bind(this));
        window.addEventListener('mousedown', this.mousePressingCallback.bind(this));
        window.addEventListener('mouseup', this.mouseReleasingCallback.bind(this));

        InputManager.instance = this;
    }

    public static getInstance(): InputManager {
        if(this.instance) {
            return this.instance;
        }

        this.instance = new InputManager();
        return this.instance;
    }

    
    private keyCallback(event: KeyboardEvent): void {
        let keyCode = event.key;
        if (event.type === 'keydown') {
            this.keys.set(keyCode, true);
        } else if (event.type === 'keyup') {
            this.keys.set(keyCode, false);
        }
    }

    private mouseCallback(event: MouseEvent): void {
        if(!this.isMousePressed) {
            return;
        }

        this.mouseXMove = event.movementX;
        this.mouseYMove = -event.movementY; // Invert the y-axis

        if(!this.mouseMovementTimerId) {
            this.mouseMovementTimerId = requestAnimationFrame(() => {
                this.mouseXMove = 0;
                this.mouseYMove = 0;
                this.mouseMovementTimerId = null;
            });
        }
    }

    private mousePressingCallback(event: MouseEvent): void {
        this.isMousePressed = true;
    }

    private mouseReleasingCallback(event: MouseEvent): void {
        this.isMousePressed = false;
    }

    public getMouseXMove(): number {
        return this.mouseXMove;
    }

    public getMouseYMove(): number {
        return this.mouseYMove;
    }

    public isKeyPressed(key: string): boolean {
        return this.keys.get(key) || false;
    }

    public getKeys(): Map<string, boolean> {
        return this.keys;
    }
}

export default InputManager;
