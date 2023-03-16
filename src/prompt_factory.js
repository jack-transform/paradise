
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
            summary = summary + `${speaker}: ${dialogue}\n`;
        }
        return summary;
    }

    static baseSpeakerPrompt(speaker, state, characterData) {
        let speaker_gendered_descriptor = state[speaker].self.is_man ? "man" : "woman";
        let good_traits = characterData[speaker].goodTraits;
        let bad_traits = characterData[speaker].goodTraits;
        return `You are ${Utils.capitalize(speaker)}, a 20-something contestant on a dramatic reality TV dating show.
You are a ${speaker_gendered_descriptor} looking for the love of your life and television fame.
Your think of yourself as ${good_traits[0]} and ${good_traits[1]}, but those who've gotten on your bad side might describe you as ${bad_traits[0]} and ${bad_traits[1]}`
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

}

export default PromptFactory;