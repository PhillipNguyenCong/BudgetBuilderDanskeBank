import { requestJson } from '../../../lib/api';
import { loadAccountSelection } from './accounts';
jest.mock('../../../lib/api', () => ({ requestJson: jest.fn() }));
it('does not return selectable accounts when budget eligibility cannot be loaded', async () => {
  jest.mocked(requestJson).mockImplementation(async (path) => {
    if (path === '/api/v1/budgets') throw new Error('Budget lookup unavailable');
    return {};
  });
  await expect(loadAccountSelection()).rejects.toThrow('Budget lookup unavailable');
});
