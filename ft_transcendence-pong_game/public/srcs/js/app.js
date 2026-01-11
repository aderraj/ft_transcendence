import { LocalGame } from "./LocalGame.js";

const game = new LocalGame('canvas', 1000, 600);

document.getElementById('resetBtn').addEventListener('click', () => {
    game.start();
});

game.start();