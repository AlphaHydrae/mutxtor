import polyfills from 'babel-polyfill';

import TextDocument from './text-document';
import TextElement from './text-element';
import { regexpParserFactory } from './text-parsers';

export { TextDocument, TextElement, regexpParserFactory };

export default {
  TextDocument: TextDocument,
  TextElement: TextElement,
  regexpParserFactory: regexpParserFactory
};

/**
 * A range of text, defined by a start and end indices.
 *
 * @typedef {object} TextRange
 *
 * @property {number} start - The start index (inclusive) of the range within the text.
 * @property {number} end - The end index (exclusive) of the range within the text..
 */
