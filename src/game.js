import Simulation from "./simulation.js"
import UIManager from "./ui_manager.js"

class Game {
    constructor() {
        this.simulation = new Simulation(
            () => this.updateCharacters(),
            (name, action, description) => this.logAction(name, action, description),
            (name, text) => this.logConversation(name, text),
            (initiator, recipient) => this.toggleConversation(initiator, recipient),
        )
        this.ui = new UIManager(() => this.step());
    }

    async initialize() {
        return this.simulation.initialize()
            .then(function () {
                this.ui.addCharacters(
                    this.simulation.getCharacters(),
                    this.simulation.characterBios,
                    this.simulation.getState()
                );
            }.bind(this));
    }

    step() {
        this.simulation.step()
    }

    updateCharacters() {
        let state = this.simulation.getState();
        this.ui.updateCharacters(state);
    }

    logAction(name, action, description) {
        this.ui.logAction(name, action, description);
    }

    logConversation(name, text) {
        this.ui.logConversation(name, text);
    }

    toggleConversation(initiator, recipient) {
        this.ui.toggleConversation(initiator, recipient);
    }

}

export default Game;