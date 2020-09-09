import 'core-js/stable';

import TextDocument from './document';
import { TextDocumentStart, TextDocumentEnd } from './document';
import TextElement from './element';
import ConfigurableTextElement from './element.configurable';
import TextMutation from './mutation';
import SpliceTextMutation from './mutation.splice';
import ParserBuilder from './parser-builder';
import TextRange from './range';

export { ConfigurableTextElement, ParserBuilder, SpliceTextMutation, TextDocument, TextDocumentStart, TextDocumentEnd, TextElement, TextMutation, TextRange };

/**
 * @external {events~EventEmitter} https://nodejs.org/api/events.html#events_class_eventemitter
 */
