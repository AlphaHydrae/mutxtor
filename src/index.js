import polyfills from 'babel-polyfill';

import TextDocument from './document';
import TextElement from './element';
import { regexpParserFactory } from './parsers';

export { TextDocument, TextElement, regexpParserFactory };

export default {
  TextDocument: TextDocument,
  TextElement: TextElement,
  regexpParserFactory: regexpParserFactory
};

/**
 * @external {events~EventEmitter} https://nodejs.org/api/events.html#events_class_eventemitter
 */
