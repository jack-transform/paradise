class OpenAI {

    constructor() {
        this.API_KEY = "";
        this.OpenAI = null;
    }
    
    async initialize() {
        return fetch('data/.secrets.json')
        .then((response) => response.json())
        .then(function (json) {
            this.API_KEY = json.API_KEY;
            this.OpenAI = axios.create({
                baseURL: 'https://api.openai.com/v1/',
                timeout: 100000,
                headers: {
                  'Content-Type': 'application/json',
                  'Access-Control-Allow-Origin': "*",
                  'Authorization': 'Bearer ' + this.API_KEY
                }
            });
        }.bind(this));
    }

    async gptRequest(prompt) {
        return this.gptRequestHelper(prompt, 3)
    }

    async gptRequest(prompt, retries) {
        return this.OpenAI({
            "method": "post",
            "url": "/completions",
            "data": {
                "model": "text-davinci-003",
                "prompt": prompt,
                "max_tokens": 200,
                "top_p": 1,
                "n": 1,
                "stream": false,
                "logprobs": null,
                "stop": "\n"
            },
        }).catch(function (error) {
            console.log(error.toJSON());
        }).then(function(response) {
            if (response.status === 200) {
                return response;
            } else if (retries > 0) {
                return wait(1000).then(() => gptRequest(prompt, retries - 1));
            }
        });
    }

}

export default OpenAI;