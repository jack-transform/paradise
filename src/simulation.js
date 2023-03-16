import CharacterFactory from "./character_factory.js";
import PromptFactory from "./prompt_factory.js";
import Utils from "./utils.js";
import OpenAI from "./open_ai.js";

class ConversationContext {

	constructor(initiator, responder, type, characterBios) {
		this.type = type
		this.history = [];
		this.initiator = initiator;
		this.responder = responder;
		this.initiatorTurn = false;
		this.bios = characterBios
		this.lastDialogue = "";
		this.assessment = {};
	}

	speaker() {
		return this.initiatorTurn ? this.initiator : this.responder
	}

	listener() {
		return this.initiatorTurn ? this.responder : this.initiator
	}

	nextTurn() {
		this.initiatorTurn = !this.initiatorTurn;
	}

}

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
		this.cc = null;
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
			this.ensemble.set({
				"category" : "stats",
				"type" : "confidence",
				"first" : name,
				"operator": "=",
				"value" : Math.floor(Math.random() * 101),
			});
			this.ensemble.set({
				"category" : "stats",
				"type" : "mood",
				"first" : name,
				"operator": "=",
				"value" : Math.floor(Math.random() * 101),
			});
			this.ensemble.set({
				"category" : "stats",
				"type" : "intoxication",
				"first" : name,
				"operator": "=",
				"value" : Math.floor(Math.random() * 101),
			});
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

		this.ensemble.doAction(action);

		let bindings = action.goodBindings[0];
		let initiator = bindings["initiator"];
		let responder = bindings["responder"];
		let format_data = {
			"initiator": Utils.capitalize(initiator),
			"responder": Utils.capitalize(responder),
		};
		let message = "...";
		if (action.successMessage) {
			message = Utils.format(action.successMessage, format_data)
		}

		this.logAction(initiator, action.name, message);

		this.ensemble.runTriggerRules(this.ensemble.getCharacters());
		this.volitions = this.ensemble.calculateVolition(this.ensemble.getCharacters())

		if (action.additionalEffects) {
			this.runAdditionalEffects(action, initiator, responder)
			return;
		}
	}

	getActions(character) {
		const intents = 5;
		const actionsPerIntent = 1;
		const actionsPerGroup = 1;
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
			this.takeTurn(this.cc.speaker());
		}
		else if (this.turns.length > 0) {
			let turn = this.turns.pop()
			this.takeTurn(turn);
		} else {
			this.resetTurns();
			this.nextTimeStep();
		}

		if (!this.conversationActive) {
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
	

	runAdditionalEffects(action, initiator, responder) {

		if ((action.name === "FLIRT") || (action.name === "CHAT") || (action.name === "CONFRONT")) {
			this.startConversation(initiator, responder, action.name);
		} 
		else if (action.name === "TALK") {
			this.continueConversation();
		}
		else if (action.name === "END") {
			this.endConversation();
		}
	}

	startConversation(initiator, responder, actionType) {
		this.conversationActive = true;
		this.setConversationActive(initiator, responder, true);
		this.cc = new ConversationContext(initiator, responder, actionType, this.characterBios)
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

		let prompt = PromptFactory.start(this.cc, this.getState());
		console.log(prompt);
		
		let cleanup = () => {
			this.cleanupBase();
			this.setLocked(false);
		}

		this.dialogueExchange(prompt, cleanup);
	}

	endConversation() {
		
		let prompt = PromptFactory.end(
			this.cc,
			this.getState(),
		);

		let cleanup = () => {
			this.ensemble.set({
				"category" : "relationship_status",
				"type" : "in_conversation",
				"first" : this.cc.initiator,
				"second": this.cc.responder,
				"value" : false
			})
			this.ensemble.set({
				"category" : "relationship_status",
				"type" : "in_conversation",
				"first" : this.cc.responder,
				"second": this.cc.initiator,
				"value" : false
			})
			this.cleanupBase();
			this.setConversationActive(this.cc.initiator, this.cc.responder, false);
			this.conversationActive = false;
			//this.cc = null;
			this.setLocked(false);
		};

		this.dialogueExchange(prompt, cleanup);

	}

	continueConversation() {
		let prompt = PromptFactory.talk(this.cc, this.getState());
		console.log(prompt);
		
		let cleanup = () => {
			this.ensemble.set({
				"category" : "internal",
				"type" : "conversation_interest",
				"first" : this.cc.listener(),
				"operator": "-",
				"value" : 2
			})
			this.ensemble.set({
				"category" : "internal",
				"type" : "conversation_interest",
				"first" : this.cc.speaker(),
				"operator": "-",
				"value" : 2
			})
			this.cleanupBase();
			this.setLocked(false);
		};
		
		this.dialogueExchange(prompt, cleanup)
	}


	dialogueExchange(prompt, cleanup) {
		this.openAI.gptRequest(prompt)
		.then((result) => {
			console.log(result)
			let dialogue = result["data"]["choices"][0]["text"]
			if (dialogue.trim() === "") {
				dialogue = "\"...\""
			}
			this.cc.lastDialogue = dialogue;
		}).then(() => {
			this.listenerUpdate().then(() => cleanup());
		})
	}

	cleanupBase() {
		this.logConversation(this.cc.speaker(), this.cc.lastDialogue);
		this.cc.history.push([this.cc.speaker(), this.cc.lastDialogue])
		this.cc.nextTurn()
		this.ensemble.set({
			"category" : "feelings",
			"type" : "friendship",
			"first" : this.cc.speaker(),
			"second" : this.cc.listener(),
			"operator": "+",
			"value" : 5,
		})
		this.ensemble.set({
			"category" : "feelings",
			"type" : "friendship",
			"first" : this.cc.listener(),
			"second" : this.cc.speaker(),
			"operator": "+",
			"value" : 5,
		})
		this.ensemble.runTriggerRules(this.ensemble.getCharacters());
		this.volitions = this.ensemble.calculateVolition(this.ensemble.getCharacters())
		this.onCharacterUpdate();
	}

	async listenerUpdate() {

		let prompt = PromptFactory.listen(this.cc, this.getState())
		return this.openAI.gptRequest(prompt)
		.then((result) => {
			console.log(result)
			let assessment = result["data"]["choices"][0]["text"].trim().toLowerCase()
			this.cc.assessment[this.cc.listener()] = assessment;
			let property = "attraction"
			if (this.cc.type === "CHAT") {
				property = "friendship"
			}
			if (assessment === "negative") {
				this.ensemble.set({
					"category" : "feelings",
					"type" : property,
					"first" : this.cc.listener(),
					"second" : this.cc.speaker(),
					"operator": "-",
					"value" : 10,
				})
				this.ensemble.set({
					"category" : "internal",
					"type" : "conversation_interest",
					"first" : this.cc.listener(),
					"operator": "-",
					"value" : 3
				})
			} 
			else if (assessment === "positive") {
				this.ensemble.set({
					"category" : "feelings",
					"type" : property,
					"first" : this.cc.listener(),
					"second" : this.cc.speaker(),
					"operator": "+",
					"value" : 10,
				})
			}
			else if (assessment === "neutral") {
				this.ensemble.set({
					"category" : "feelings",
					"type" : property,
					"first" : this.cc.listener(),
					"second" : this.cc.speaker(),
					"operator": "+",
					"value" : 5,
				})
			}
		})
	}
}

export default Simulation;