import { extend, pick } from 'lodash';

import ConfigurableTextElement from './element.configurable';

/**
 * A chainable builder to add a text parser to a {@link TextDocument}.
 *
 * {@link TextDocument} parsers are generator functions that must return {@link TextElement} objects, usually a subclass.
 * This builder simplifies making such a function.
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
   * Creates a builder that will add a parser to the specified document.
   *
   * @param {TextDocument} document - The document to add the parser to.
   * @param {string} [type] - An optional type that will be set on parsed {@link TextElement} objects.
   * This can be useful to distinguish between different element types since all elements parsed by this build's parser will be instances of the same {@link TextElement} subclass.
   */
  constructor(document, type) {

    /**
     * The document to which this builder will add parsers.
     * @type {TextDocument}
     */
    this.document = document;

    if (type !== undefined) {
      /**
       * The type of parsed {@link TextElement} objects.
       * @type {string}
       */
      this.type = type;
    }
  }

  /**
   * Configures the parser to look for text elements matching the specified regular expression in the document.
   *
   * The regular expression can have the global flag or not, depending on whether you need to parse a single or multiple elements.
   *
   * @param {RegExp} regexp - The regular expression to use to find text elements.
   * @returns {ParserBuilder} This builder.
   */
  regexp(regexp) {

    /**
     * @access private
     */
    this.generator = regexpGeneratorFactory(regexp, (document, match) => {
      return createElement(this, match.index, match[0], {
        match: match
      });
    });

    return this;
  }

  /**
   * Sets the type that will be set on parsed {@link TextElement} objects.
   *
   * This overrides the type supplied to the constructor.
   *
   * @param {string} type - The type to set on parsed {@link TextElement} objects.
   * @returns {ParserBuilder} This builder.
   */
  elementType(type) {
    this.type = type;
    return this;
  }

  /**
   * Sets the initializer function that will be invoked for each parsed {@link TextElement} object.
   * It will be bound to the parsed object.
   *
   * @param {function} initializer - An initializer function.
   * @returns {ParserBuilder} This builder.
   */
  initialize(initializer) {
    /**
     * @access private
     */
    this.initializer = initializer;
    return this;
  }

  /**
   * Sets the mutator function that will be invoked when each parsed {@link TextElement} object is mutated.
   * It will be bound to the parsed object.
   *
   * @param {function} mutator - A mutator function.
   * @returns {ParserBuilder} This builder.
   */
  mutate(mutator) {
    /**
     * @access private
     */
    this.mutator = mutator;
    return this;
  }

  /**
   * Adds the configured parser to this builder's document.
   *
   * @returns {ParserBuilder} This builder.
   */
  add() {
    this.document.addParser(this.generator);
    return this;
  }

}

function createElement(builder, start, text, data) {
  const element = new ConfigurableTextElement(builder.document, start, text, data);
  extend(element, pick(builder, 'initializer', 'mutator', 'type'));
  return element;
}

function regexpGeneratorFactory(regexp, factory) {
  return function*(document) {

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
        throw new Error('Parser must not match the same text twice (at index ' + index + ')');
      }

      index = match.index;
      yield factory(document, match);
    }
  };
}
