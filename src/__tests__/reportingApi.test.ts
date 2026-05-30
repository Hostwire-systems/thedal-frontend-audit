import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { BASE_URL } from '../config';
import { getElectionStats, recomputeElectionStats } from '../api/reportingApi';

const mock = new MockAdapter(axios);

describe('reportingApi election stats', () => {
  const accountId = 1; const electionId = 99;
  const url = `${BASE_URL}/reporting/api/aggregates/election/${accountId}/${electionId}`;
  const recomputeUrl = `${url}/recompute`;

  beforeEach(() => { mock.reset(); localStorage.setItem('jwtToken', 'test'); });

  it('fetches election stats snapshot', async () => {
    mock.onGet(url).reply(200, { accountId, electionId, totalVoters: 100 });
    const res = await getElectionStats(accountId, electionId);
    expect(res.totalVoters).toBe(100);
  });

  it('recomputes election stats', async () => {
    mock.onPost(recomputeUrl).reply(200, { accountId, electionId, totalVoters: 105 });
    const res = await recomputeElectionStats(accountId, electionId);
    expect(res.totalVoters).toBe(105);
  });
});
