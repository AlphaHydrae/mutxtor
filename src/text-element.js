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
export default class TextElement {

  /**
   * Creates a text element for the specified document.
   *
   * @param {string} document - The document in which the element was found or is to be inserted.
   * @param {number} start - The index at which the element's text is found in the document.
   * @param {string} text - The element's text.
   */
  constructor(document, start, text) {

    /**
     * The document in which the text element is located.
     * @type {TextDocument}
     */
    this.document = document;

    /**
     * The index at which the element's text is found in the document (inclusive).
     * @type {number}
     */
    this.start = start;

    /**
     * The element's text.
     * @type {string}
     */
    this.text = text || '';

    /**
     * The index at which the element's text ends in the document (exclusive).
     * @type {number}
     */
    this.end = this.start + this.text.length;

    document.on('mutate', this.onDocumentMutated.bind(this));
  }

  /**
   * Indicates whether the specified element or range overlaps with this element.
   *
   * @param {TextElement|TextRange} elementOrRange - The element or range to check.
   */
  overlaps(elementOrRange) {

    const start = elementOrRange.start;
    const end = elementOrRange.end;
    if (start == end) {
      return start > this.start && start < this.end;
    }

    return (start >= this.start && start < this.end) || // It starts within this element.
      (end > start && end <= this.end) ||               // It ends within this element.
      (start <= this.start && end >= this.end);         // It wraps this element.
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
   * @returns {TextElement} This element (for chaining).
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
   * @returns {string} This element (for chaining).
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
   * @returns {string} This element (for chaining).
   *
   * @example
   * mutate() {
   *   this.replace('This text is better.');
   * }
   */
  replace(text) {
    this.document.replace(this, this.start, this.end, text);
    this.text = text;
    this.end = this.end + text.length - (this.end - this.start);
    return this;
  }

  /**
   * Removes this element's text from the document.
   *
   * Utility method for use in {@link TextElement#mutate}.
   *
   * @returns {string} This element (for chaining).
   *
   * @example
   * mutate() {
   *   this.remove();
   * }
   */
  remove() {
    this.document.remove(this, this.start, this.end);
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
   * @returns {undefined} Nothing.
   */
  onDocumentMutated(mutation) {

    // Ignore mutation if it concerns this element or takes place before in the document.
    if (mutation.element == this || this.start < mutation.range.start) {
      return;
    }

    // Update this element's indices to take the added/removed text into account.
    const delta = mutation.delta;
    this.start += delta;
    this.end += delta;
  }

  toString() {
    return this.constructor.name + '{start = ' + this.start + ', end = ' + this.end + ', text = "' + this.text.replace(/\n/g, '\\n') + '"}';
  }
}
