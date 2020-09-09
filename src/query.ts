import { every, isFunction, isPlainObject, isString, matches, matchesProperty, some } from 'lodash';

import TextDocument from './document';
import TextElement from './element';

enum Direction {
  Ascending,
  Descending,
  None
}

export type TextElementPredicateObject = Record<string, any>;
export type TextElementPredicateFunc = (element: TextElement) => boolean;
export type TextElementPredicate = TextElementPredicateFunc;

/**
 * A configurable query to find {@link TextElement} objects in a {@link TextDocument},
 * similar in principle to a database query.
 *
 * Use {@link TextDocument#query} to start a query on a document, then {@link TextQuery#first} or {@link TextQuery#all} to execute the query.
 */
export default class TextQuery {
  readonly document: TextDocument;
  private readonly predicates: TextElementPredicateFunc[];
  private readonly untilPredicates: TextElementPredicateFunc[];
  private direction: Direction;
  private afterIndex?: number;
  private beforeIndex?: number;
  private aroundIndex?: number;

  /**
   * Constructs a query for the specified document.
   *
   * @param {TextDocument} document - The document to run the query on.
   */
  constructor(document: TextDocument) {
    this.document = document;
    this.predicates = [];
    this.untilPredicates = [];
    this.direction = Direction.None;
  }

  /**
   * Adds a predicate that text elements must match to fulfill the query.
   *
   * The predicate may be in three forms:
   *
   * 1. `where(String, String)` - Only elements with a matching property/value
   *    pair will match, e.g. `where("type", "foo")`.
   * 2. `where(Object)` - Only elements that match all properties and values in
   *    the object will match, e.g. `where({ foo: "bar", baz: "qux" })`.
   * 3. `where(Function)` - Only elements for which the predicate returns true
   *    will match, e.g. `where((e) => e.looksGood)`.
   *
   * @param {String|Object|Function} args - A predicate which elements must
   * match.
   * @returns {TextQuery} This query.
   */
  where(property: string, expectedValue: string): this;
  where(expectedProperties: Record<string, any>): this;
  where(predicate: TextElementPredicateFunc): this;
  where(arg: string | Record<string, any> | TextElementPredicateFunc, expectedValue?: string): this {
    this.predicates.push(makePredicate(arg, expectedValue));
    return this;
  }

  /**
   * Adds a predicate that will interrupt the query as soon as an element
   * matches, and return the previously matching elements up until that point.
   *
   * The predicate may be in three forms:
   *
   * 1. `until(String, String)` - Only elements with a matching property/value
   *    pair will match, e.g. `until("type", "foo")`.
   * 2. `until(Object)` - Only elements that match all properties and values in
   *    the object will match, e.g. `until({ foo: "bar", baz: "qux" })`.
   * 3. `until(Function)` - Only elements for which the predicate returns true
   *    will match, e.g. `until((e) => e.looksGood)`.
   *
   * @param args A predicate which will interrupt the query when a matching
   * element is found.
   * @returns This query.
   */
  until(property: string, expectedValue: string): this;
  until(expectedProperties: Record<string, any>): this;
  until(predicate: TextElementPredicateFunc): this;
  until(arg: string | Record<string, any> | TextElementPredicateFunc, expectedValue?: string): this {
    this.untilPredicates.push(makePredicate(arg, expectedValue));
    return this;
  }

  /**
   * Only look for elements after the specified element.
   *
   * @param element The boundary element.
   * @return This query.
   */
  after(element: TextElement) {
    this.afterIndex = indexOfElement(this.document, element);
    return this;
  }

  /**
   * Only look for elements before the specified element.
   *
   * @param element The boundary element.
   * @return This query.
   */
  before(element: TextElement) {
    this.beforeIndex = indexOfElement(this.document, element);
    return this;
  }

