import { constant, every, isFunction, isObject, matches, matchesProperty, some } from 'lodash';

export default class TextQuery {

  constructor(document) {
    this.document = document;
    this.predicates = [];
    this.untilPredicates = [];
    this.ascending = true;
  }

  where(...args) {
    this.predicates.push(makePredicate(...args));
    return this;
  }

  until(...args) {
    this.untilPredicates.push(makePredicate(...args));
    return this;
  }

  after(element) {

    const index = this.document.elements.indexOf(element);
    if (index < 0) {
      throw new Error(`Element ${element} is not in document`);
    }

    this.afterIndex = index;
    return this;
  }

  before(element) {

    const index = this.document.elements.indexOf(element);
    if (index < 0) {
      throw new Error(`Element ${element} is not in document`);
    }

    this.beforeIndex = index;
    return this;
  }

  first() {
    this.ascending = true;
    return this;
  }

  last() {
    this.ascending = false;
    return this;
  }

  find() {
    return execute(this, false);
  }

  findAll() {
    return execute(this, true);
  }
}

function execute(query, multiple) {

  const elements = query.document.elements;
  if (!elements.length) {
    return options.multiple ? [] : undefined;
  }

  let index = query.afterIndex !== undefined ? query.afterIndex : 0;
  let increment = 1;
  let endIndex = query.beforeIndex !== undefined ? query.beforeIndex - 1 : elements.length - 1;

  if (!query.ascending) {
    index = endIndex;
    endIndex = 0;
    increment = -1;
  }

  console.log('##########');
  const matchingElements = [];
  while (increment == 1 ? index <= endIndex : index >= endIndex) {

    let e = elements[index];
    console.log(e.toString());
    if (anyPredicateMatches(query.untilPredicates, e)) {
      console.log('until matches');
      break;
    }

    if (allPredicatesMatch(query.predicates, e)) {
      console.log('where matches');
      if (multiple) {
        matchingElements.push(e);
      } else {
        return e;
      }
    }

    index += increment;
  }

  return multiple ? matchingElements : undefined;
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
  } else if (args.length == 1 && isObject(args[0])) {
    return matches(args[0]);
  } else if (args.length == 1 && isFunction(args[0])) {
    return args[0];
  } else {
    throw new Error('Unsupported predicate');
  }
}
