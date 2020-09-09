import { each, every, find, findLast, includes, isArray, isFunction, last, reject, sortedIndexBy } from 'lodash';
import { EventEmitter } from 'events';
import { fn as isGeneratorFunction } from 'is-generator';

import SpliceTextMutation from './mutation.splice';
import TextElement from './element';
import ParserBuilder from './parser-builder';
import TextQuery, { TextElementPredicateFunc } from './query';
import TextMutation from './mutation';

export type TextDocumentGenerator = Generator<TextElement, void, TextElement>;
export type TextDocumentGeneratorFactory = (document: TextDocument) => TextDocumentGenerator;
export type TextDocumentParserFunc = (document: TextDocument) => TextElement[];

/**
 * The start of a text document.
 */
export const TextDocumentStart = Symbol('start');

/**
 * The end of a text document.
 */
export const TextDocumentEnd = Symbol('end');

/**
 * A plain text document that can be mutated (or modified).
 *
 * To mutate a document, you must first add parsers which will identify elements in the text, using {@link TextDocument#addParser} or {@link TextDocument#buildParser}.
 *
 * Parsers must be generator functions which parse the document and yield the text elements they identify.
 * These elements must be subclasses of {@link TextElement} and must be yielded in the order they are found in the document.
 * If the element needs to be mutated, its subclass must know how to modify its own text or the document to obtain the desired end result.
 * See {@link ParserBuilder} for an example of how to create a parser.
 *
 * When you have added all the parsers you need, call {@link TextDocument#mutate}.
 * This will trigger the parsing, then mutate each element one by one until the end of the document has been reached.
 *
 * ## Events
 *
 * A text document is an {@link events~EventEmitter} that emits the following events:
 *
 * * `element` - Emitted after calling {@link TextDocument#mutate} while the parsing is in progress, for each new element identified by a parser.
 *   The parsed {@link TextElement} is provided to listeners.
 * * `parsed` - Emitted after calling {@link TextDocument#mutate} when parsing the document is complete.
 * * `mutate` - Emitted after calling {@link TextDocument#mutate} while the document is being mutated, once for each element that triggered a mutation.
 *   The {@link TextMutation} object describing the change is provided to listeners.
 */
export default class TextDocument extends EventEmitter {
  /**
   * The document's text.
   */
  text: string;
  /**
   * The {@link TextElement} objects identified in the document by the parsers.
   */
  readonly elements: TextElement[];
  /**
   * The document's parsers.
   */
  private parsers: Array<TextDocumentGeneratorFactory>;

  /**
   * Creates a text document.
   *
   * @param text The document's text.
   */
  constructor(text: string) {
    super();

    this.text = text;
    this.elements = [];
    this.parsers = [];

    // TODO: automatically update max listeners
    this.setMaxListeners(1000);
  }

  /**
   * Adds a parser for this document.
   *
   * Parsers will be invoked when calling {@link TextDocument#mutate}.
   *
   * @param parser A generator function that yields {@link TextElement} objects
   * in order, or a function that returns an ordered array of parsed
   * {@link TextElement} objects.
   * @returns This document.
   */
  addParser(parser: TextDocumentGeneratorFactory | TextDocumentParserFunc) {
    if (!isFunction(parser)) {
      throw new Error('Parser must be a function or a generator function');
    } else if (!isGeneratorFunction(parser)) {
      parser = toGenerator(this, parser as unknown as TextDocumentParserFunc);
    }

    this.parsers.push(parser as unknown as TextDocumentGeneratorFactory);

    return this;
  }

  /**
   * Returns a parser builder for this document. Any argument is passed to the
   * builder's constructor as additional arguments after this document.
   *
   * The returned builder will add a parser to this document when calling
   * {@link ParserBuilder#add}.
   *
   * @param type The type of parsed {@link TextElement} objects.
   * @returns A parser builder for this document.
   */
  buildParser(type?: string) {
    return new ParserBuilder(this, type);
  }

  /**
   * Adds a text element to this document.
   *
   * The element must not overlap any other element already present in the document.
   *
   * @param element The text element to add.
   * @returns This document.
   */
  addElement(element: TextElement) {

    const lastElement = last(this.elements);
    if (lastElement === undefined || element.start >= lastElement.end) {
      // If there are no elements yet, or this element is after the last element, simply add it to the list.
      this.elements.push(element);
    } else {

      // Otherwise, perform a binary search to find the correct index to insert the element
      // so that its position in the array is consistent with its position in the text.
      const elementIndex = sortedIndexBy(this.elements, element, (e) => e.start);

      // Ensure that the element does not overlap with the previous element.
      const previousElement = this.elements[elementIndex - 1];
      if (previousElement && previousElement.overlaps(element)) {
        throw new Error('Previous element ' + previousElement + ' overlaps with new element ' + element);
      }

      // Ensure that the element does not overlap with the next element.
      const nextElement = this.elements[elementIndex];
      if (nextElement && nextElement.overlaps(element)) {
        throw new Error('Next element ' + nextElement + ' overlaps with new element ' + element);
      }

      // Insert the element.
      this.elements.splice(elementIndex, 0, element);
    }

    this.emit('element', element);

    return this;
  }

