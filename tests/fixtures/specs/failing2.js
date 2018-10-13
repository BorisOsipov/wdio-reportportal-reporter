const { expect } = require('chai');

describe('A failing Suite', () => {
  [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].forEach((el) => {
    it(`with failing test${el}`, async function () {
      this.retries(1);
      await browser.url('https://github.com/');
      await browser.getTitle();
      expect(true).to.be.equal(false);
    });
  });
});
