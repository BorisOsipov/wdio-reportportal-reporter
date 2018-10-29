const { expect } = require('chai');

describe('failing Before', function () {

  before( function () {
    browser.url('https://ya.ru/');
    expect(true).to.be.equal(false);
  });

  it('Verify test 1', () => {
    browser.url('https://ya.ru/');
    expect(true).to.be.equal(true);
  })
});
