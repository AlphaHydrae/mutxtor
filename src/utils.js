import { pick } from 'lodash';

/**
 * @access private
 */
export function stringify(object, ...properties) {
  return object.constructor.name + '{' + JSON.stringify(pick(object, properties)) + '}';
}
