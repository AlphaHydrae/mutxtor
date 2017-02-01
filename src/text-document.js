import _ from 'lodash';
import EventEmitter from 'events';
import { fn as isGeneratorFunction } from 'is-generator';
import Promise from 'bluebird';

import SpliceTextMutation from './mutation.splice';
import TextElement from './text-element';

/**
 * A plain text document that can be mutated (or modified).
 *
 * To mutate a document, you must first add parsers which will identify elements in the text (see {@link TextDocument#addParser}).
 * The elements identified by parsers must be subclasses of {@link TextElement} that know how to modify the text they contain to obtain the desired end result
 *
 * When you have added all the parsers you need, calling {@link TextDocument#mutate} will trigger the parsing,
 * then mutate each element one by one until the end of the document has been reached.
 */
export default class TextDocument extends EventEmitter {

  /**
   * Creates a text document.
   *
   * @param {string} text - The document's text.
   */
  constructor(text) {
    super();

    /**
     * The document's text.
     * @type {string}
     */
    this.text = text;

    /**
     * The document's parsers.
     * @type {array}
     */
    this.parsers = [];

    /**
     * The {@link TextElement} objects identified in the document by the parsers.
     * @type {array}
     */
    this.elements = [];
  }

  /**
   * Adds a parser for this document.
   *
   * @param {function} parser - A generator function that yields {@link TextElement} objects in order, or a function that returns an ordered array of parsed {@link TextElement} objects.
   */
  addParser(parser) {
    if (!_.isFunction(parser)) {
      throw new Error('Parser must be a function or a generator function');
    } else if (!isGeneratorFunction(parser)) {
      parser = toGenerator(this, parser);
    }

    this.parsers.push(parser);
  }

  addElement(element) {

    if (_.isEmpty(this.elements) || element.start >= _.last(this.elements).end) {
      this.elements.push(element);
    } else {

      const elementIndex = _.sortedIndexBy(this.elements, element, (e) => e.start);

      const previousElement = this.elements[elementIndex - 1];
      if (previousElement && previousElement.overlaps(element)) {
        throw new Error('Previous element ' + previousElement + ' overlaps with new element ' + element);
      }

      const nextElement = this.elements[elementIndex];
      if (nextElement && nextElement.overlaps(element)) {
        throw new Error('Next element ' + nextElement + ' overlaps with new element ' + element);
      }

      this.elements.splice(elementIndex, 0, element);
    }

    this.emit('element', element);
  }

  parse() {

    let doc = this;

    let parsing = _.reduce(this.parsers, (memo, parser) => {

      let iterator = parser(this),
          result = iterator.next();

      if (!result.done) {
        memo.push({
          iterator: iterator,
          result: result
        });
      }

      return memo;
    }, []);

    while (!_.every(parsing, 'result.done')) {

      parsing.sort((a, b) => a.result.value.start - b.result.value.start);

      let element = parsing[0].result.value;
      this.addElement(element);

      parsing[0].result = parsing[0].iterator.next();
      if (parsing[0].result.done) {
        parsing.shift();
      }
    }

    this.emit('parsed');
  }

  mutate() {

    this.parse();

    let promise = Promise.resolve();
    _.each(this.elements.slice(), (element) => promise = promise.then(() => element.mutate()));

    return promise;
  }

  insert(element, index, text) {
    return performMutation(this, new SpliceTextMutation(element, index, 0, text));
  }

  replace(element, start, end, text) {
    return performMutation(this, new SpliceTextMutation(element, start, end - start, text));
  }

  remove(element, start, end) {
    return performMutation(this, new SpliceTextMutation(element, start, end - start));
  }

  find(predicate) {
    return _.find(this.elements, predicate);
  }

  findLast(predicate) {
    return _.findLast(this.elements, predicate);
  }
}

function toGenerator(document, parser) {
  return function*() {
    var elements = parser(document);
    while (elements.length) {
      yield elements.shift();
    }
  };
}

function performMutation(document, mutation) {
  document.text = mutation.apply(document.text);
  document.emit('mutate', mutation);
  return this;
}
