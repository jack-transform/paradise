import Utils from "./utils.js"

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

    async initialize() {
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

export default CharacterFactory;