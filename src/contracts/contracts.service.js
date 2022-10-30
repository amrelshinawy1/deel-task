const { Op } = require('Sequelize');

const getContractById = async (req, id) => {
  const { Contract, Profile } = req.app.get('models');
  const contract = await Contract.findOne({
    where: { id, contractorId: req.profile.id },
    include: { model: Profile, as: 'Contractor' }
  });
  return contract;
};


async function getContracts (req) {
  const { Contract } = req.app.get('models');
  const contracts = await Contract.findAll({
    where: {
      status: { [Op.ne]: 'terminated' },
      [Op.or]: [
        {
          clientId: req.profile.id
        },
        {
          contractorId: req.profile.id
        }
      ]
    }
  });
  return contracts;
}
module.exports = { getContractById, getContracts };