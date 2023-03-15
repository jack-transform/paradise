import Utils from "./utils.js"

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

	setConversationActive(initiator, recipient, conversationActive) {
		let template = `<div class="conversation-announce">${Utils.capitalize(initiator)} and ${Utils.capitalize(recipient)} start a conversation.</div>`
		if (!conversationActive) {
			template = `<div class="conversation-announce">${Utils.capitalize(initiator)} and ${Utils.capitalize(recipient)} end their conversation.</div>`
		}	
		let conversation = document.createElement("div");
		conversation.className = "row conversation"
		conversation.innerHTML = template;
		let container = document.getElementById("conversation-container")
		container.appendChild(conversation)
        conversation.scrollIntoView({ behavior: "smooth", block: "end", inline: "end" });

	}

	logConversation(name, text) {
		let template = `
		<div class="conversation-person">${Utils.capitalize(name)}</div>
		<div class="conversation-words">${text}</div>`

		let conversation = document.createElement("div");
		conversation.className = "row conversation"
		conversation.innerHTML = template;

		let container = document.getElementById("conversation-container")
		container.appendChild(conversation)
        conversation.scrollIntoView({ behavior: "smooth", block: "end", inline: "end" });
	}
}

export default UIManager;