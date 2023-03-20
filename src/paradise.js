import Game from "./game.js";
import OpenAI  from "./open_ai.js";

var game;

document.onreadystatechange = function () {
  if (document.readyState == "complete") {
	game = new Game();
	game.initialize().then(() => {
		console.log("READY");
	});
  }
}
