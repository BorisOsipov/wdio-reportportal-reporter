import { expect } from 'chai';
import { runMocha } from '../helper';

describe('test cases', () => {
  it('should detect passed test case', async () => {
    await runMocha(['failing']);
  });
});


