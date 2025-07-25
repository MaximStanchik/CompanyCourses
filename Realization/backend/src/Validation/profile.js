const Validator = require("validator");
const isEmpty = require("./is-empty");
const leoProfanity = require('leo-profanity');
leoProfanity.loadDictionary('ru');
leoProfanity.loadDictionary('en');

module.exports = function validateProfileInput(data) {
  let errors = {};

  // DEBUG: log all incoming data
  // console.log('PROFILE VALIDATION INPUT:', data);

  function checkProfanity(field, label) {
    if (Array.isArray(data[field])) {
      let badVals = [];
      for (const val of data[field]) {
        if (val && leoProfanity.check(String(val).trim().toLowerCase())) {
          badVals.push(val);
        }
      }
      if (badVals.length > 0) {
        errors[field] = `${label} содержит недопустимые слова: ${badVals.join(', ')}`;
      }
    } else if (data[field] && leoProfanity.check(String(data[field]).trim().toLowerCase())) {
      errors[field] = `${label} содержит недопустимые слова`;
    }
  }

  if (!data.username || data.username.trim() === '') {
    errors.username = 'Username is required';
  } 
  else if (!/^[a-zA-Z0-9#]+$/.test(data.username)) {
    errors.username = 'Username can only contain cyrillic letters, numbers, and #';
  }
  checkProfanity('username', 'Username');
  checkProfanity('name', 'Имя');
  checkProfanity('surname', 'Фамилия');
  checkProfanity('additionalName', 'Дополнительные имена');
  checkProfanity('bio', 'О себе');
  checkProfanity('city', 'Город');
  checkProfanity('country', 'Страна');
  checkProfanity('company', 'Компания');
  checkProfanity('position', 'Должность');
  checkProfanity('status', 'Статус');
  checkProfanity('githubusername', 'GitHub username');
  checkProfanity('skills', 'Навыки');

  return {
    errors,
    isValid: Object.keys(errors).length === 0,
  };
};


