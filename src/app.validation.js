const joi = require('joi');

const balancesDepositValidation = joi.object().keys({
  userId: joi.number().required(),
  deposit: joi.number().required().min(1)
});

const bestProfessionValidation = joi.object().keys({
  start: joi.date().required(),
  end: joi.date().required()
});


const bestClientValidation = joi.object().keys({
  start: joi.date().required(),
  end: joi.date().required(),
  limit: joi.number().default(2)
});

module.exports = { balancesDepositValidation, bestProfessionValidation, bestClientValidation };