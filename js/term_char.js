'use strict';

const TERM_CHAR_DEFAULT_FG = 7;
const TERM_CHAR_DEFAULT_BG = 0;

class TermChar {
  constructor(ch) {
    this.ch = ch;
    this.resetAttr();
    this.needUpdate = false;
    this.isLeadByte = false;
    this.isStartOfURL = false;
    this.isEndOfURL = false;
    this.isPartOfURL = false;
    this.isPartOfKeyWord = false;
    this.isUnderLine = false;
    this.keyWordColor = '#ff0000';
    this.fullurl = '';
    this.html = '';
  }

  copyFrom(attr) {
    this.ch = attr.ch;
    this.isLeadByte = attr.isLeadByte;
    this.copyAttr(attr);
  }

  copyAttr(attr) {
    this.fg = attr.fg;
    this.bg = attr.bg;
    this.bright = attr.bright;
    this.invert = attr.invert;
    this.blink = attr.blink;
    this.underLine = attr.underLine;
  }

  resetAttr() {
    this.fg = 7;
    this.bg = 0;
    this.bright = false;
    this.invert = false;
    this.blink = false;
    this.underLine = false;
  }
  
  getFg() {
    if (this.invert)
      return this.bright ? (this.bg + 8) : this.bg;
    return this.bright ? (this.fg + 8) : this.fg;
  }

  getBg() {
    return this.invert ? this.fg : this.bg;
  }

}
