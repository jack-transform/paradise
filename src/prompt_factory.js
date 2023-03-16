
import Utils from './utils.js'
class PromptFactory {


    static recapHistory(history) {
        if (history.length === 0) {
            return "You just got their attention to start the conversation.\n"
        }
        let summary = "Recently in the conversation, the two of you have said:\n"
        for (const entry of history) {
            let speaker, dialogue;
            [speaker, dialogue] = entry;
            summary = summary + `${Utils.capitalize(speaker)}: ${dialogue}\n`;
        }
        return summary;
    }

    static statusString(speaker, state) {
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
    static baseSpeakerPrompt(speaker, state, characterData) {
        let speaker_gendered_descriptor = state[speaker].self.is_man ? "man" : "woman";
        let good_traits = characterData[speaker].goodTraits;
        let bad_traits = characterData[speaker].badTraits;
        return `You are ${Utils.capitalize(speaker)}, a 20-something ${speaker_gendered_descriptor} on a dramatic reality TV dating show.

You think of yourself as ${good_traits[0].toLowerCase()} and ${good_traits[1].toLowerCase()}, but sometims you can be ${bad_traits[0].toLowerCase()} and ${bad_traits[1].toLowerCase()}.

${PromptFactory.statusString(speaker, state)}`
}

    static speakerPromptTalk(speaker, listener, history, state, characterData) {

        let listener_gendered_descriptor = state[listener].self.is_man ? "man" : "woman";
        let summary = PromptFactory.recapHistory(history)

        return `${PromptFactory.baseSpeakerPrompt(speaker, state, characterData)}

Right now, you are flirting with ${Utils.capitalize(listener)}, a 20-something ${listener_gendered_descriptor}, to see if you have a connection.

${summary}
What do you say next? Keep your response to at most 2 sentences, and remember to be dramatic for the camera.
${Utils.capitalize(speaker)}: `

    }

    static speakerPromptInitiate(speaker, listener, state, characterData) {

        let listener_gendered_descriptor = state[listener].self.is_man ? "man" : "woman";
    
        return `${PromptFactory.baseSpeakerPrompt(speaker, state, characterData)}

You just approached ${Utils.capitalize(listener)}, a 20-something ${listener_gendered_descriptor}, to flirt.

How do you open? Keep your response to at most a sentence, and try to be charismatic for the camera.

Example response:
${Utils.capitalize(speaker)}: "Wow, ${Utils.capitalize(listener)}, you're so beautiful." 

Your response:
${Utils.capitalize(speaker)}: `
    }

    static speakerPromptEnd(speaker, listener, history, state, characterData) {

        let summary = PromptFactory.recapHistory(history)
    
        return `${PromptFactory.baseSpeakerPrompt(speaker, state, characterData)}
You're talking with ${Utils.capitalize(listener)}, but want to end the conversation.

${summary}
How do you end the conversation? Keep your response to at most a sentence.

Example response:
${Utils.capitalize(speaker)}: "Alright, ${Utils.capitalize(listener)}, it's been so great talking with you." 

Your response:
${Utils.capitalize(speaker)}: `
    }

    static listenerPrompt(speaker, listener, history, state, characterData, dialogue) {

    //let summary = PromptFactory.recapHistory(history)
        return `${PromptFactory.baseSpeakerPrompt(listener, state, characterData)}
You're talking with ${Utils.capitalize(speaker)}, and need to decide how you feel about them.

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

The following is  ${Utils.capitalize(speaker)}'s latest comment. How does it make you feel? Be negative more often than not.

Statement: ${dialogue}
Evaluation: `
    }






}

export default PromptFactory;