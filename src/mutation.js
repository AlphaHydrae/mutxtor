/**
 * A change in a text document.
 *
 * This is an abstract class that does nothing.
 * It should be subclasses and its methods overriden.
 */
export default class TextMutation {

  /**
   * Creates a new text mutation concerning the specified text element.
   *
   * @param {TextElement} element - The text element being mutated.
   */
  constructor(element) {
    // TODO: validate
    /**
     * The text element being mutated.
     * @type {TextElement}
     */
    this.element = element;
  }

  /**
   * The start index at which this mutation takes place in the text document.
   *
   * If the mutation affects an existing range of text, this must be the start index (inclusive) of that range.
   * If the mutation only adds new text, this must be the index at which that text will be inserted.
   *
   * @returns {integer} The index at which this mutation takes place in the text document.
   */
  get start() {
    return undefined;
  }

  /**
   * The end index at which this mutation takes place in the text document.
   *
   * If the mutation affects an existing range of text, this must be the end index (exclusive) of that range.
   * If the mutation only adds new text, this must be `undefined`.
   *
   * @returns {integer|undefined} The end index (exclusive) of the existing text range affected by this mutation, or `undefined` if the mutation only adds new text.
   */
  get end() {
    return undefined;
  }

  /**
   * The positive or negative difference of the total length of the text document after the mutation is applied.
   *
   * * If the mutation adds 3 characters, the delta is 3.
   * * If the mutation adds 5 characters and removes 7, the delta is -2.
   *
   * @returns {integer} The number of characters added to or removed from the document by this mutation.
   */
  get delta() {
    return 0;
  }

  /**
   * Applies this mutation to the specified text.
   *
   * @param {string} text - The text to change.
   * @returns {string} The changed text.
   */
  apply(text) {
    return text;
  }

}
