const { getContractById, getContracts } = require('./contracts.service');
const { getContractValidation } = require('./contracts.validation');
/**
 * @returns contract by id
 */
const getContract = async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = getContractValidation.validate(req.params);
    if (error) {
      return res.status(400).json({ message: error.message });
    }

    const contract = await getContractById(req, id);
    if (!contract) return res.status(404).send({ message: 'failed to get contract.' });
    return res.status(200).send({ message: 'get contact.', contract });
  } catch (error) {
    return res.status(500).send({ message: error.message });
  }
};

/**
 * @returns contracts
 */
const getAllContracts = async (req, res) => {
  try {
    const contracts = await getContracts(req);
    return res.status(200).send({ message: 'get contracts.', contracts });
  } catch (error) {
    return res.status(500).send({ message: error.message });
  }
};

module.exports = { getContract, getAllContracts };