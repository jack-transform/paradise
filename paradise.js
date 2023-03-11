// Lovers and Rivals 
// A small example Ensemble game originally by Ben Samuel, c.2015

// Numerical values for important schema types between characters
// Updated by updateLocalStateInformation()
var stateInformation = {
	"loveToHeroCloseness" : "NA",
	"loveToHeroAttraction" : "NA",
	"heroToLoveCloseness" : "NA",
	"heroToLoveAttraction" : "NA",
	"loveToRivalCloseness" : "NA",
	"loveToRivalAttraction" :"NA",
	"heroStrength" : "NA",
	"heroIntelligence" : "NA"
};

var gameVariables = {
	"gameOver" : false,
	"endingText" : "NA",
	"turnNumber" : 0,
	"numIntents" : 2,
	"numActionsPerIntent" : 5
};

var move = function(){
	var elem = document.getElementById("hero");
	var left = 0;

	function frame() {
		left++; // update parameters
		elem.style.left = left + 'px';
		if (left == 100) {
			clearInterval(id);
		}
	}
	var id = setInterval(frame, 10); // draw every 10ms
};

// Move little character icons according to current Ensemble state information
var moveAllCharacters = function() {
	// Takes a little bit of computation!
	var loveDestination = (stateInformation.widthOfField/2 - stateInformation.loveToHeroCloseness*1.5 + stateInformation.loveToRivalCloseness*2.5);
	moveByCharacterName("hero", stateInformation.heroToLoveCloseness);
	moveByCharacterName("love", loveDestination);
};

var moveByCharacterName = function(name, destination){
	//console.log("moveByCharacterName name: " , name);
	//console.log("moveByCharacterName destination: " , destination);
	var elem = document.getElementById(name);
	var startPos = parseInt(elem.style.left, 10); // start off with their current left position.
	var currentPos = startPos;
	//console.log("startPos " , startPos);
	//console.log("elem " , elem);

	function frame() {
		if(startPos > destination){ // we are moving backwards.
			//console.log("decrementing...");
			currentPos -= 1;
		}
		else if (startPos < destination){ // we are moving forwards.
			currentPos += 1;
			//console.log("incrementing...");
		}
		elem.style.left = currentPos + 'px';
		if (currentPos == destination) {
			clearInterval(id);
		}
	}
	var id = setInterval(frame, 10); // draw every 10ms
};

var positionCharacter = function(id, pos){
	//console.log("I got here, id is " + id + " and pos is " + pos);
	var elem = document.getElementById(id);
	elem.style.left = pos + "px";
};

var setUpLoversAndRivalsInitialState = function(){
	// Update our local copies of these variables, and display them.
	updateLocalStateInformation();
	displayStateInformation();
};



var clearActionList = function(){
	// We're first going to make the entire action list disappear, 
	// so as not to distract the player from the beautiful instantiations
	var actionArea = document.getElementById("actionArea");
	actionArea.style.visibility = "hidden";

	// Now we're actually going to remove the actions from the actionLists, 
	// because with the new socialState, characters will likely want to 
	// take new actions towards each other
	var heroToLoveActionList = document.getElementById("actionList_hero_love");
	heroToLoveActionList.innerHTML = "";
	var heroToRivalActionList = document.getElementById("actionList_hero_rival");
	heroToRivalActionList.innerHTML = "";
	var heroToHeroActionList = document.getElementById("actionList_hero_hero");
	heroToHeroActionList.innerHTML = "";
};

// Check to see if the game is over!
var checkForEndConditions = function(){
	if(stateInformation.loveToRivalCloseness >= 90){
		// uh oh, we lose!
		gameVariables.gameOver = true;
		gameVariables.endingText = "Game over! Your love is in the arms of your rival!";
	}
	if(stateInformation.loveToHeroCloseness >= 90 && stateInformation.heroToLoveCloseness >= 90){
		gameVariables.gameOver = true;
		gameVariables.endingText = "Love is not a game, but you win! Your love is somewhat interested in you!";
	}
};

// There are certain things that we might need to 'refresh' again 
// (the visibility of the action list, the state of dialogue bubbles, etc.)
var cleanUpUIForNewTurn = function(){
	var actionArea = document.getElementById("actionArea");
	actionArea.style.visibility = "visible";

	var turnNumberArea = document.getElementById("turnNumberPlace");
	turnNumberArea.innerHTML = gameVariables.turnNumber;
};

var displayStateInformation = function(){
	document.getElementById("closenessHeroToLoverNumber").innerHTML = stateInformation.heroToLoveCloseness;
	document.getElementById("closenessLoverToHeroNumber").innerHTML = stateInformation.loveToHeroCloseness;
	document.getElementById("closenessLoverToRivalNumber").innerHTML = stateInformation.loveToRivalCloseness;
	document.getElementById("attractionHeroToLoverNumber").innerHTML = stateInformation.heroToLoveAttraction;
	document.getElementById("attractionLoverToHeroNumber").innerHTML = stateInformation.loveToHeroAttraction;
	document.getElementById("attractionLoverToRivalNumber").innerHTML = stateInformation.loveToRivalAttraction;
	document.getElementById("heroStrengthNumber").innerHTML = stateInformation.heroStrength;
	document.getElementById("heroIntelligenceNumber").innerHTML = stateInformation.heroIntelligence;
};

