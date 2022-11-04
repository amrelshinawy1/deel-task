const joi = require('joi');

const payJobValidation = joi.object().keys({
  job_id: joi.number().required()
});

module.exports = { payJobValidation };