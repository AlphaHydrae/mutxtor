require('core-js/stable');

const { TextDocument } = require('../src');
const { expect } = require('./utils');

describe('mutxtor', () => {
  it('should work', async () => {
    const doc = new TextDocument('foo');
    doc.buildParser('foo').regexp(/foo/).mutate(function() {
      this.append('bar');
    }).add();

    await doc.mutate();

    expect(doc.text).to.equal('foobar');
  });
});
