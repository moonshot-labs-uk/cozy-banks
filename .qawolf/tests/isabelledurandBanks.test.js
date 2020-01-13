const { launch } = require("qawolf");
const selectors = require("../selectors/isabelledurandBanks");

describe('isabelledurandBanks', () => {
  let browser;

  beforeAll(async () => {
    browser = await launch({ url: "http://isabelledurand-banks.mycozy.cloud/" });
  });

  afterAll(() => browser.close());

  it('can type into "MOT DE PASSE" input', async () => {
    await browser.type(selectors[0], "azerazerazer");
  });

  it('can Enter', async () => {
    await browser.type(selectors[1], "↓Enter↑Enter");
  });

  it('can click "Paramètres" link', async () => {
    await browser.click(selectors[2]);
  });

  it('can click "COMPTES" div', async () => {
    await browser.click(selectors[3]);
  });

  it('can click "GROUPES" div', async () => {
    await browser.click(selectors[4]);
  });

  it('can click "Analyse" link', async () => {
    await browser.click(selectors[5]);
  });

  it('can type into "Analyse" link', async () => {
    await browser.type(selectors[6], "↓MetaLeft↑MetaLeft");
  });
});