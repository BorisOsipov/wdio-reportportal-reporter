import { runCucumber } from '../helper';

describe('Cucumber test cases', () => {
  it('should add feature & scenario labels for cucumber test cases', async () => {
    await runCucumber(['failing']);
  });
});