  /**
   * Removes the specified element from this document.
   *
   * @param element The element to remove.
   * @returns This document.
   */
  removeElement(element: TextElement) {

    const index = this.elements.indexOf(element);
    if (index < 0) {
      throw new Error('Element ' + element + ' is not in this document');
    }

    this.elements.splice(index, 1);

    return this;
  }

  /**
   * Mutates this document.
   *
   * This is done in two steps:
   *
   * 1. All parsers will be invoked and used to parse the entire document.
   * 2. All identified text elements will be mutated one by one in order.
   *
   * @returns A promise that will be resolved when the mutation is complete.
   */
  async mutate() {

    this.parseTextElements();
    this.emit('parsed');

    for (const element of this.elements.slice()) {
      await element.mutate();
    }

    return this;
  }

  /**
   * Performs a text element mutation that appends text at the end of this document.
   *
   * @param element The element that triggered the mutation.
   * @param text The text to append.
   * @returns This document.
   */
  append(element: TextElement | undefined, text: string) {
    return this.insert(element, this.text.length, text);
  }

  /**
   * Performs a text element mutation that appends text after the specified element in this document.
   *
   * If the element is {@link TextDocumentStart}, the text is prepended to the beginning of the document.
   * If the element is {@link TextDocumentEnd}, the text is appended to the end of the document.
   *
   * @param {TextElement|TextDocumentStart|TextDocumentEnd} element - The element to append the text to.
   * @param {String} text - The text to append.
   * @returns {TextDocument} This document.
   *
   * @example
   * // Append text to an element
   * document.appendTo(element, 'foo');
   * // Append text to an element, or to the end of the document if the element is null
   * document.appendTo(elementThatMayBeNull || TextDocumentEnd, ']');
   */
  appendTo(element: TextElement | typeof TextDocumentStart | typeof TextDocumentEnd, text: string) {
    if (element === TextDocumentStart) {
      return this.prepend(undefined, text);
    } else if (element === TextDocumentEnd) {
      return this.append(undefined, text);
    } else if (element instanceof TextElement) {
      return element.append(text);
    } else {
      throw new Error('Element must be a TextElement or TextDocumentStart or TextDocumentEnd');
    }
  }

  /**
   * Performs a text element mutation that prepends text to the beginning of this document.
   *
   * @param element The element that triggered the mutation.
   * @param text The text to prepend.
   * @returns This document.
   */
  prepend(element: TextElement | undefined, text: string) {
    return this.insert(element, 0, text);
  }

  /**
   * Performs a text element mutation that prepends text to the specified
   * element in this document.
   *
   * If the element is {@link TextDocumentStart}, the text is inserted at the
   * beginning of the document. If the element is {@link TextDocumentEnd}, the
   * text is appended to the end of the document.
   *
   * @param element The element to prepend the text to.
   * @param text The text to prepend.
   * @returns This document.
   *
   * @example
   * // Prepend text to an element
   * document.prependTo(element, 'foo');
   * // Prepend text to an element, or append it to the end of the document if the element is null
   * document.prependTo(elementThatMayBeNull || TextDocumentEnd, ']');
   */
  prependTo(element: TextElement | typeof TextDocumentStart | typeof TextDocumentEnd, text: string) {
    if (element === TextDocumentStart) {
      return this.prepend(undefined, text);
    } else if (element === TextDocumentEnd) {
      return this.append(undefined, text);
    } else if (element instanceof TextElement) {
      return element.prepend(text);
    } else {
      throw new Error('Element must be a TextElement or TextDocumentStart or TextDocumentEnd');
    }
  }

  /**
   * Performs a text element mutation that inserts additional text into the document.
   *
   * @param element The element that triggered the mutation.
   * @param index The index at which to insert the text.
   * @param text The text to insert.
   * @returns This document.
   */
  insert(element: TextElement | undefined, index: number, text: string) {
    return this.performMutation(new SpliceTextMutation(element, index, 0, text));
  }

  /**
   * Performs a text element mutation that replaces part of the text in this document by another text.
   *
   * @param element The element that triggered the mutation.
   * @param start The start index (inclusive) of the text range to replace.
   * @param end The end index (exclusive) of the text range to replace.
   * @param text The text to replace the selected range with.
   * @returns This document.
   */
  replace(element: TextElement, start: number, end: number, text: string) {
    return this.performMutation(new SpliceTextMutation(element, start, end - start, text));
  }

