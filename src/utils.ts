import { pick } from 'lodash';

/**
 * @internal
 */
export function stringify(object: object, ...properties: string[]) {
  return object.constructor.name + '{' + JSON.stringify(pick(object, properties)) + '}';
}
