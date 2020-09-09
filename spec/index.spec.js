const { expect } = require('chai');

const { TextDocument } = require('../src');
const { normalize } = require('./utils');

const TEXT = normalize(`
  The quick brown
  fox jumped over
  the lazy dog.
`);

describe('mutxtor', () => {
  it('should append text', async () => {

    const doc = new TextDocument(TEXT);
    doc.buildParser('JumpHigh').regexp(/jumped/).mutate(function() {
      this.append(' high');
    }).add();

    await doc.mutate();

    expect(doc.text).to.equal(normalize(`
      The quick brown
      fox jumped high over
      the lazy dog.
    `));
  });

  it('should prepend text', async () => {

    const doc = new TextDocument(TEXT);
    doc.buildParser('NotSoLazy').regexp(/lazy/).mutate(function() {
      this.prepend('not-so-');
    }).add();

    await doc.mutate();

    expect(doc.text).to.equal(normalize(`
      The quick brown
      fox jumped over
      the not-so-lazy dog.
    `));
  });
});
