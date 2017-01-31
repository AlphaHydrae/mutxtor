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
   * Mutates this element's text.
   *
   * This is an empty implementation which should be overridden in subclasses.
   * The supplied {@link TextDocument} has many utility methods to insert, modify or remove text.
   *
   * @param {TextDocument} document - The document in which to mutate this element.
   * @returns {Promise|undefined} A promise which will be resolved when the mutation is complete, or nothing if the mutation was synchronous.
   */
  mutate(document) {
    // nothing to do
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
    if (mutation.element == this || this.start < mutation.index) {
      return;
    }

    // Keep track of the number of characters added or removed before this element.
    var delta = 0;

    if (mutation.remove) {
      delta -= mutation.remove;
    }

    if (mutation.insert) {
      delta += mutation.insert.length;
    }

    // Update this element's indices to take the added/removed text into account.
    this.start += delta;
    this.end += delta;
  }
}
