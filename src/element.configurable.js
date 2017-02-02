import { isFunction } from 'lodash';

import TextElement from './element';

/**
 * A text element that has a configurable behavior.
 */
export default class ConfigurableTextElement extends TextElement {

  /**
   * Creates a text element with arbitrary data which can be used at mutation time.
   *
   * Also calls the `this.initializer` function attached to this element, if any.
   *
   * @param {string} document - The document in which the element was found or is to be inserted.
   * @param {integer} start - The index at which the element's text is found in the document.
   * @param {string} text - The element's text.
   * @param {object} data - Data to attach to the element.
   */
  constructor(document, start, text, data) {
    super(document, start, text);

    /**
     * Arbitrary data that will be available at mutation time.
     * @type {object}
     */
    this.data = data;

    // If an initializer function is defined, call it.
    // TODO: create a setter for the initializer and the type
    if (isFunction(this.initialize)) {
      this.initialize.call(this, data);
    }
  }

  /**
   * Calls the `this.mutator` function attached to this element, if any.
   */
  mutate() {
    // TODO: create a setter for the mutator
    if (isFunction(this.mutator)) {
      this.mutator.call(this, this.data);
    }
  }

  /**
   * Returns a string representing this element.
   */
  toStringProperties() {
    return [ 'type' ].concat(super.toStringProperties());
  }

}
