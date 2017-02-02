import TextMutation from './mutation';

/**
 * A text mutation that removes and/or adds characters at a specific index in a text, much like `Array.prototype.splice` does for arrays.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/splice
 */
export default class SpliceTextMutation extends TextMutation {

  /**
   * Creates a splice mutation.
   *
   * @param {TextElement} element - The text element being mutated.
   * @param {integer} index - The index in the text document at which to remove and/or add characters.
   * @param {integer} removeCount - How many characters to remove at the specified index (can be 0).
   * @param {string} [textToAdd] - The text to add at the specified index (can be omitted if you only need to remove text).
   */
  constructor(element, index, removeCount, textToAdd) {
    // TODO: validate
    super(element);

    /**
     * The index in the text document at which to remove and/or add characters.
     * @type {integer}
     */
    this.index = index;

    /**
     * How many characters to remove at the specified index.
     * @type {integer}
     */
    this.removeCount = removeCount;

    /**
     * The text to add at the specified index.
     * @type {string}
     */
    this.textToAdd = textToAdd;
  }

  /**
   * Returns the index at which splicing takes place in the text document.
   *
   * @returns {integer} The index at which splicing takes place.
   */
  get start() {
    return this.index;
  }

  /**
   * Returns the end index (exclusive) of the text range removed by the mutation, if any.
   *
   * @returns {integer|undefined} The end index (exclusive) of the text range removed by the mutation, or `undefined` if it only adds new text.
   */
  get end() {
    return this.removeCount ? this.index + this.removeCount : undefined;
  }

  /**
   * Returns the difference between the length of the added text and the number of removed characters.
   *
   * @returns {integer} The number of characters added to or removed from the document by this mutation.
   */
  get delta() {
    return (this.removeCount ? -this.removeCount : 0) + (this.textToAdd ? this.textToAdd.length : 0);
  }

  /**
   * Applies this mutation to the specified text.
   *
   * @param {string} text - The text to change.
   * @returns {string} The changed text.
   */
  apply(text) {
    if (this.removeCount) {
      text = text.slice(0, this.index) + text.slice(this.index + this.removeCount);
    }

    if (this.textToAdd) {
      text = text.slice(0, this.index) + this.textToAdd + text.slice(this.index);
    }

    return text;
  }

}
