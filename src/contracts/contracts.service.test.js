const { getContractById } = require('./contracts.service');
const app = require('../app');
// this test should be run after seed
describe('test contract service', () => {
  test('should get contract by id', async () => {
    const contract = await getContractById({ app, profile: { id: 5 } }, 1);
    expect(contract).toMatchObject({
      ClientId: 1, Contractor: {
        balance: 64, firstName: 'John', id: 5, lastName: 'Lenon', profession: 'Musician', type: 'contractor'
      },
      ContractorId: 5, id:
        1, status: 'terminated', terms: 'bla bla bla'
    });
  });
});