var updateLocalStateInformation = function(){
	//First, let's grab the data we'll want to display
	var loveToHeroClosenessPred = {
		"category" : "feeling",
		"type" : "closeness",
		"first" : "love",
		"second" : "hero"
	};
	var loveToRivalClosenessPred = {
		"category" : "feeling",
		"type" : "closeness",
		"first" : "love",
		"second" : "rival"
	};
	var heroToLoveClosenessPred = {
		"category" : "feeling",
		"type" : "closeness",
		"first" : "hero",
		"second" : "love"
	};
	var loveToHeroAttractionPred = {
		"category" : "feeling",
		"type" : "attraction",
		"first" : "love",
		"second" : "hero"
	};
	var heroToLoveattractionPred = {
		"category" : "feeling",
		"type" : "attraction",
		"first" : "hero",
		"second" : "love"
	};
	var loveToRivalAttractionPred = {
		"category" : "feeling",
		"type" : "attraction",
		"first" : "love",
		"second" : "rival"
	};
	var heroIntelligencePred = {
		"category" : "attribute",
		"type" : "intelligence",
		"first" : "hero"
	};
	var heroStrengthPred = {
		"category" : "attribute",
		"type" : "strength",
		"first" : "hero"
	};

	// Get love to hero closeness
	var results = ensemble.get(loveToHeroClosenessPred);
	stateInformation.loveToHeroCloseness = results[0].value;

	// Get love to rival closeness
	results = ensemble.get(loveToRivalClosenessPred);
	stateInformation.loveToRivalCloseness= results[0].value;

	// Get hero to Love closeness
	results = ensemble.get(heroToLoveClosenessPred);
	stateInformation.heroToLoveCloseness = results[0].value;

	// Get love to hero attraction
	results = ensemble.get(loveToHeroAttractionPred);
	stateInformation.loveToHeroAttraction = results[0].value;

	// Get love to rival attraction
	results = ensemble.get(loveToRivalAttractionPred);
	stateInformation.loveToRivalAttraction = results[0].value;

	// Get hero to love attraction
	results = ensemble.get(heroToLoveattractionPred);
	stateInformation.heroToLoveAttraction = results[0].value;

	// Get hero intelligence
	results = ensemble.get(heroIntelligencePred);
	stateInformation.heroIntelligence = results[0].value;

	// Get hero strength
	results = ensemble.get(heroStrengthPred);
	stateInformation.heroStrength = results[0].value;
};

// Console log all actions available between all cast members
function logActions (volitions,cast,numIntents,numActionsPerIntent) {
	cast.forEach( (initiator) => {
		console.log (` Available actions from ${initiator}:`);
		cast.forEach( (responder) => {
			let actions = ensemble.getActions(initiator,responder,volitions,cast,numIntents,numActionsPerIntent);
			let actionNames = actions.reduce( (total,action) => {
				total.push(action.name);
				return total;
			}, []);
			console.log(`  to ${responder}:`, actionNames);
		});
	});
}

// Initialize Ensemble

// Load our schema, cast, triggerRules, volitionRules, actions, and history
var rawSchema = ensemble.loadFile("data/schema.json");
var schema = ensemble.loadSocialStructure(rawSchema);

var rawCast = ensemble.loadFile("data/cast.json");
var cast = ensemble.addCharacters(rawCast);

var rawTriggerRules = ensemble.loadFile("data/triggerRules.json");
var triggerRules = ensemble.addRules(rawTriggerRules);

var rawVolitionRules = ensemble.loadFile("data/volitionRules.json");
var volitionRules = ensemble.addRules(rawVolitionRules);

var rawActions = ensemble.loadFile("data/actions.json");
var actions = ensemble.addActions(rawActions);

var rawHistory = ensemble.loadFile("data/history.json");
var history = ensemble.addHistory(rawHistory);

// Set up our initial state
setUpLoversAndRivalsInitialState();
setupCharacterPositions(500);

var initialVolitions = ensemble.calculateVolition(cast);

// Give the player action buttons!
populateActionLists(initialVolitions, cast);

console.log("--- Turn:", gameVariables.turnNumber, "---");
//ensemble.dumpSocialRecord();
console.log("Calculated volitions:", initialVolitions.dump());
logActions(initialVolitions, cast, 2, 100);

// MAIN GAME LOOP
// 1.) Calculate Volitions
// 2.) Populate Action Area
// 3.) Handle action selection

var nextTurn = function(){
	// We have achieved A NEW TURN!
	gameVariables.turnNumber += 1;
	console.log("--- Turn:", gameVariables.turnNumber, "---");
	checkForEndConditions();
	if(gameVariables.gameOver === true){
		var endMessageArea = document.getElementById("statusMessage");
		endMessageArea.innerHTML = gameVariables.endingText;
	}
	else{
		ensemble.setupNextTimeStep();
		//ensemble.dumpSocialRecord();
		var volitions = ensemble.calculateVolition(cast);
		console.log("Calculated volitions:", volitions.dump());
		logActions (volitions, cast, 2, 100);
		populateActionLists(volitions, cast);
		cleanUpUIForNewTurn();
	}
};

// Listen for custom event dispatched by actionButtonClicked()
document.addEventListener("nextTurn", nextTurn);

/*
var vol = storedVolitions.getFirst("hero", "love");
console.log("here is the first volition from hero to love: " , vol);
vol = storedVolitions.getNext(char1, char2);
console.log("Here is the second volition from hero to love: ", vol);
*/

