const { expect } = require('chai');

describe('A failing Suite', () => {
  beforeEach(async () => {
    await browser.url('https://github.com/');
  });

  [31, 32, 33, 34, 35, 36, 37, 38, 39, 40].forEach((el) => {
    it(`with failing test${el}`, async function () {
      this.retries(2);
      await browser.url('https://github.com/');
      await browser.getTitle();
      expect(true).to.be.equal(false);
    });
  });
});
