const Validator = require("validator");
const isEmpty = require("./is-empty");
const { PrismaClient } = require("@prisma/client");
const DbClient = new PrismaClient();

module.exports = function validateLoginInput(data) {
  let errors = {};

  // email validation
  if (Validator.isEmpty(data.email)) {
    errors.email = "Email is required";
  }
  else if (!Validator.isEmail(data.email)) {
    errors.email = "Email is invalid";
  }

  // password validation
  if (Validator.isEmpty(data.password)) {
    errors.password = "Password is required";
  } 
  else if (!Validator.isLength(data.password, { min: 3, max: 30 })) {
    errors.password = "Password must be at least 3 characters";
  }
  
  return {
    errors,
    isValid: isEmpty(errors),
  };
};
