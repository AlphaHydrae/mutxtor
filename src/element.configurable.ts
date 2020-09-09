import { isFunction } from 'lodash';

import TextDocument from './document';
import TextElement from './element';

export type TextElementInitializer = (this: ConfigurableTextElement, data: any) => void;

export type TextElementMutator = (this: ConfigurableTextElement, data: any) => void;

/**
 * A text element that has a configurable behavior.
 */
export default class ConfigurableTextElement extends TextElement {
  readonly data: any;
  mutator?: TextElementMutator;

  /**
   * Creates a text element with arbitrary data which can be used at mutation time.
   *
   * Also calls the `this.initializer` function attached to this element, if any.
   *
   * @param document The document in which the element was found or is to be inserted.
   * @param start The index at which the element's text is found in the document.
   * @param text The element's text.
   * @param data Data to attach to the element.
   */
  constructor(document: TextDocument, start: number, text: string, data: any) {
    super(document, start, text);

    /**
     * Arbitrary data that will be available at mutation time.
     * @type {object}
     */
    this.data = data;

    // If an initializer function is defined, call it.
    // TODO: create a setter for the initializer and the type
    if (isFunction(data.initializer)) {
      data.initializer.call(this, data);
    }
  }

  /**
   * Calls the `this.mutator` function attached to this element, if any.
   */
  mutate() {
    // TODO: create a setter for the mutator
    if (isFunction(this.mutator)) {
      return this.mutator.call(this, this.data);
    }
  }

  /**
   * Returns a string representing this element.
   */
  toStringProperties() {
    return [ 'type' ].concat(super.toStringProperties());
  }

}
