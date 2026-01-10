class InputController {
    constructor(game) {
        this.game = game;
        this.keys = {};
        this.setUpListeners();
    }

    setUpListeners() {
        window.addEventListener('keydown', (event) => {
            console.log(event);
            this.keys[event.key] = true;
        });
        
        window.addEventListener('keyup', (event) => {
            this.keys[event.key] = false;
        });
    }

    updateLocalGame ()
    {
        if (this.keys['ArrowUp'])
        {
            this.game.moveHostPaddleUp();
            return;
        }
        if (this.keys['ArrowDown'])
        {
            this.game.moveHostPaddleDown();
            return;
        }

        if (this.keys['w'])
        {
            this.game.moveGuestPaddleUp();
            return;
        }
        if (this.keys['s'])
        {
            this.game.moveGuestPaddleDown();
            return;
        }
    }

    updatRemoteGame ()
    {
        if (this.keys['w'] || this.keys['ArrowUp'])
           return ;
        if (this.keys['s'] || this.keys['ArrowDown'])
           return ;
    }
        
    isPressingKey(key){
        return this.keys[key] || false;
    }
}

export { InputController };