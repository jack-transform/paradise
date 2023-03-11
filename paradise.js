class Simulation {
	constructor() {
		this.ensemble = ensemble;
		this.prototypeSelf = {}
		this.prototypeRelationship = {}
	}

	async loadConfiguration() {
		Promise.all([
			fetch('./data/schema.json'),
			fetch('./data/cast.json'),
			fetch('./data/triggerRules.json'),
			fetch('./data/volitionRules.json'),
			fetch('./data/actions.json'),
			fetch('./data/history.json'),
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
			this._loadStatePrototypes();
			console.log(this.getState())
		}.bind(this)); 
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
			if (predicate.category in this.prototypeSelf) {
				character_states[predicate.first]["self"][predicate.type] = predicate.value;
			} else if (predicate.category in this.prototypeRelationship) {
				character_states[predicate.first]["relationships"][predictate.second][predicate.type] = predicate.value;
			}
		}
		return character_states;
	}
}

var game = new Simulation();
game.loadConfiguration()

