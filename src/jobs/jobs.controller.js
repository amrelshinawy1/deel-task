const { Op } = require('Sequelize');
const { sequelize } = require('../model');
const { payJobValidation } = require('./jobs.validation');

/**
 * @returns pay job
 */
const payJob = async (req, res) => {
  try {
    const { Job, Contract, Profile } = req.app.get('models');
    const { job_id } = req.params;
    const { error } = payJobValidation.validate(req.params);
    if (error) {
      return res.status(400).json({ message: error.message });
    }

    const transaction = await sequelize.transaction();
    await Job.findOne({
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
    }, { transaction }).then(async (job) => {
      if (!job) {
        return res.status(404).send({ message: 'job not found.' });
      }
      if (job.Contract.Client.balance < job.price) {
        return res.status(400).send({ message: 'no balance.' });
      }
      await Profile.increment('balance', { by: job.price, where: { id: job.Contract.ContractorId } }, { transaction });
      await Profile.decrement('balance', { by: job.price, where: { id: job.Contract.ClientId } }, { transaction });
      await Job.update({ paid: true, paymentDate: new Date() }, { where: { id: job.id } });
      await transaction.commit();
      return res.status(200).send({ message: 'job paid successfully.' });
    });
  } catch (error) {
    await transaction.rollback();
    return res.status(500).send({ message: error.message });
  }
};

/**
 * @returns list unpaid jobs
 */
const listUnpaidJobs = async (req, res) => {
  try {
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
    if (!jobs?.length) return res.status(404).send({ message: 'can\'t find jobs' });
    return res.status(200).send(jobs);
  } catch (error) {
    return res.status(500).send({ message: error.message });
  }
};
module.exports = { payJob, listUnpaidJobs };