import Game from "./game.js";

var game;

document.onreadystatechange = function () {
  if (document.readyState == "complete") {
    game = new Game();
    Window.GAME = game;
    game.initialize().then(() => {
      console.log("READY");
    });
    }
}

export default game;
