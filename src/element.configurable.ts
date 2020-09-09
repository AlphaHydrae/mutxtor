import TextDocument from './document';
import TextElement from './element';

export interface TextElementOptions<Data> {
  readonly data: Data;
  readonly initializer?: TextElementInitializer<Data>;
}

export type TextElementInitializer<Data> = (this: ConfigurableTextElement<Data>, data: Data) => void;

export type TextElementMutator<Data> = (this: ConfigurableTextElement<Data>, data: Data) => void;

/**
 * A text element that has a configurable behavior.
 */
export default class ConfigurableTextElement<Data = void> extends TextElement {

  /**
   * Arbitrary data that will be available at mutation time.
   */
  readonly data: Data;

  mutator?: TextElementMutator<Data>;

  type?: string;

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
  constructor(
    document: TextDocument,
    start: number,
    text: string,
    { data, initializer }: TextElementOptions<Data>
  ) {
    super(document, start, text);

    this.data = data;

    // If an initializer function is defined, call it.
    // TODO: create a setter for the initializer and the type
    if (initializer) {
      initializer.call(this, data);
    }
  }

  /**
   * Calls the `this.mutator` function attached to this element, if any.
   */
  mutate() {
    // TODO: create a setter for the mutator
    if (this.mutator) {
      return this.mutator.call(this, this.data);
    }
  }

  /**
   * Returns a string representing this element.
   */
  toStringProperties() {
    return [ 'type', ...super.toStringProperties() ];
  }

}
