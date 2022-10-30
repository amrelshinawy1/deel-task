const express = require('express');
const bodyParser = require('body-parser');
const { sequelize } = require('./model');
const { getProfile } = require('./middleware/getProfile');
const app = express();
app.use(bodyParser.json());
app.set('sequelize', sequelize);
app.set('models', sequelize.models);
const { Op } = require('Sequelize');
const { getContractByIdController, getContractsController } = require('./contracts/contracts.controller');


app.get('/contracts', getProfile, getContractsController);
app.get('/contracts/:id', getProfile, getContractByIdController);
/**
 * @returns unpaid jobs
 */

app.get('/jobs/unpaid', getProfile, async (req, res) => {
  const { Job, Contract } = req.app.get('models');
  const jobs = await Job.findAll({
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
            contractorId: req.profile.id
          }
        ]
      }
    }
  });
  if (!jobs?.length) return res.status(404).end();
  res.json(jobs);
});

/**
 * @returns pay job
 */
app.post('/jobs/:job_id/pay', getProfile, async (req, res) => {
  const { Job, Contract, Profile } = req.app.get('models');
  const { job_id } = req.params;

  const job = await Job.findOne({
    where: {
      id: job_id,
      paid: null
    },
    include: {
      model: Contract,
      where: {
        status: 'in_progress',
        [Op.or]: [
          {
            clientId: req.profile.id
          }
        ]
      },
      include: [{ model: Profile, as: 'Client' }, { model: Profile, as: 'Contractor' }]
    }
  });
  if (!job) return res.status(404).end();
  if (job.Contract.Client.balance < job.price) {
    res.json({ message: 'no balance.' });
  }
  const transaction = await sequelize.transaction();
  try {
    await Profile.increment('balance', { by: job.price, where: { id: job.Contract.ContractorId } }, { transaction });
    await Profile.decrement('balance', { by: job.price, where: { id: job.Contract.ClientId } }, { transaction });
    await Job.update({ paid: true, paymentDate: new Date() }, { where: { id: job.id } });
    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
  res.json(job);
});

/**
 * @returns deposit balance
 */
app.post('/balances/deposit/:userId', getProfile, async (req, res) => {
  const { Job, Contract, Profile } = req.app.get('models');
  const { userId } = req.params;
  const { deposit } = req.body;
  const jobs = await Job.findAll({
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
  });
  if (!jobs?.length) return res.status(404).end();
  const totalJobsBalance = jobs.reduce((sum, job) => sum + job.price, 0);
  const maxToPay = totalJobsBalance * 25 / 100;
  if (deposit >= maxToPay) {
    res.json({ message: 'can\'t deposit more than 25%.' });
  }
  const transaction = await sequelize.transaction();
  try {
    await Profile.increment('balance', { by: deposit, where: { id: userId } }, { transaction });
    await Profile.decrement('balance', { by: deposit, where: { id: req.profile.id } }, { transaction });
    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }

  res.json({ message: `amount ${deposit} to the user.` });
});

/**
 * @returns best  profession
 */
app.get('/admin/best-profession', getProfile, async (req, res) => {
  const { Job, Contract, Profile } = req.app.get('models');
  const { start, end } = req.query;
  const profession = await Job.findOne({
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
  if (!profession) return res.status(404).end();
  res.json(profession);
});

/**
 * @returns best clients
 */
app.get('/admin/best-clients', getProfile, async (req, res) => {
  const { Job, Contract, Profile } = req.app.get('models');
  const { start, end, limit } = req.query;
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
    limit: limit || 2
  });
  if (!jobs) return res.status(404).end();
  const clients = jobs.map(job => {
    return {
      id: job.Contract.Client.id,
      fullName: `${job.Contract.Client.firstName} ${job.Contract.Client.lastName}`,
      paid: job.price
    };
  });
  res.json(clients);
});

module.exports = app;