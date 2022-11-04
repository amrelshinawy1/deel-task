const joi = require('joi');

const getContractValidation = joi.object().keys({
  id: joi.number().required()
});

module.exports = { getContractValidation };