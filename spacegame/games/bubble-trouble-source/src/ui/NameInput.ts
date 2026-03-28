import { Container, Graphics, Text } from 'pixi.js';

/** A simple name input component using DOM element overlaid on canvas */
export class NameInput extends Container {
    private _bg: Graphics;
    private _label: Text;
    private _inputElement: HTMLInputElement;
    private _divElement: HTMLDivElement;
    private _isVisible: boolean = false;

    constructor() {
        super();

        // Create background panel
        this._bg = new Graphics()
            .roundRect(-150, -25, 300, 50, 10)
            .fill({ color: 0xffffff, alpha: 0.9 })
            .stroke({ width: 2, color: 0x49c8ff });
        this.addChild(this._bg);

        // Create label
        this._label = new Text({
            text: 'NAME:',
            style: {
                fontSize: 16,
                fontFamily: 'Bungee Regular',
                fill: 0x000000,
                align: 'left',
            },
        });
        this._label.anchor.set(0, 0.5);
        this._label.x = -130;
        this._label.y = 0;
        this.addChild(this._label);

        // Create DOM input element
        this._divElement = document.createElement('div');
        this._divElement.style.position = 'absolute';
        this._divElement.style.pointerEvents = 'auto';
        this._divElement.style.zIndex = '1000';
        this._divElement.style.display = 'block';

        this._inputElement = document.createElement('input');
        this._inputElement.type = 'text';
        this._inputElement.maxLength = 10;
        this._inputElement.placeholder = 'Enter name';
        this._inputElement.style.fontSize = '16px';
        this._inputElement.style.fontFamily = 'Bungee Regular, sans-serif';
        this._inputElement.style.border = 'none';
        this._inputElement.style.outline = 'none';
        this._inputElement.style.background = 'rgba(255, 255, 255, 0.1)';
        this._inputElement.style.color = '#000000';
        this._inputElement.style.width = '120px';
        this._inputElement.style.height = '30px';
        this._inputElement.style.padding = '0 5px';
        this._inputElement.style.boxSizing = 'border-box';
        this._inputElement.style.textAlign = 'left';
        this._inputElement.style.cursor = 'text';
        this._inputElement.style.borderRadius = '4px';

        this._divElement.appendChild(this._inputElement);
        document.body.appendChild(this._divElement);

        // Load saved name
        const savedName = localStorage.getItem('playerName') || '';
        this._inputElement.value = savedName;

        // Update position when transform changes
        this.on('transform', () => this._updateDOMPosition());
    }

    /** Update DOM element position to match Pixi container */
    private _updateDOMPosition() {
        if (!this._isVisible) return;

        const canvas = document.querySelector('canvas') as HTMLCanvasElement;
        if (!canvas) return;

        const bounds = canvas.getBoundingClientRect();

        // Get global position of this container
        const globalPos = this.getGlobalPosition();

        // The input should be positioned to the right of the "NAME:" label
        // Adjust offset: move left (~155px) and up (~65px)
        const inputX = bounds.left + globalPos.x - 155;
        const inputY = bounds.top + globalPos.y - 65;

        this._divElement.style.left = `${inputX}px`;
        this._divElement.style.top = `${inputY}px`;
    }

    /** Public method to update DOM position (call after resize) */
    public updatePosition() {
        this._updateDOMPosition();
    }

    /** Show the input */
    public show() {
        this._isVisible = true;
        this._divElement.style.display = 'block';
        this._updateDOMPosition();
    }

    /** Hide the input */
    public hide() {
        this._isVisible = false;
        this._divElement.style.display = 'none';
    }

    /** Get the current input value */
    public getValue(): string {
        return this._inputElement.value.trim() || 'Player';
    }

    /** Set the input value */
    public setValue(value: string): void {
        this._inputElement.value = value;
        localStorage.setItem('playerName', value);
    }

    /** Focus the input */
    public focus(): void {
        this._inputElement.focus();
    }

    /** Save the current value to localStorage */
    public save(): void {
        const value = this._inputElement.value.trim();
        if (value) {
            localStorage.setItem('playerName', value);
        }
    }

    /** Destroy the component and clean up DOM elements */
    public destroy(): void {
        this.hide();
        if (this._divElement.parentNode) {
            this._divElement.parentNode.removeChild(this._divElement);
        }
        super.destroy();
    }
}