  /**
   * Looks for elements before and after the specified element.
   *
   * This will search backward and forward from the boundary element,
   * and can be combined with {@link TextQuery#until} to easily find
   * surrounding elements.
   *
   * This cannot be combined with {@link TextQuery#ascending} or {@link TextQuery#descending}.
   *
   * @param element The boundary element.
   * @returns This query.
   */
  around(element: TextElement) {
    if (this.direction !== Direction.None) {
      throw new Error('Text query around an element cannot be used with #ascending or #descending');
    }

    this.aroundIndex = indexOfElement(this.document, element);
    return this;
  }

  /**
   * Look for elements in ascending order (from the beginning to the end of the
   * text). This is the default behavior.
   *
   * @returns This query.
   */
  ascending() {
    this.direction = Direction.Ascending;
    return this;
  }

  /**
   * Look for elements in descending order (from the end to the beginning of the
   * text).
   *
   * @returns This query.
   */
  descending() {
    this.direction = Direction.Descending;
    return this;
  }

  /**
   * Executes the query and returns only the first matching element.
   *
   * @returns The first matching element, or undefined if none was found.
   */
  first() {
    return this.execute(false);
  }

  /**
   * Executes the query and returns all matching elements.
   *
   * If the query is made in descending order, the result array will contain the
   * elements in reverse order compared to their position in the text.
   *
   * @returns An array of the matching elements.
   */
  all() {
    if (this.aroundIndex !== undefined && this.direction != Direction.None) {
      throw new Error('A text query for all elements around an element cannot be ascending or descending; use #first or do not specify an order');
    }

    return this.execute(true);
  }

  private collect(start: number, end: number, multiple: boolean, matchingElements: TextElement[]) {

    const elements = this.document.elements;
    const increment = (end - start) / Math.abs(end - start);

    if (start < 0 || start >= elements.length) {
      return;
    }

    let index = start;
    while (increment > 0 ? index <= end : index >= end) {

      let e = elements[index];
      if (anyPredicateMatches(this.untilPredicates, e)) {
        break;
      }

      if (allPredicatesMatch(this.predicates, e)) {
        matchingElements.push(e);
        if (!multiple) {
          break;
        }
      }

      index += increment;
    }
  }

  private execute(multiple: boolean) {

    const elements = this.document.elements;
    if (!elements.length) {
      return multiple ? [] : undefined;
    }

    const matchingElements: TextElement[] = [];
    if (this.aroundIndex !== undefined) {
      this.collect(this.aroundIndex + 1, elements.length - 1, multiple, matchingElements);
      this.collect(this.aroundIndex - 1, 0, multiple, matchingElements);
    } else {
      let start = this.afterIndex !== undefined ? this.afterIndex + 1 : 0;
      let end = this.beforeIndex !== undefined ? this.beforeIndex - 1 : elements.length - 1;

      if (this.direction === Direction.Descending) {
        const tmp = start;
        start = end;
        end = tmp;
      }

      if (this.beforeIndex !== 0 && this.afterIndex !== elements.length - 1) {
        this.collect(start, end, multiple, matchingElements);
      }
    }

    matchingElements.sort((a, b) => this.direction !== Direction.Descending ? a.start - b.start : b.start - a.start);

    return multiple ? matchingElements : matchingElements[0];
  }
}

function allPredicatesMatch(predicates: TextElementPredicateFunc[], element: TextElement) {
  return every(predicates, predicate => predicate(element));
}

function anyPredicateMatches(predicates: TextElementPredicateFunc[], element: TextElement) {
  return some(predicates, predicate => predicate(element));
}

function indexOfElement(document: TextDocument, element: TextElement) {

  const index = document.elements.indexOf(element);
  if (index < 0) {
    throw new Error(`Element ${element} is not in document`);
  }

  return index;
}

function makePredicate(arg: string | Record<string, any> | TextElementPredicateFunc, expectedValue?: string): TextElementPredicateFunc {
  if (isString(arg) && isString(expectedValue)) {
    return matchesProperty(arg, expectedValue);
  } else if (isPlainObject(arg)) {
    return matches(arg);
  } else if (isFunction(arg)) {
    return arg;
  } else {
    throw new Error(`Unsupported predicate`);
  }
}
