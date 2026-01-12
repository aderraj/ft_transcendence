export class InputController {
    constructor() {
        this.keys = {};
        
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleKeyUp = this.handleKeyUp.bind(this);

        window.addEventListener('keydown', this.handleKeyDown);
        window.addEventListener('keyup', this.handleKeyUp);
    }

    handleKeyDown(e) {
        this.keys[e.key] = true;
    }

    handleKeyUp(e) {
        this.keys[e.key] = false;
    }

    /**
     * Checks if a specific key is currently held down.
     * Used by the Game Loop to determine movement.
     * @param {string} key - The key value (e.g., 'w', 'ArrowUp')
     */
    isKeyPressed(key) {
        return !!this.keys[key];
    }

    /**
     * Clean up event listeners when the game component unmounts.
     * Crucial for SPA (Single Page Applications) like React.
     */
    destroy() {
        window.removeEventListener('keydown', this.handleKeyDown);
        window.removeEventListener('keyup', this.handleKeyUp);
        this.keys = {};
    }
}