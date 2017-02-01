import TextMutation from './mutation';

export default class SpliceTextMutation extends TextMutation {

  constructor(element, index, removeCount, textToAdd) {
    super(element);
    this.index = index;
    this.removeCount = removeCount;
    this.textToAdd = textToAdd;
  }

  get range() {
    return {
      start: this.index,
      end: this.index + (this.removeCount || 0)
    };
  }

  get delta() {
    return (this.removeCount ? -this.removeCount : 0) + (this.textToAdd ? this.textToAdd.length : 0);
  }

  apply(text) {
    if (this.removeCount) {
      text = text.slice(0, this.index) + text.slice(this.index + this.removeCount);
    }

    if (this.textToAdd) {
      text = text.slice(0, this.index) + this.textToAdd + text.slice(this.index);
    }

    return text;
  }

}
