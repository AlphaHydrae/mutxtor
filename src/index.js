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
