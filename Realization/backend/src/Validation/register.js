const Validator = require("validator");
const isEmpty = require("./is-empty");

module.exports = function validateRegisterInput(data) {
    let errors = {};
    data.email = !isEmpty(data.email) ? data.email : "";
    data.password = !isEmpty(data.password) ? data.password : "";
    data.confirmPassword = !isEmpty(data.confirmPassword) ? data.confirmPassword : "";
    data.username = !isEmpty(data.username) ? data.username : "";

    // Username
    if (Validator.isEmpty(data.username)) {
        errors.username = "Username is required";
    } else if (!Validator.isLength(data.username, { min: 3, max: 30 })) {
        errors.username = "Username must be between 3 and 30 characters";
    }

    // Email
    if (Validator.isEmpty(data.email)) {
        errors.email = "Email is required";
    } else if (!Validator.isEmail(data.email)) {
        errors.email = "Email is invalid";
    }

    // Password
    if (Validator.isEmpty(data.password)) {
        errors.password = "Password is required";
    } else if (!Validator.isLength(data.password, { min: 3, max: 30 })) {
        errors.password = "Password must be at least 3 characters";
    } else if (!/\d/.test(data.password)) {
        errors.password = "Password must contain at least one number";
    }
    
    return {
        errors,
        isValid: isEmpty(errors),
    };
};