import { constant, every, isFunction, isPlainObject, matches, matchesProperty, some } from 'lodash';

const ASC = Symbol('asc');
const DESC = Symbol('desc');
const NONE = Symbol('none');

/**
 * A configurable query to find {@link TextElement} objects in a {@link TextDocument},
 * similar in principle to a database query.
 *
 * Use {@link TextDocument#query} to start a query on a document, then {@link TextQuery#first} or {@link TextQuery#all} to execute the query.
 */
export default class TextQuery {

  /**
   * Constructs a query for the specified document.
   *
   * @param {TextDocument} document - The document to run the query on.
   */
  constructor(document) {
    /**
     * @access private
     */
    this.document = document;
    /**
     * @access private
     */
    this.predicates = [];
    /**
     * @access private
     */
    this.untilPredicates = [];
    /**
     * @access private
     */
    this.direction = NONE;
  }

  /**
   * Adds a predicate that text elements must match to fulfill the query.
   *
   * The predicate may be in three forms:
   *
   * 1. `where(String, String)` - Only elements with a matching property/value pair will match, e.g. `where("type", "foo")`.
   * 2. `where(Object)` - Only elements that match all properties and values in the object will match, e.g. `where({ foo: "bar", baz: "qux" })`.
   * 3. `where(Function)` - Only elements for which the predicate returns true will match, e.g. `where((e) => e.looksGood)`.
   *
   * @param {String|Object|Function} args - A predicate which elements must match.
   * @returns {TextQuery} This query.
   */
  where(...args) {
    this.predicates.push(makePredicate(...args));
    return this;
  }

  /**
   * Adds a predicate that will interrupt the query as soon as an element matches, and return the previously matching elements up until that point.
   *
   * The predicate may be in three forms:
   *
   * 1. `where(String, String)` - Only elements with a matching property/value pair will match, e.g. `where("type", "foo")`.
   * 2. `where(Object)` - Only elements that match all properties and values in the object will match, e.g. `where({ foo: "bar", baz: "qux" })`.
   * 3. `where(Function)` - Only elements for which the predicate returns true will match, e.g. `where((e) => e.looksGood)`.
   *
   * @param {String|Object|Function} args - A predicate which will interrupt the query when a matching element is found.
   * @returns {TextQuery} This query.
   */
  until(...args) {
    this.untilPredicates.push(makePredicate(...args));
    return this;
  }

  /**
   * Only look for elements after the specified element.
   *
   * @param {TextElement} element - The boundary element.
   * @return {TextQuery} This query.
   */
  after(element) {
    /**
     * @access private
     */
    this.afterIndex = indexOfElement(this, element);
    return this;
  }

  /**
   * Only look for elements before the specified element.
   *
   * @param {TextElement} element - The boundary element.
   * @return {TextQuery} This query.
   */
  before(element) {
    /**
     * @access private
     */
    this.beforeIndex = indexOfElement(this, element);
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
   * @param {TextElement} element - The boundary element.
   * @returns {TextQuery} This query.
   */
  around(element) {
    if (this.direction != NONE) {
      throw new Error('Text query around an element cannot be used with #ascending or #descending');
    }

    /**
     * @access private
     */
    this.aroundIndex = indexOfElement(this, element);
    return this;
  }

  /**
   * Look for elements in ascending order (from the beginning to the end of the text).
   * This is the default behavior.
   *
   * @returns {TextQuery} This query.
   */
  ascending() {
    this.direction = ASC;
    return this;
  }

  /**
   * Look for elements in descending order (from the end to the beginning of the text).
   *
   * @returns {TextQuery} This query.
   */
  descending() {
    this.direction = DESC;
    return this;
  }

  /**
   * Executes the query and returns only the first matching element.
   *
   * @returns {TextElement|undefined} The first matching element, or undefined if none was found.
   */
  first() {
    return execute(this, false);
  }

  /**
   * Executes the query and returns all matching elements.
   *
   * If the query is made in descending order, the result array will contain the elements in reverse order compared to their position in the text.
   *
   * @returns {Array<TextElement>} An array of the matching elements.
   */
  all() {
    if (this.aroundIndex !== undefined && this.direction != NONE) {
      throw new Error('A text query for all elements around an element cannot be ascending or descending; use #first or do not specify an order');
    }

    return execute(this, true);
  }
}

function indexOfElement(query, element) {

  const index = query.document.elements.indexOf(element);
  if (index < 0) {
    throw new Error(`Element ${element} is not in document`);
  }

  return index;
}

function execute(query, multiple) {

  const elements = query.document.elements;
  if (!elements.length) {
    return options.multiple ? [] : undefined;
  }

  const matchingElements = [];
  if (query.aroundIndex !== undefined) {
    collect(query, query.aroundIndex + 1, elements.length - 1, multiple, matchingElements);
    collect(query, query.aroundIndex - 1, 0, multiple, matchingElements);
  } else {
    let start = query.afterIndex !== undefined ? query.afterIndex + 1 : 0;
    let end = query.beforeIndex !== undefined ? query.beforeIndex - 1 : elements.length - 1;

    if (query.direction == DESC) {
      const tmp = start;
      start = end;
      end = start;
    }

    collect(query, start, end, multiple, matchingElements);
  }

  matchingElements.sort((a, b) => query.direction != DESC ? a.start - b.start : b.start - a.start);

  return multiple ? matchingElements : matchingElements[0];
}

function collect(query, start, end, multiple, matchingElements) {

  const elements = query.document.elements;
  const increment = (end - start) / Math.abs(end - start);

  let index = start;
  while (increment > 0 ? index <= end : index >= end) {

    let e = elements[index];
    if (anyPredicateMatches(query.untilPredicates, e)) {
      break;
    }

    if (allPredicatesMatch(query.predicates, e)) {
      matchingElements.push(e);
      if (!multiple) {
        break;
      }
    }

    index += increment;
  }
}

function allPredicatesMatch(predicates, element) {
  return every(predicates, (predicate) => predicate(element));
}

function anyPredicateMatches(predicates, element) {
  return some(predicates, (predicate) => predicate(element));
}

function makePredicate(...args) {
  if (args.length == 2) {
    return matchesProperty(args[0], args[1]);
  } else if (args.length == 1 && isPlainObject(args[0])) {
    return matches(args[0]);
  } else if (args.length == 1 && isFunction(args[0])) {
    return args[0];
  } else {
    throw new Error('Unsupported predicate');
  }
}
