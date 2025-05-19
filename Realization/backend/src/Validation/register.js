const Validator = require("validator");
const isEmpty = require("./is-empty");

module.exports = function validateRegisterInput(data) {
  let errors = {};

  // name validation
  if (Validator.isEmpty(data.name)) {
    errors.name = "Name is required";
  } 
  else if (!Validator.isLength(data.name, { min: 2, max: 30 })) {
    errors.name = "Name must be between 2 and 30 characters";
  }

  // email validation
  if (Validator.isEmpty(data.email)) {
    errors.email = "Email is required";
  } 
  else if (!Validator.isEmail(data.email)) {
    errors.email = "Email is invalid";
  } 
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = "Email is invalid";
  }

  // password validation
  if (Validator.isEmpty(data.password)) {
    errors.password = "Password is required";
  } 
  else if (!Validator.isLength(data.password, { min: 3, max: 30 })) {
    errors.password = "Password must be at least 3 characters";
  }

  // password2 validation
  if (Validator.isEmpty(data.password2)) {
    errors.password2 = "Confirm Password is required";
  } 
  else if (!Validator.equals(data.password, data.password2)) {
    errors.password2 = "Passwords must match";
  }

  return {
    errors,
    isValid: isEmpty(errors),
  };
};
