import TextDocument, { TextDocumentGeneratorFactory } from './document';
import TextElement from './element';
import ConfigurableTextElement, { TextElementInitializer, TextElementMutator } from './element.configurable';

/**
 * A chainable builder to add a text parser to a {@link TextDocument}.
 *
 * {@link TextDocument} parsers are generator functions that must return
 * {@link TextElement} objects, usually a subclass. This builder simplifies
 * making such a function.
 *
 * @example
 * // Adds a parser that will prepend a horizontal rule before all titles in a Markdown document (except the main title).
 * document.buildParser('MarkdownTitle').regexp(/^(#+)\s*(.+)$/gm).mutate(function(data) {
 *   const titleLevel = data.match[1].length;
 *   if (titleLevel >= 2) {
 *     this.prepend('---\n');
 *   }
 * }).add();
 */
export default class ParserBuilder {

  /**
   * The document to which this builder will add parsers.
   */
  readonly document: TextDocument;

  /**
   * The generator built by this parser.
   */
  private generator?: TextDocumentGeneratorFactory;

  /**
   * The mutator function that will be invoked when each parsed
   * {@link TextElement} object is mutated. It will be bound to the parsed
   * object.
   */
  private mutator?: TextElementMutator<any>;

  /**
   * An initializer function that will be invoked for each parsed
   * {@link TextElement} object. It will be bound to the parsed object.
   */
  private initializer?: TextElementInitializer<any>;

  /**
   * The type of parsed {@link TextElement} objects.
   */
  private type?: string;

  /**
   * Creates a builder that will add a parser to the specified document.
   *
   * @param document The document to add the parser to.
   * @param type An optional type that will be set on parsed {@link TextElement}
   * objects. This can be useful to distinguish between different element types
   * since all elements parsed by this build's parser will be instances of the
   * same {@link TextElement} subclass.
   */
  constructor(document: TextDocument, type?: string) {
    this.document = document;
    this.type = type;
  }

  /**
   * Configures the parser to look for text elements matching the specified
   * regular expression in the document.
   *
   * The regular expression can have the global flag or not, depending on
   * whether you need to parse a single or multiple elements.
   *
   * @param regexp The regular expression to use to find text elements.
   * @returns This builder.
   */
  regexp(regexp: RegExp) {

    /**
     * @access private
     */
    this.generator = regexpGeneratorFactory(regexp, (document, match) => {
      return this.createElement(match.index ?? 0, match[0], { match });
    });

    return this;
  }

  /**
   * Sets the type that will be set on parsed {@link TextElement} objects.
   *
   * This overrides the type supplied to the constructor.
   *
   * @param type The type to set on parsed {@link TextElement} objects.
   * @returns This builder.
   */
  elementType(type: string) {
    this.type = type;
    return this;
  }

  /**
   * Sets the initializer function that will be invoked for each parsed
   * {@link TextElement} object. It will be bound to the parsed object.
   *
   * @param {function} initializer - An initializer function.
   * @returns {ParserBuilder} This builder.
   */
  initialize(initializer: (this: ConfigurableTextElement<any>, data: any) => void) {
    this.initializer = initializer;
    return this;
  }

  /**
   * Sets the mutator function that will be invoked when each parsed
   * {@link TextElement} object is mutated. It will be bound to the parsed
   * object.
   *
   * @param mutator A mutator function.
   * @returns This builder.
   */
  mutate(mutator: TextElementMutator<any>) {
    this.mutator = mutator;
    return this;
  }

  /**
   * Adds the configured parser to this builder's document.
   *
   * @returns This builder.
   */
  add() {
    if (!this.generator) {
      throw new Error('No generator has been defined');
    }

    this.document.addParser(this.generator);
    return this;
  }

  private createElement(start: number, text: string, data: any) {
    const { initializer, mutator, type } = this;
    const element = new ConfigurableTextElement(this.document, start, text, { data, initializer });
    element.mutator = mutator;
    element.type = type;
    return element;
  }

}

function regexpGeneratorFactory(regexp: RegExp, factory: (document: TextDocument, match: RegExpMatchArray) => TextElement): (document: TextDocument) => Generator<TextElement, void, TextElement> {
  return function*(document: TextDocument) {

    let match;
    if (!regexp.global) {
      if ((match = regexp.exec(document.text)) !== null) {
        yield factory(document, match);
      }

      return;
    }

    let index;
    while ((match = regexp.exec(document.text)) !== null) {
      if (match.index === index) {
        throw new Error(`Parser must not match the same text twice (at index ${index})`);
      }

      index = match.index;
      yield factory(document, match);
    }
  };
}
