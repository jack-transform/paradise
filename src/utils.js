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

export default Utils;