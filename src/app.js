const express = require('express');
const bodyParser = require('body-parser');
const { sequelize } = require('./model');
const { getProfile } = require('./middleware/getProfile');
const app = express();
app.use(bodyParser.json());
app.set('sequelize', sequelize);
app.set('models', sequelize.models);
const { Op } = require('Sequelize');
const { getContract, getAllContracts } = require('./contracts/contracts.controller');
const { payJob, listUnpaidJobs } = require('./jobs/jobs.controller');
const { balancesDepositValidation, bestProfessionValidation, bestClientValidation } = require('./app.validation');

app.get('/contracts', getProfile, getAllContracts);
app.get('/contracts/:id', getProfile, getContract);

app.get('/jobs/unpaid', getProfile, listUnpaidJobs);
app.post('/jobs/:job_id/pay', getProfile, payJob);

/**
 * @returns deposit balance
 */
app.post('/balances/deposit/:userId', getProfile, async (req, res) => {
  try {
    const { Job, Contract, Profile } = req.app.get('models');
    const { userId } = req.params;
    const { deposit } = req.body;
    const { error } = balancesDepositValidation.validate({ userId, deposit });
    if (error) {
      return res.status(400).json({ message: error.message });
    }

    const transaction = await sequelize.transaction();
    await Job.findAll({
      where: {
        paid: null
      },
      include: {
        model: Contract,
        where: {
          status: 'in_progress',
          [Op.or]: [
            {
              clientId: req.profile.id
            },
            {
              ContractorId: userId
            }
          ]
        },
        include: [{ model: Profile, as: 'Client' }, { model: Profile, as: 'Contractor' }]
      }
    }).then(async (jobs) => {
      if (!jobs?.length) return res.status(404).send({ message: 'can\'t find jobs.' });
      const totalJobsBalance = jobs.reduce((sum, job) => sum + job.price, 0);
      const maxToPay = totalJobsBalance * 25 / 100;
      if (deposit >= maxToPay) {
        return res.status(400).send({ message: 'can\'t deposit more than 25%.' });
      }
      if (deposit > job[0].Contract.Client.balance) {
        return res.status(400).send({ message: 'can\'t deposit amount more than the balance.' });
      }
      await Profile.increment('balance', { by: deposit, where: { id: userId } }, { transaction });
      await Profile.decrement('balance', { by: deposit, where: { id: req.profile.id } }, { transaction });
      await transaction.commit();
      return res.status(200).send({ message: `amount ${deposit} to the user.` });
    });
  } catch (error) {
    await transaction.rollback();
    return res.status(500).send({ message: error.message });
  }
});

/**
 * @returns best  profession
 */
app.get('/admin/best-profession', getProfile, async (req, res) => {
  try {
    const { Job, Contract, Profile } = req.app.get('models');
    const { start, end } = req.query;
    const { error } = bestProfessionValidation.validate(req.query);
    if (error) {
      return res.status(400).json({ message: error.message });
    }

    let profession = await Job.findOne({
      attributes: [
        'id',
        'Contract.ContractorId',
        'paymentDate',
        'paid',
        'Contract.Contractor.profession',
        [sequelize.fn('sum', sequelize.col('price')), 'total_amount']
      ],
      where: {
        paid: true,
        paymentDate: { [Op.between]: [new Date(start), new Date(end)] }
      },
      group: ['Contract.ContractorId'],
      order: [[sequelize.col('total_amount'), 'DESC']],
      include: { model: Contract, include: { model: Profile, as: 'Contractor' } }
    });
    if (!profession) return res.status(404).send({ message: 'profession not found.' });
    profession = {
      id: profession.Contract.Contractor.id,
      name: `${profession.Contract.Contractor.firstName} ${profession.Contract.Contractor.lastName}`,
      profession: profession.Contract.Contractor.profession
    };
    return res.status(200).send(profession);
  } catch (error) {
    return res.status(500).send({ message: error.message });
  }
});

/**
 * @returns best clients
 */
app.get('/admin/best-clients', getProfile, async (req, res) => {
  try {
    const { Job, Contract, Profile } = req.app.get('models');
    const { error, value } = bestClientValidation.validate(req.query);
    if (error) {
      return res.status(400).json({ message: error.message });
    }
    const { start, end, limit } = value;

    const jobs = await Job.findAll({
      attributes: [
        'id',
        'Contract.ClientId',
        'paymentDate',
        'paid',
        'price'
      ],
      where: {
        paid: true,
        paymentDate: { [Op.between]: [new Date(start), new Date(end)] }
      },
      order: [[sequelize.col('price'), 'DESC']],
      include: {
        model: Contract,
        attributes: [
          'id'
        ],
        include: {
          model: Profile,
          as: 'Client',
          attributes: [
            'id',
            'firstName',
            'lastName'
          ]
        }
      },
      limit
    });
    if (!jobs) return res.status(404).end();
    const clients = jobs.map(job => {
      return {
        id: job.Contract.Client.id,
        fullName: `${job.Contract.Client.firstName} ${job.Contract.Client.lastName}`,
        paid: job.price
      };
    });
    return res.status(200).send(clients);
  } catch (error) {
    return res.status(500).send({ message: error.message });
  }
});

module.exports = app;