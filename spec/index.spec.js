require('core-js/stable');
const { expect } = require('chai');

const { TextDocument } = require('../src');

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
