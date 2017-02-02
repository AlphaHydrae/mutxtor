import polyfills from 'babel-polyfill';

import TextDocument from './document';
import TextElement from './element';
import ConfigurableTextElement from './element.configurable';
import TextMutation from './mutation';
import SpliceTextMutation from './mutation.splice';
import ParserBuilder from './parser-builder';
import TextRange from './range';

export { ConfigurableTextElement, ParserBuilder, SpliceTextMutation, TextDocument, TextElement, TextMutation, TextRange };

export default {
  ConfigurableTextElement: ConfigurableTextElement,
  ParserBuilder: ParserBuilder,
  SpliceTextMutation: SpliceTextMutation,
  TextDocument: TextDocument,
  TextElement: TextElement,
  TextMutation: TextMutation,
  TextRange: TextRange
};

/**
 * @external {events~EventEmitter} https://nodejs.org/api/events.html#events_class_eventemitter
 */