  /**
   * Performs a text element mutation that removes the element from the document.
   *
   * @param element The element that triggered the mutation.
   * @param start The start index (inclusive) of the text range to remove.
   * @param end The end index (exclusive) of the text range to remove.
   * @returns This document.
   */
  remove(element: TextElement, start: number, end: number) {
    return this.performMutation(new SpliceTextMutation(element, start, end - start));
  }

  /**
   * Returns a text query for this document.
   *
   * @returns A text query.
   */
  query() {
    return new TextQuery(this);
  }

  /**
   * Finds the first text element in this document that matches the specified
   * conditions.
   *
   * @param predicate A function that will be passed each element and should
   * return true if the element matches the desired conditions.
   * @returns The first element matching the predicate, or `undefined`.
   */
  find(predicate: TextElementPredicateFunc) {
    return find(this.elements, predicate);
  }

  /**
   * Finds the last text element in this document that matches the specified
   * conditions.
   *
   * @param predicate A function that will be passed each element and should
   * return true if the element matches the desired conditions.
   * @returns The last element matching the predicate, or `undefined`.
   */
  findLast(predicate: TextElementPredicateFunc) {
    return findLast(this.elements, predicate);
  }

  /**
   * Finds the first text element after the specified element in this document
   * that matches the specified conditions.
   *
   * @param element The element after which to search.
   * @param predicate A function that will be passed each element and should
   * return true if the element matches the desired conditions.
   * @returns The last element matching the predicate, or `undefined`.
   */
  findNext(element: TextElement, predicate: TextElementPredicateFunc) {
    if (!includes(this.elements, element)) {
      throw new Error('Element ' + element + ' is not in document');
    }

    return this.find(e => e.start > element.start && predicate(e));
  }

  /**
   * Finds the last text element before the specified element in this document
   * that matches the specified conditions.
   *
   * @param element The element before which to search.
   * @param predicate A function that will be passed each element and should
   * return true if the element matches the desired conditions.
   * @returns The last element matching the predicate, or `undefined`.
   */
  findPrevious(element: TextElement, predicate: TextElementPredicateFunc) {
    if (!includes(this.elements, element)) {
      throw new Error('Element ' + element + ' is not in document');
    }

    return this.findLast(e => e.start < element.start && predicate(e));
  }

  private parseTextElements() {

    // Get the parsers' iterators (parsers are generator functions).
    let iterators: any[] = this.parsers.map(parser => parser(this));

    // Get the first text element yielded by each parser.
    each(iterators, parseNextTextElement);

    // Reject parsers that yielded no element.
    iterators = reject(iterators, parserIsDone);

    // While there are still parsers with text elements...
    while (!every(iterators, parserIsDone)) {

      // Sort the last retrieved text elements by start index.
      iterators.sort((a, b) => a.element.start - b.element.start);

      // Add the first one to the document.
      const element = iterators[0].element;
      this.addElement(element);

      // Get the parser's next text element.
      parseNextTextElement(iterators[0]);

      // If the parser is done, remove it from the list of active parsers.
      if (parserIsDone(iterators[0])) {
        iterators.shift();
      }
    }
  }

  private performMutation(mutation: TextMutation) {
    this.text = mutation.apply(this.text);
    this.emit('mutate', mutation);
    return this;
  }
}

// Transforms a function that returns a list to a generator function that yields
// the items of that list.
function toGenerator(document: TextDocument, parser: TextDocumentParserFunc): TextDocumentGeneratorFactory {
  return function*() {

    const elements = parser(document);
    if (!isArray(elements)) {
      throw new Error('Parser must be a function that returns an array of ordered TextElement objects');
    }

    while (elements.length) {
      const element = elements.shift();
      if (!element) {
        throw new Error('Falsy element in TextElement array');
      }

      yield element;
    }
  };
}

function parserIsDone(parserIterator: any) {
  return parserIterator.current && parserIterator.current.done;
}

function parseNextTextElement(parserIterator: any) {

  const previousElement = parserIterator.element;

  parserIterator.current = parserIterator.next();
  parserIterator.element = parserIterator.current.value;

  if (!parserIsDone(parserIterator) && !(parserIterator.element instanceof TextElement)) {
    throw new Error('Parsers must return TextElement objects; got ' + typeof(parserIterator.element));
  } else if (!parserIsDone(parserIterator) && previousElement && parserIterator.element.start <= previousElement.start) {
    throw new Error('Parsers must yield TextElement objects in order; got ' + parserIterator.element + ' which starts at index ' + parserIterator.element.start + ' while the previous element ' + previousElement + ' starts at index ' + previousElement.start);
  }

  return parserIterator.element;
}
