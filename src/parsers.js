/**
 * Returns a parser that will identify all text elements matching a regular expression in a document.
 *
 * The regular expression can have the global flag or not, depending on whether you need to parse a single or multiple elements.
 *
 * @param {RegExp} regexp - The regular expression to match elements.
 * @param {function(match: object): TextElement} factory - A function that will be passed each match of the regular expression and that should return a {@link TextElement} object corresponding to that match.
 * @returns {function} A parser generator function.
 *
 * @example
 * let markdownTitleParser = regexpParserFactory(/^(#+)\s*(.+)$/gm, (document, match) => {
 *
 *   let index = match.index;
 *   let text = match[0];
 *   let titleLevel = match[1].length;
 *   let titleContents = match[2];
 *
 *   // Assuming you have a MarkdownTitle subclass of TextElement that takes these arguments.
 *   return new MarkdownTitle(document, index, text, titleLevel, titleContents);
 * });
 */
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
