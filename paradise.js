class Utils {

	// https://dev.to/codebubb/how-to-shuffle-an-array-in-javascript-2ikj
	static shuffle(array) {
		for (let i = array.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			const temp = array[i];
			array[i] = array[j];
			array[j] = temp;
		}		  
	}

	static sample(array, n) {
		let chosen = []
		while (array.length > n && chosen.length < n) {
			let index = Math.floor(Math.random() * array.length);
			if (!chosen.includes(array[index])) {
				chosen.push(array[index]);
			}
		}
		return chosen ;
	}

	static format(str, fields) {
		let s = str;
		for (const field in fields) {
			s = s.replace(`{${field}}`, fields[field])
		}
		return s;
	}

	static capitalize(str) {
		return str.charAt(0).toUpperCase() + str.slice(1);
	}
}

var displayStats = [
	"confidence",
	"mood",
	"intoxication",
	"attraction",
	"friendship",
]

class UIManager {

	constructor(onStep) {
		let button = document.getElementById("stepButton");
		button.onclick = onStep;
		this.conversationActive = false;
	}


	// Characters

	addEmptyCharacterCard(name) {
		const characterTemplate = `
	<div id="${name}" class="column character-container">
		<div class="character-header column">
			<div class="character-emoji"></div>
			<div class="character-name"></div>
		</div>
		<div id="${name}-bio-container" class="column bio-container">
			<div class="character-bio-label">
				Bio
			</div>
			<div class="character-bio">
			</div>
		</div>
		<div id="${name}-traits-container" class="column">
			<div class="traits-label">
				Traits
			</div>
			<div class="chauracter-traits">
				<div class="character-traits-good">
				</div>
				<div class="character-traits-bad">
				</div>
			</div>
		</div>
		<div id="${name}-stats" class="column">
			<div>Stats</div>
			<div id="${name}-self" class="column">
				<div>Personal</div>
			</div>
			<div id="${name}-relationships" class="column">
				<div>Relationships</div>
			</div>
		</div>
	</div>
	`
		let characterContainer = document.getElementById("characterContainer")
		characterContainer.innerHTML = characterContainer.innerHTML + characterTemplate;
	}

	updateCharacterData(name, data) {
		let character = document.getElementById(name);
		let characterLabel = character.getElementsByClassName("character-name")[0];
		characterLabel.innerHTML = data.displayName;
		let characterEmoji = character.getElementsByClassName("character-emoji")[0];
		characterEmoji.innerHTML = data.emoji;

		let characterBio = character.getElementsByClassName("character-bio")[0];
		characterBio.innerHTML = data.bio;

		let goodTraits = character.getElementsByClassName("character-traits-good")[0];
		data.goodTraits.forEach(element => {
			let trait = document.createElement("div");
			trait.innerHTML = element;
			trait.className = "character-trait";
			goodTraits.appendChild(trait);
		});
		let badTraits = character.getElementsByClassName("character-traits-bad")[0];
		data.badTraits.forEach(element => {
			let trait = document.createElement("div");
			trait.innerHTML = element;
			trait.className = "character-trait";
			badTraits.appendChild(trait);
		});
	}

	addRelationshipForCharacter(character, relationship) {
		let relationshipContainer = document.getElementById(`${character}-relationships`);
		let relationshipElement = document.createElement("div");
		relationshipElement.id = `${character}-${relationship}-relationship`;
		relationshipElement.className = "column";
		relationshipContainer.appendChild(relationshipElement);
		relationshipElement.innerHTML = `<div class="relationship-label">${Utils.capitalize(relationship)}</div>`;
	}

	addStatForCharacter(character, statName, displayType, recipient) {
		let target = `${character}`
		if (recipient) {
			target = `${character}-${recipient}`
		}
		let id = `${target}-${statName}`

		let innerTemplate = `
		<div class="stat-valuelabel"></div>
		<div class="stat-progressbar">
			<div class="stat-progressbar-progress"></div>
		</div>`;
		if (displayType !== "numeric") {
			innerTemplate = `
			<div class="stat-valuelabel"></div>`;
		}

		let outerTemplate = `
			<div class="stat-label"></div>
			<div class="row stat-body">
				${innerTemplate}
			</div>`;

		let stat =  document.createElement("div");
		stat.className = "column stat-container"
		stat.id = id
		stat.innerHTML = outerTemplate;

		stat.getElementsByClassName("stat-label")[0].innerHTML = Utils.capitalize(statName);

		let parent = document.getElementById(`${character}-self`);
		if (recipient) {
			parent = document.getElementById(`${character}-${recipient}-relationship`);
		}
		parent.appendChild(stat);
		return stat;
	}

	getOrCreateStat(character, statName, displayType, recipient) {
		let stat_id = `${character}-${statName}`;
		if (recipient) {
			stat_id = `${character}-${recipient}-${statName}`
			let relationship = document.getElementById(`${character}-${recipient}-relationship`)
			if (!relationship) {
				this.addRelationshipForCharacter(character, recipient);
			}
		}
		let stat = document.getElementById(stat_id);
		if (!stat) {
			stat =this.addStatForCharacter(character, statName, displayType, recipient)
		}
		return stat;
	}

	updateStatForCharacter(character, statName, value, displayType, recipient) {
		let stat = this.getOrCreateStat(character, statName, displayType, recipient)

		let valueLabel = stat.getElementsByClassName("stat-valuelabel")[0];
		if (displayType !== "numeric") {
			valueLabel.innerHTML = value
		}
		else {
			valueLabel.innerHTML = `${String(value).padStart(3, "0")}/100`;
			let progress = stat.getElementsByClassName("stat-progressbar-progress")[0];
			progress.style.width = `${value}%`;
		}
	}

