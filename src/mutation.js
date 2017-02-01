export default class TextMutation {

  constructor(element) {
    this.element = element;
  }

  get range() {
    return undefined;
  }

  get delta() {
    return 0;
  }

  apply(text) {
    return text;
  }

}
