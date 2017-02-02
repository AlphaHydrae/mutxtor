import { each, pick } from 'lodash';

import TextRange from './range';
import { stringify } from './utils';

/**
 * A text element is a part of a {@link TextDocument} that can be mutated.
 *
 * It is identified by its start (inclusive) and end (exclusive) indices in the document.
 * Text elements are identified when parsing a {@link TextDocument}.
 *
 * For example, take the following Markdown document:
 *
 * ```md
 * # Documentation
 *
 * Lorem ipsum dolor sit amet.
 *
 * ## Usage
 *
 * Consectetur adipiscing elit.
 * Maecenas laoreet hendrerit felis eget vulputate.
 *
 * ### Requirements
 *
 * * Aenean quis felis lacus.
 * * Proin lobortis, mauris at congue lacinia.
 * * Erat arcu cursus diam.
 * ```
 *
 * A parser for Markdown headers could identify the following text elements:
 *
 * * `# Documentation` starting at index 0 and ending at index 15.
 * * `## Usage` starting at index 46 and ending at index 54.
 * * `### Requirements` starting at index 135 and ending at index 151.
 *
 * By using a subclass of `TextElement`, the parser might also store additional information
 * about the elements, such as the titles' contents or level in this case.
 */
export default class TextElement extends TextRange {

  /**
   * Creates a text element for the specified document.
   *
   * @param {string} document - The document in which the element was found or is to be inserted.
   * @param {integer} start - The index at which the element's text is found in the document.
   * @param {string} text - The element's text.
   */
  constructor(document, start, text) {
    // TODO: validate
    super(start, start + text.length);

    /**
     * The document in which this text element is located.
     * @type {TextDocument}
     */
    this.document = document;

    /**
     * @access private
     */
    this.documentListeners = {};

    // Keep track of document mutations.
    this.onDocument('mutate', this.onDocumentMutated);
  }

  /**
   * This element's text.
   * @type {string}
   */
  get text() {
    return this.extractFromText(this.document.text);
  }

  /**
   * Mutates this element's text.
   *
   * This is an empty implementation which should be overridden in subclasses.
   * The supplied {@link TextDocument} has many utility methods to insert, modify or remove text.
   *
   * @returns {Promise|undefined} A promise which will be resolved when the mutation is complete, or nothing if the mutation was synchronous.
   */
  mutate() {
    // nothing to do
  }

  /**
   * Appends text after this element.
   *
   * Utility method for use in {@link TextElement#mutate}.
   *
   * @param {string} text - The text to append.
   * @returns {TextElement} This element.
   *
   * @example
   * mutate() {
   *   this.append(';');
   * }
   */
  append(text) {
    this.document.insert(this, this.end, text);
    return this;
  }

  /**
   * Prepends text before this element.
   * The text is not included into the element. Rather, the element is moved forward in the document to take into account the added text.
   *
   * Utility method for use in {@link TextElement#mutate}.
   *
   * @param {string} text - The text to prepend.
   * @returns {string} This element.
   *
   * @example
   * mutate() {
   *   this.prepend('---\n');
   * }
   */
  prepend(text) {
    this.document.insert(this, this.start, text);
    this.start += text.length;
    this.end += text.length;
    return this;
  }

  /**
   * Replaces this element's text by another text.
   *
   * Utility method for use in {@link TextElement#mutate}.
   *
   * @param {string} text - The new text.
   * @returns {string} This element.
   *
   * @example
   * mutate() {
   *   this.replace('This text is better.');
   * }
   */
  replace(text) {
    this.document.replace(this, this.start, this.end, text);
    this.end = this.end + text.length - (this.end - this.start);
    return this;
  }

  /**
   * Removes this element's text from the document.
   *
   * This will also remove the element from the document's list of elements,
   * and remove all of this elements' listeners registered with {@link TextElement#onDocument}.
   *
   * Utility method for use in {@link TextElement#mutate}.
   *
   * @returns {string} This element.
   *
   * @example
   * mutate() {
   *   this.remove();
   * }
   */
  remove() {
    this.document.remove(this, this.start, this.end);
    this.document.removeElement(this);
    this.removeDocumentListeners();
    return this;
  }

  /**
   * Registers a listener on a document event.
   *
   * Listeners registered with this method can later be removed with {@link TextElement#removeDocumentListeners}.
   *
   * @param {string} event - The name of the event to listen to.
   * @param {function} listener - The callback function.
   * @param {any} [context] - The context to which the callback function will be bound (`this` by default).
   * @returns {TextElement} This text element.
   */
  onDocument(event, listener, context) {

    const boundListener = listener.bind(context || this);
    this.document.on(event, boundListener);

    this.documentListeners[event] = this.documentListeners[event] || [];
    this.documentListeners[event].push(boundListener);

    return this;
  }

  /**
   * Unregisters listeners on document events.
   *
   * @param {string} [event] - If specified, all the listeners for that event will be unregistered. Otherwise, all listeners for all events will be unregistered.
   * @returns {TextElement} This text element.
   */
  removeDocumentListeners(event) {

    const toRemove = event ? pick(this.documentListeners, event) : this.documentListeners;
    each(toRemove, (listeners, event) => {
      each(listeners, (listener) => this.document.removeListener(event, listener));
    });

    return this;
  }

  /**
   * Called when this element's document is mutated.
   * If the mutation took place before this element in the text, this method
   * automatically moves the element's start and end indices by the correct amount.
   *
   * If the mutation concerns this element, this method does nothing
   * (it is the responsibility of elements to mutate themselves; this method
   * only reacts to the mutation of other elements).
   *
   * @param {TextMutation} mutation - The mutation that occurred.
   * @returns {undefined} Nothing.
   */
  onDocumentMutated(mutation) {
    if (mutation.element != this && this.start >= mutation.start) {
      this.moveBy(mutation.delta);
    }
  }

  /**
   * Returns a string representing this element.
   *
   * @returns {string}
   */
  toString() {
    return stringify(this, ...this.toStringProperties());
  }

  /**
   * Returns the properties that will be serialized in {@link TextElement#toString}.
   */
  toStringProperties() {
    return [ 'start', 'end', 'text' ];
  }
}
