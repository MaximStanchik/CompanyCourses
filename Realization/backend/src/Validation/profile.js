const Validator = require("validator");
const isEmpty = require("./is-empty");

module.exports = function validateProfileInput(data) {
	let errors = {};

	// Username: required, allow Unicode letters/digits and basic symbols (# _ - .)
	if (!data.username || String(data.username).trim() === "") {
		errors.username = "Username is required";
	} else {
		const username = String(data.username).trim();
		// Unicode letters (\p{L}), numbers (\p{N}), and symbols # _ - .
		const usernameOk = /^[\p{L}\p{N}#_.-]+$/u.test(username);
		if (!usernameOk) {
			errors.username = "Username can contain letters, numbers and # _ . - without spaces";
		}
	}

	return {
		errors,
		isValid: Object.keys(errors).length === 0,
	};
};


