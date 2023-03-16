
import Utils from './utils.js'
class PromptFactory {

    static relationship(cc, state, speaker, listener) {
        let attraction = state[speaker]["relationships"][listener]["attraction"]
        let friendship = state[speaker]["relationships"][listener]["friendship"]
        
        let attractionString = `You find ${listener} attractive`
        if (attraction < 5) {
            attractionString = `You aren't attracted to ${listener} at all`
        } else if (attraction < 20) {
            attractionString = `You aren't particularly attracted to ${listener}`
        }  else if (attraction < 40) {
            attractionString = `You find ${listener} reasonably attractive`
        } else if (attraction < 60) {
            attractionString = `You find ${listener} very attractive`
        } else if (attraction < 80) {
            attractionString = `You find ${listener} extremely attractive`
        } else if (attraction < 100) {
            attractionString = `You are desparately in love with ${listener}`
        }

        let friendshipString = `You don't know them well at all.`
        if (friendship < 5) {
            friendshipString = `You've never talked before.`
        } else if (friendship < 20) {
            friendshipString = `You don't know them well.`
        }  else if (friendship < 40) {
            friendshipString = `You've gotten to know each other a bit.`
        } else if (friendship < 60) {
            friendshipString = `You're pretty close with them.`
        } else if (friendship < 80) {
            friendshipString = `You have a strong relationship with them.`
        } else if (friendship < 100) {
            friendshipString = `You have an incredibly intense bond with them that you believe will last well past the show.`
        }

        if (cc.type === "CHAT") {
            return friendshipString;
        } else {
            return `${attractionString}, but ${friendshipString.toLowerCase()}`
        }
    }

    static history(cc) {
        if (cc.history.length === 0) {
            return "You just got their attention to start the conversation.\n"
        }
        let summary = "Recently in the conversation, the two of you have said:\n"
        for (const entry of cc.history) {
            let speaker, dialogue;
            [speaker, dialogue] = entry;
            summary = summary + `${Utils.capitalize(speaker)}: ${dialogue}\n`;
        }
        return summary;
    }

    static status(state, speaker) {
        let mood = state[speaker]["self"]["mood"];
        let moodString = "normal mood"
        if (mood < 20) {
            moodString = "terrible mood"
        } else if (mood < 40) {
            moodString = "bad mood"
        } else if (mood < 60) {
            moodString = "normal mood"
        } else if (mood < 80) {
            moodString = "good mood"
        } else if (mood < 100) {
            moodString = "wonderful mood"
        }

        let intoxication = state[speaker]["self"]["intoxication"];
        let intoxicationString = "completely sober"
        if (intoxication < 20) {
            intoxicationString = "completely sober"
        } else if (intoxication < 40) {
            intoxicationString = "a little buzzed"
        } else if (intoxication < 60) {
            intoxicationString = "pretty buzzed"
        } else if (intoxication < 80) {
            intoxicationString = "drunk"
        } else if (intoxication < 100) {
            intoxicationString = "embarassingly drunk"
        }

        let confidence = state[speaker]["self"]["confidence"];

        let confidenceString = "extremely nervous"
        if (confidence < 20) {
            confidenceString = "extremely nervous"
        } else if (confidence < 40) {
            confidenceString = "not very good"
        } else if (confidence < 60) {
            confidenceString = "excited but uneasy"
        } else if (mood < 80) {
            confidenceString = "good"
        } else if (mood < 100) {
            confidenceString = "super confident"
        }

        return  `The way you feel affects how you interact with others. Right now, you're in a ${moodString}, and you're ${intoxicationString}. You feel ${confidenceString} about being on the show.`

    }
//You are a ${speaker_gendered_descriptor} looking for the love of your life and television fame.
    static base(cc, state, speaker) {
        let speaker_gendered_descriptor = state[speaker].self.is_man ? "man" : "woman";
        let good_traits = cc.bios[speaker].goodTraits;
        let bad_traits = cc.bios[speaker].badTraits;
        return `You are ${Utils.capitalize(speaker)}, a 20-something ${speaker_gendered_descriptor} on a dramatic reality TV dating show.

You think of yourself as ${good_traits[0].toLowerCase()} and ${good_traits[1].toLowerCase()}, but sometimes you can be ${bad_traits[0].toLowerCase()} and ${bad_traits[1].toLowerCase()}.

${PromptFactory.status(state, speaker)}`
}

