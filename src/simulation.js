import CharacterFactory from "./character_factory.js";
import PromptFactory from "./prompt_factory.js";
import Utils from "./utils.js";
import OpenAI from "./open_ai.js";

class Simulation {
	constructor(onCharacterUpdate, logAction, logConversation, setConversationActive) {
		this.onCharacterUpdate = onCharacterUpdate;
		this.logAction = logAction;
		this.logConversation = logConversation;
		this.setConversationActive = setConversationActive;

		this.ensemble = ensemble;
		this.prototypeSelf = {}
		this.prototypeRelationship = {}
		this.volitions = {}
		this.turns = [],
		this.timer = 0;
		this.characterFactory = new CharacterFactory();
		this.openAI = new OpenAI();
		this.characterBios = {}

		this.conversationActive = false;
		this.conversationHistory = [];
		this.conversationInitiator = "";
		this.conversationResponder = "";
		this.conversationIsInitiatorTurn = false;
		this.conversationTurnCount = 0;
		
	}

	async loadConfiguration() {
		return Promise.all([
			fetch('./schema/schema.json'),
			fetch('./schema/cast.json'),
			fetch('./schema/triggerRules.json'),
			fetch('./schema/volitionRules.json'),
			fetch('./schema/actions.json'),
			fetch('./schema/history.json'),
		]).then(
			(responses) => Promise.all(responses.map((response) => response.json())))
		.then(function (data) {
			let schema, cast, triggerRules, volitionRules, actions, history;
			[schema, cast, triggerRules, volitionRules, actions, history] = data;
			this.ensemble.loadSocialStructure(data[0]);
			this.ensemble.addCharacters(cast);
			this.ensemble.addRules(triggerRules);
			this.ensemble.addRules(volitionRules);
			this.ensemble.addActions(actions);
			this.ensemble.addHistory(history);
		}.bind(this)); 
	}

	async loadCharacterFactory() {
		return this.characterFactory.initialize();
	}
	
	_loadStatePrototypes() {
		for (const schema of this.ensemble.getSchema()) {
			if (schema.category === "socialRecordLabel" || schema.category === "socialRecordLabelUndirected") {
				break;
			}
			if (schema.directionType === "undirected") {
				for (const type of schema.types){
					this.prototypeSelf[type] = schema.defaultValue
				}
			} else {
				for (const type of schema.types){
					this.prototypeRelationship[type] = schema.defaultValue
				}
			}
		}
	}

	// get last timestamp state; should be good for non-events
	getState() {
		var characters = this.ensemble.getCharacters()
		var character_states = {}
		for (const character of characters) {
			character_states[character] = {
				"self" : { ...this.prototypeSelf},
				"relationships" : {},
			}
			for (const c of characters) {
				if (c !== character) {
					character_states[character]["relationships"][c] = { ...this.prototypeRelationship}
				}
			}
		}
		let socialRecord = this.ensemble.getSocialRecord();
		for (const predicate of socialRecord[socialRecord.length - 1]) {
			if (predicate.type in this.prototypeSelf) {
				character_states[predicate.first]["self"][predicate.type] = predicate.value;
			} else if (predicate.type in this.prototypeRelationship) {
				character_states[predicate.first]["relationships"][predicate.second][predicate.type] = predicate.value;
			}
		}
		return character_states;
	}

	async initialize () {
		return Promise.all([
			this.loadConfiguration(),
			this.loadCharacterFactory(),
			this.openAI.initialize(), 
		]).then(function () {
			this._loadStatePrototypes();
			this.volitions = this.ensemble.calculateVolition(this.ensemble.getCharacters())
			// temp until character loading is finished
			let state = this.getState();
			for (const character of this.ensemble.getCharacters()) {
				let charData = this.characterFactory.newCharacter(!state[character]["self"]["is_man"]);
				this.characterBios[character] = charData;
			}
			this.resetTurns();
		}.bind(this));
	}

	doAction(action) {
		if (action.additionalEffects) {
			this.runAdditionalEffects(action)
		}
		this.ensemble.doAction(action);

		let message = "...";
		let name = "...";
		if (action.successMessage) {
			let bindings = action.goodBindings[0];
			name = bindings["initiator"];
			let format_data = {
				"initiator": Utils.capitalize(bindings["initiator"]),
				"responder": Utils.capitalize(bindings["responder"]),
			};
			message = Utils.format(action.successMessage, format_data)
		}
		this.logAction(name, action.name, message);


		this.ensemble.runTriggerRules(this.ensemble.getCharacters());
		this.volitions = this.ensemble.calculateVolition(this.ensemble.getCharacters())
	}

	getActions(character) {
		const intents = 5;
		const actionsPerIntent = 10;
		const actionsPerGroup = 10
		let actionList = []
		let characters = this.ensemble.getCharacters();
		Utils.shuffle(characters);
		for (const recipient of characters) {
			let character_actions = this.ensemble.getActions(
										character, 
										recipient, 
										this.volitions, 
										characters, 
										intents,
										actionsPerIntent,
										actionsPerGroup
									);
			actionList = actionList.concat(character_actions);
		}
		actionList.sort((a, b) => b.weight - a.weight);
		return actionList;
	}

	takeTurn(character) {
		console.log(`Taking turn as ${character}`)
		let actions = this.getActions(character);
		if (actions.length > 0) {
			this.doAction(actions[0]);
		}
		this.onCharacterUpdate()
	}

	getCharacters() {
		return this.ensemble.getCharacters();
	}

	step() {
		if (this.conversationActive) {
			this.conversationStep();
		}
		else if (this.turns.length > 0) {
			let turn = this.turns.pop()
			this.takeTurn(turn);
		} else {
			this.resetTurns();
			this.nextTimeStep();
		}
	}

	nextTimeStep() {
		this.ensemble.setupNextTimeStep();
	}

	resetTurns() {
		this.turns = this.ensemble.getCharacters();
		Utils.shuffle(this.turns)
	}
	
	resetConversation () {
		this.conversationActive = false;
		this.conversationHistory = [];
		this.conversationInitiator = "";
		this.conversationResponder = "";
		this.conversationIsInitiatorTurn = true;
		this.conversationTurnCount = 0;
	}

	startConversation(initiator, responder) {
		this.conversationActive = true;
		this.conversationHistory = [];
		this.conversationInitiator = initiator;
		this.conversationResponder = responder;
		this.conversationIsInitiatorTurn = true;
		this.conversationTurnCount = 0;
		this.setConversationActive(initiator, responder, true);
	}

	runAdditionalEffects(action) {
		let bindings = action.goodBindings[0];
		let initiator = bindings["initiator"];
		let responder = bindings["responder"];

		if (action.name === "FLIRT") {
			this.startConversation(initiator, responder);
		}
	}

	conversationStep() {
		let speaker = this.conversationResponder;
		let listener = this.conversationInitiator;
		if (this.conversationIsInitiatorTurn) {
			speaker = this.conversationInitiator;
			listener = this.conversationResponder;
		}
		let prompt = PromptFactory.speakerPromptFlirt(
			speaker,
			listener,
			this.conversationHistory,
			this.getState(),
			this.characterBios
		);

		this.openAI.gptRequest(prompt).then((result) => {
			console.log(result)
			let dialogue = result["data"]["choices"][0]["text"]
			this.logConversation(speaker, dialogue);
			this.conversationHistory.push([speaker, dialogue])
			this.conversationIsInitiatorTurn = !this.conversationIsInitiatorTurn;
		});

	}
}

export default Simulation;