export function regexpParserFactory(regexp, factory) {
  return function*(document) {
    let index, match;
    while ((match = regexp.exec(document.text)) !== null) {
      if (match.index === index) {
        throw new Error('Parser must not match the same text twice (at index ' + index + ')');
      }

      index = match.index;
      yield factory(document, match);
    }
  };
}

export default {
  regexp: regexpParserFactory
};
