const { expect } = require('chai');

describe('A passing Suite', () => {

  it('should have the right title - the fancy generator way', async () => {
    await browser.url('https://github.com/');
    await browser.getTitle();
    await browser.saveScreenshot();
    expect(true).to.equal(true);
  });


  it.skip('my test', () => { console.log(); });

  it('should have the right title - the fancy generator way', async () => {
    await browser.url('https://github.com/');
    await browser.getTitle();
    await browser.saveScreenshot();
    expect(true).to.equal(true);
  });
});

