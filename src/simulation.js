import CharacterFactory from "./character_factory.js";
import PromptFactory from "./prompt_factory.js";
import Utils from "./utils.js";
import OpenAI from "./open_ai.js";

class Simulation {
	constructor(onCharacterUpdate, logAction, logConversation, setConversationActive, setLocked) {
		this.onCharacterUpdate = onCharacterUpdate;
		this.logAction = logAction;
		this.logConversation = logConversation;
		this.setConversationActive = setConversationActive;
		this.setLocked = setLocked;

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

	setStartingConditions () {
		let genders = [true, false, true, false]
		for (const is_man of genders) {
			let data = this.characterFactory.newCharacter(!is_man);
			let name = data["name"]
			this.characterBios[name] = data;
			this.ensemble.addCharacter(name, { "name": data["displayName"] })
			if (!is_man) {
				this.ensemble.set({
					"category" : "traits",
					"type" : "is_man",
					"first" : name,
					"value" : false
				});
			}
		}
		
	}

	async initialize () {
		return Promise.all([
			this.loadConfiguration(),
			this.loadCharacterFactory(),
			this.openAI.initialize(), 
		]).then(function () {
			this._loadStatePrototypes();
			this.setStartingConditions();
			this.volitions = this.ensemble.calculateVolition(this.ensemble.getCharacters())
			// temp until character loading is finished
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
			if (this.conversationIsInitiatorTurn) {
				this.takeTurn(this.conversationInitiator);
			}
			else {
				this.takeTurn(this.conversationResponder);
			}
			this.conversationIsInitiatorTurn = !this.conversationIsInitiatorTurn;
		}
		else if (this.turns.length > 0) {
			let turn = this.turns.pop()
			this.takeTurn(turn);
			this.setLocked(false);
		} else {
			this.resetTurns();
			this.nextTimeStep();
			this.setLocked(false);
		}
	}

	nextTimeStep() {
		this.ensemble.setupNextTimeStep();
	}

	resetTurns() {
		this.turns = this.ensemble.getCharacters();
		Utils.shuffle(this.turns)
	}
	

	runAdditionalEffects(action) {
		let bindings = action.goodBindings[0];
		let initiator = bindings["initiator"];
		let responder = bindings["responder"];

		if (action.name === "FLIRT") {
			this.startConversation(initiator, responder);
		} 
		else if (action.name === "TALK") {
			this.continueConversation(initiator, responder);
		}
		else if (action.name === "END") {
			this.endConversation(initiator, responder);
		}
	}

	startConversation(initiator, responder) {
		this.conversationActive = true;
		this.conversationHistory = [];
		this.conversationInitiator = initiator;
		this.conversationResponder = responder;
		this.conversationTurnCount = 0;
		this.setConversationActive(initiator, responder, true);
		this.ensemble.set({
			"category" : "relationship_status",
			"type" : "in_conversation",
			"first" : initiator,
			"second": responder,
			"value" : true
		})
		this.ensemble.set({
			"category" : "relationship_status",
			"type" : "in_conversation",
			"first" : responder,
			"second": initiator,
			"value" : true
		})
		this.ensemble.set({
			"category" : "internal",
			"type" : "conversation_interest",
			"first" : initiator,
			"operator": "=",
			"value" : 10
		})
		this.ensemble.set({
			"category" : "internal",
			"type" : "conversation_interest",
			"first" : responder,
			"operator": "=",
			"value" : 10
		})

		let prompt = PromptFactory.speakerPromptInitiate(
			initiator,
			responder,
			this.getState(),
			this.characterBios,
		);
		console.log(prompt);

		this.dialogueExchange(initiator, responder, prompt,
			(speaker, listener, dialogue) => {
				this.conversationIsInitiatorTurn = false;
				this.responseFunctionBase(speaker, listener, dialogue);
			}
		);
	}

	endConversation(initiator, responder) {
		this.conversationActive = false;
		this.conversationHistory = [];
		this.conversationInitiator = "";
		this.conversationResponder = "";
		this.conversationTurnCount = 0;
		let prompt = PromptFactory.speakerPromptEnd(
			initiator,
			responder,
			this.conversationHistory,
			this.getState(),
			this.characterBios
		);

		this.dialogueExchange(initiator, responder, prompt, 
		(speaker, listener, dialogue) => {
			this.ensemble.set({
				"category" : "relationship_status",
				"type" : "in_conversation",
				"first" : initiator,
				"second": responder,
				"value" : false
			})
			this.ensemble.set({
				"category" : "relationship_status",
				"type" : "in_conversation",
				"first" : responder,
				"second": initiator,
				"value" : false
			})
			this.ensemble.set({
				"category" : "relationships",
				"type" : "in_conversation",
				"first" : initiator,
				"second": responder,
				"value" : false
			})
			this.ensemble.set({
				"category" : "relationship_status",
				"type" : "in_conversation",
				"first" : initiator,
				"second": responder,
				"value" : false
			})
			this.responseFunctionBase(speaker, listener, dialogue);
			this.setConversationActive(speaker, listener, false);
		});
	}

	continueConversation(speaker, listener) {
		let prompt = PromptFactory.speakerPromptTalk(
			speaker,
			listener,
			this.conversationHistory,
			this.getState(),
			this.characterBios
		);
		console.log(prompt);

		this.dialogueExchange(speaker, listener, prompt, 
		(speaker, listener, dialogue) => {
			this.responseFunctionBase(speaker, listener, dialogue);
		});
	}

	async whatWouldThisLooklike(speaker, listener, cleanup) {
		speaker()
		.results() 

	}
	dialogueExchange(speaker, listener, prompt, responseFunction) {
		this.openAI.gptRequest(prompt)
		.then((result) => {
			console.log(result)
			let dialogue = result["data"]["choices"][0]["text"]
			if (dialogue.trim() === "") {
				dialogue = "\"...\""
			}
			return dialogue;
		}).then((dialogue) => {
			this.listenerUpdate(speaker, listener, dialogue)
			.then(() => {responseFunction(speaker, listener, dialogue)});
		})
	}

	async responseFunctionBase(speaker, listener, dialogue) {
		this.logConversation(speaker, dialogue);
		this.conversationHistory.push([speaker, dialogue])
		this.ensemble.set({
			"category" : "internal",
			"type" : "conversation_interest",
			"first" : speaker,
			"operator": "-",
			"value" : 2
		})
		this.ensemble.set({
			"category" : "internal",
			"type" : "conversation_interest",
			"first" : listener,
			"operator": "-",
			"value" : 2
		})
		this.ensemble.runTriggerRules(this.ensemble.getCharacters());
		this.volitions = this.ensemble.calculateVolition(this.ensemble.getCharacters())
		this.setLocked(false);
	}

	async listenerUpdate(speaker, listener, dialogue) {

		let prompt = PromptFactory.listenerPrompt(
			speaker,
			listener,
			this.conversationHistory,
			this.getState(),
			this.characterBios,
			dialogue,
		)
		return this.openAI.gptRequest(prompt)
		.then((result) => {
			console.log(result)
			let assessment = result["data"]["choices"][0]["text"].trim().toLowerCase()
			if (assessment === "negative") {
				this.ensemble.set({
					"category" : "feelings",
					"type" : "attraction",
					"first" : listener,
					"second" : speaker,
					"operator": "-",
					"value" : 5,
				})
			} 
			else if (assessment === "positive") {
				this.ensemble.set({
					"category" : "feelings",
					"type" : "attraction",
					"first" : listener,
					"second" : speaker,
					"operator": "+",
					"value" : 5,
				})
			}
		})
	}
}

export default Simulation;