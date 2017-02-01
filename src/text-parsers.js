export function regexpParserFactory(regexp, factory) {
  return function*(document) {

    let match;
    if (!regexp.global) {
      if ((match = regexp.exec(document.text)) !== null) {
        yield factory(document, match);
      }

      return;
    }

    let index;
    while ((match = regexp.exec(document.text)) !== null) {
      if (match.index === index) {
        throw new Error('Parser must not match the same text twice (at index ' + index + ')');
      }

      index = match.index;
      yield factory(document, match);
    }
  };
}
