const { getContractById, getContracts } = require('./contracts.service');
/**
 * @returns contract by id
 */
const getContractByIdController = async (req, res) => {
  try {
    const { id } = req.params;
    const contract = await getContractById(req, id);
    if (!contract) return res.status(404).send({ message: 'failed to get contract.' });
    return res.json({ message: 'get contact.', contract });
  } catch (error) {
    return res.status(500).send({ message: error.message });
  }
};

/**
 * @returns contracts
 */
const getContractsController = async (req, res) => {
  try {
    const contracts = await getContracts(req);
    return res.json({ message: 'get contracts.', contracts });
  } catch (error) {
    return res.status(500).send({ message: error.message });
  }
};

module.exports = { getContractByIdController, getContractsController };