	updateCharacter(character, stats) {
		let personalStats = stats["self"]
		for (const stat of displayStats) {
			if (personalStats.hasOwnProperty(stat)) {
				this.updateStatForCharacter(character, stat, personalStats[stat], "numeric");
			}
		}
		let relationshipStats = stats["relationships"]
		for (const person in relationshipStats) {
			let relationship = relationshipStats[person];
			for (const stat of displayStats) {
				if (relationship.hasOwnProperty(stat)) {
					this.updateStatForCharacter(character, stat, relationship[stat], "numeric", person);
				}
			}
		}
	}

	updateCharacters(stats) {
		for (const character in stats) {
			this.updateCharacter(character, stats[character])
		}
	}

	addCharacters(characters, bios, stats) {
		for (const character of characters) {
			this.addEmptyCharacterCard(character);
			this.updateCharacterData(character, bios[character])
			this.updateCharacter(character, stats[character])
		}
	}


	// Action Log

	logAction(name, action, description) {
		let template = `
		<div class="action-person">${Utils.capitalize(name)}</div>
		<div class="action-name">${action}</div>
		<div class="action-description">${description}</div>`

		let actionElement = document.createElement("div");
		actionElement.className = "row action"
		actionElement.innerHTML = template;

		let container = document.getElementById("action-container")
		container.appendChild(actionElement)
		actionElement.scrollIntoView({ behavior: "smooth", block: "end", inline: "end" });

	}

	// Conversation Log

	toggleConversation(initiator, recipient) {
		let template = `<div class="conversation-announce">${Utils.capitalize(initiator)} and ${Utils.capitalize(recipient)} start a conversation.</div>`
		if (this.conversationActive) {
			template = `<div class="conversation-announce">${Utils.capitalize(initiator)} and ${Utils.capitalize(recipient)} end their conversation.</div>`
		}
		this.conversationActive = !this.conversationActive;
	
		let conversation = document.createElement("div");
		conversation.className = "row conversation"
		conversation.innerHTML = template;
		let container = document.getElementById("conversation-container")
		container.appendChild(conversation)
	}

	logConversation(name, text) {
		let template = `
		<div class="conversation-person">${Utils.capitalize(name)}</div>
		<div class="conversation-words">${text}</div>`

		let conversation = document.createElement("div");
		conversation.className = "row conversation"
		conversation.id = id
		conversation.innerHTML = template;

		let container = document.getElementById("conversation-container")
		container.appendChild(conversation)
	}
}


class Game {
	constructor(){
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

	logAction(name, action, description){
		this.ui.logAction(name, action, description);
	}

	logConversation(name, text) {
		this.ui.logConversation(name, text);
	}
	
	toggleConversation(initiator, recipient){
		this.ui.toggleConversation(initiator, recipient);
	}

}

class Simulation {
	constructor(onCharacterUpdate, logAction, logConversation, toggleConversation) {
		this.onCharacterUpdate = onCharacterUpdate;
		this.logAction = logAction;
		this.logConversation = logConversation;
		this.loggleConversation = toggleConversation;

		this.ensemble = ensemble;
		this.prototypeSelf = {}
		this.prototypeRelationship = {}
		this.volitions = {}
		this.turns = [],
		this.timer = 0;
		this.characterFactory = new CharacterFactory();
		this.characterBios = {}
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
			this.loadCharacterFactory()
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
			console.log("Were in");
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
		if (this.turns.length > 0) {
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
}

class CharacterFactory {
	// todo: gracefully handle running out of characters
	constructor() {
		this.maleNames = [];
		this.femaleNames = [];
		this.goodTraits = [];
		this.badTraits = [];
		this.skinTones = ["&#x1f3fb;", "&#x1f3fc;", "&#x1f3fd;", "&#x1f3fe;", "&#x1f3ff;"];
		this.hairColors = ["&#x1f9b0;", "&#x1f9b1;", "&#x1f9b2;", "&#x1f9b3;", "&#xfe0f;"];

	}

	getEmoji(isFemale) {
		let baseEmoji = "&#x1f468;";
		if (isFemale) {
			baseEmoji = "&#x1f469;";
		}
		let skinTone = Utils.sample(this.skinTones, 1)[0]
		let zwj = "&#x200d;";
		let hairColor = Utils.sample(this.hairColors, 1)[0]
		return baseEmoji + skinTone + zwj + hairColor;
	}

	newCharacter(isFemale) {
		let character = {}
		if (isFemale) {
			character["displayName"] = this.femaleNames.pop()
		}
		else {
			character["displayName"] = this.maleNames.pop()
		}
		character["name"] = character["displayName"].toLowerCase();
		character["goodTraits"] = Utils.sample(this.goodTraits, 2);
		character["badTraits"] = Utils.sample(this.badTraits, 2);
		character["bio"] = "Placeholder bio :)";
		character["emoji"] = this.getEmoji(isFemale);
		return character;
	}

	async initialize (){
		return fetch('./data/characterFactory.json')
		.then((response) => response.json())
		.then(function (data) {
			this.maleNames = data.male_names;
			Utils.shuffle(this.maleNames);
			this.femaleNames = data.female_names;
			Utils.shuffle(this.femaleNames);
			this.goodTraits = data.good_traits;
			this.badTraits = data.bad_traits;
		}.bind(this));
	}
}

var game;

document.onreadystatechange = function () {
  if (document.readyState == "complete") {
	game = new Game();
	game.initialize().then(() => {
		console.log("READY");
	});
  }
}
