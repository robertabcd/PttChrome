import Row from '../components/Row';

export class ColorState {
  constructor(fg, bg, blink) {
    this.fg = fg;
    this.bg = bg;
    this.blink = blink;
  }

  equals(oth) {
    if (oth instanceof ColorState) {
      return this.fg == oth.fg && this.bg == oth.bg && this.blink == oth.blink;
    }
    return false;
  }
}

export function renderRowHtml(chars, row, forceWidth, showsLinkPreviews, cont) {
  return ReactDOM.render(
    <Row chars={chars} row={row} forceWidth={forceWidth}
      showsLinkPreviews={showsLinkPreviews} />, cont);
}