    static assessment(cc, speaker) {
        let as = cc.assessment[speaker];
        if (as === "negative") {
            return "You found the last thing they said off-putting."
        }
        if (as === "positive") {
            return "You appreciated the last thing they said."
        }
        else {
            return "You feel indifferent about the last thing they said."
        }
    }

    static talkChat(cc, state) {
        let listener = cc.listener();
        let listener_gendered_descriptor = state[listener].self.is_man ? "man" : "woman";
        return `Right now, you are having a non-romantic chat with ${Utils.capitalize(listener)}, a 20-something ${listener_gendered_descriptor}, to get to know them better and maybe become friends.`
    }

    static talkFlirt(cc, state) {
        let listener = cc.listener();
        let listener_gendered_descriptor = state[listener].self.is_man ? "man" : "woman";
        return `Right now, you are flirting with ${Utils.capitalize(listener)}, a 20-something ${listener_gendered_descriptor}, to see if you have a connection.`
    }

    static talk(cc, state) {
        let listener = cc.listener();
        let speaker = cc.speaker();
        let listener_gendered_descriptor = state[listener].self.is_man ? "man" : "woman";
        let summary = PromptFactory.history(cc)

        let talkPrompt = PromptFactory.talkFlirt(cc, state)
        if (cc.type == "CHAT") {
            talkPrompt = PromptFactory.talkChat(cc, state)
        }
        return `${PromptFactory.base(cc, state, speaker)}

${talkPrompt}
${PromptFactory.relationship(cc, state, speaker, listener)}

${summary}
${PromptFactory.assessment(cc, speaker)}

What do you say next? Keep your response to at most 2 sentences, and remember to be dramatic for the camera.
${Utils.capitalize(speaker)}: `

    }

    static start(cc, state) {
        let speaker = cc.speaker();
        let listener = cc.listener();
        let listener_gendered_descriptor = state[listener].self.is_man ? "man" : "woman";
        
        let action = "to flirt and a build a romantic connection."
        if (cc.type === "CHAT") {
            action = "to have a friendly conversation."
        }

        return `${PromptFactory.base(cc, state, speaker)}

You just approached ${Utils.capitalize(listener)}, a 20-something ${listener_gendered_descriptor}, to ${action}.
${PromptFactory.relationship(cc, state, speaker, listener)}

How do you open? Keep your response to at most a sentence, and try to be charismatic for the camera.

Example response:
${Utils.capitalize(speaker)}: "Wow, ${Utils.capitalize(listener)}, it's great to meet you." 

Your response:
${Utils.capitalize(speaker)}: `
    }

    static end(cc, state) {
        let speaker = cc.speaker();
        let listener = cc.listener();
        let summary = PromptFactory.history(cc)
        return `${PromptFactory.base(cc, state, speaker)}
You're talking with ${Utils.capitalize(listener)}, but you think it's time to wrap up the conversation.
${PromptFactory.relationship(cc, state, speaker, listener)}

${summary}
How do you end the conversation? Keep your response to a few sentences, but make sure to address ${Utils.capitalize(listener)}'s most recent comments.

Example response:
${Utils.capitalize(speaker)}: "Alright, ${Utils.capitalize(listener)}, it's been so great talking with you." 

Your response:
${Utils.capitalize(speaker)}: `
    }

    static listen(cc, state) {
        let speaker = cc.speaker();
        let listener = cc.listener();
        return `${PromptFactory.base(cc, state, listener)}
You're talking with ${Utils.capitalize(speaker)}, and need to decide how you feel about them; ${PromptFactory.assessment(cc, speaker)}
${PromptFactory.relationship(cc, state, listener, speaker)}

For each of ${Utils.capitalize(speaker)}'s comments, you have to decide how you feel.
Do you think what ${Utils.capitalize(speaker)} makes you feel positive, negative, or neutral? Examples:

Statement: "Hello, ${Utils.capitalize(listener)}"
Evaluation: Neutral

Statement: "I like you a lot."
Evaluation: Positive

Statement: "I don't find what you just said interesting."
Evaluation: Neutral

Statement: "What are your interests?"
Evaluation: Neutral

The following is ${Utils.capitalize(speaker)}'s latest comment. How does it make you feel? Be negative more often than not.

Statement: ${cc.lastDialogue}
Evaluation: `
    }

}

export default PromptFactory;