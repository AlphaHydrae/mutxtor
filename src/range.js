import { isInteger } from 'lodash';

/**
 * A range of text, defined by a start and end indices.
 */
export default class TextRange {

  /**
   * Constructs a new text range.
   *
   * @param {integer} start - The start index (inclusive) of this range.
   * @param {integer} end - The end index (exclusive) of this range.
   */
  constructor(start, end) {
    if (!isInteger(start) || start < 0) {
      throw new Error('Text range start must be an integer greater than or equal to 0; got ' + JSON.stringify(start) + ' (' + typeof(start) + ')');
    } else if (!isInteger(end) || end < 1) {
      throw new Error('Text range end must be an integer greater than or equal to 1; got ' + JSON.stringify(end) + ' (' + typeof(end) + ')');
    } else if (end <= start) {
      throw new Error('Text range end must be greater than start; got ' + end + ' (start is ' + start + ')');
    }

    /**
     * The start index (inclusive) of this range.
     * @type {integer}
     */
    this.start = start;

    /**
     * The end index (exclusive) of this range.
     * @type {integer}
     */
    this.end = end;
  }

  /**
   * Indicates whether the specified range overlaps with this one.
   *
   * @param {TextRange} range - The range to check.
   * @returns {boolean} True if the specified range overlaps with this one, false otherwise.
   */
  overlaps(range) {
    if (!(range instanceof TextRange)) {
      throw new Error('Range must be an instance of TextRange');
    }

    // Check the specified range...
    return (start >= this.start && start < this.end) || // It starts within this range.
      (end > start && end <= this.end) ||               // It ends within this range.
      (start <= this.start && end >= this.end);         // It is around this range.
  }

  /**
   * Moves this range by the specified number of characters.
   *
   * @param {integer} delta - The value to add or remove to this range's start and end indices.
   * @returns {TextRange} This range.
   */
  moveBy(delta) {
    if (!isInteger(delta)) {
      throw new Error('Delta must be an integer; got ' + JSON.stringify(delta) + ' (' + typeof(delta) + ')');
    } else if (this.start + delta < 0) {
      throw new Error('Delta cannot move the start index of this range below 0 (current start index is ' + this.start + ')');
    }

    this.start += delta;
    this.end += delta;

    return this;
  }

  /**
   * Returns the contents of this range within the specified text.
   *
   * @param {string} text - The text from which to extract this range.
   * @returns {string} This range's text.
   */
  extractFromText(text) {
    if (!this.isInText(text)) {
      throw new Error('Text range ' + this.start + '-' + this.end + ' is not in text (total length is ' + text.length + ')');
    }

    return text.slice(this.start, this.end);
  }

  /**
   * Indicates whether this range exists within the specified text.
   *
   * @param {string} text - The text in which to check.
   * @returns {boolean} True if this range fits within the bounds of the text, false otherwise.
   */
  isInText(text) {
    return this.start <= text.length - 1 && this.end <= text.length;
  }

}
