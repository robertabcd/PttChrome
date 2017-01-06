'use strict';

class HyperLink extends React.Component {
  render() {
    return <a scol={this.props.col} srow={this.props.row}
        className="y" href={this.props.href} rel="noreferrer" target="_blank">
        {this.props.inner}
        </a>;
  }
}

class ColorSpan extends React.Component {
  render() {
    let classes = [
      'q' + this.props.colorState.fg,
      'b' + this.props.colorState.bg
    ].join(' ');
    let blinkNode = '';
    if (this.props.colorState.blink) {
      blinkNode = <x s={classes} h={'qq' + this.props.colorState.bg}></x>;
    }
    return <span className={classes}>{blinkNode}{this.props.inner}</span>;
  }
}

class NormalText extends React.Component {
  render() {
    return <span>{this.props.text}</span>;
  }
}

class ForceWidthWord extends React.Component {
  render() {
    let styles = {
      display: 'inline-block'
    };
    if (this.props.forceWidth) {
      styles['width'] = this.props.forceWidth.toString() + 'px';
    }
    return <span className="wpadding" style={styles}>{this.props.inner}</span>;
  }
}

class TwoColorWord extends React.Component {
  render() {
    let c1 = this.props.colorLead, c2 = this.props.colorTail;
    let classes = [];
    if (c1.fg == c2.fg) {
      classes.push('q' + c1.fg);
    } else {
      classes.push('w' + c1.fg);
      classes.push('q' + c2.fg);
      classes.push('o');
    }
    if (c1.bg == c2.bg) {
      classes.push('b' + c1.bg);
    } else {
      classes.push('b' + c1.bg + 'b' + c2.bg);
    }
    // TODO: add blinking.
    let styles = {};
    if (this.props.forceWidth) {
      classes.push('wpadding');
      styles['display'] = 'inline-block';
      styles['width'] = this.props.forceWidth.toString() + 'px';
    }
    return <span className={classes.join(' ')} style={styles}
      data-text={this.props.text}>{this.props.text}</span>;
  }
}

class ColorState {
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

class ColorSegmentBuilder {
  constructor() {
    this.segs = [];
    this.curr = null;
  }

  _isLastSegmentSameColor(color) {
    return this.curr && this.curr.colorState.equals(color);
  }

  _addSegment(color) {
    this.curr = {
      colorState: color,
      chars: []
    };
    this.segs.push(this.curr);
  }

  _append(type, text, color) {
    if (!this._isLastSegmentSameColor(color))
      this._addSegment(color);
    this.curr.chars.push({
      type: type,
      text: text
    });
  }

  _reuseChars(type, color) {
    if (!this._isLastSegmentSameColor(color))
      return null;
    let len = this.curr.chars.length;
    if (len == 0)
      return null;
    let last = this.curr.chars[len - 1];
    return last.type == type ? last : null;
  }

  appendNormalText(text, color) {
    let reuse = this._reuseChars('normalText', color);
    if (reuse)
      reuse.text += text;
    else
      this._append('normalText', text, color);
  }

  appendForceWidthWord(text, color, forceWidth) {
    this._append('forceWidthWord', text, color);
  }

  appendTwoColorWord(text, color, color2) {
    this._addSegment(color);
    this.curr.chars.push({
      type: 'twoColorWord',
      text: text,
      color: color,
      color2: color2
    });
    this.curr = null;
  }

  build() {
    return this.segs;
  }
}

class Row extends React.Component {
  _segmentHyperLinks(chars) {
    let segments = [];
    let cur = null;
    for (let i = 0; i < chars.length; i++) {
      let ch = chars[i];
      if (!cur || ch.isStartOfURL()) {
        cur = {
          col: i,
          href: ch.isStartOfURL() ? ch.getFullURL() : null,
          chars: []
        };
        segments.push(cur);
      }
      cur.chars.push(ch);
      if (ch.isEndOfURL())
        cur = null;
    }
    return segments;
  }

  _segmentTwoColorDBCS(chars) {
    let builder = new ColorSegmentBuilder();
    let lead = null;
    for (let ch of chars) {
      if (ch.isLeadByte) {
        lead = ch;
        continue;
      }
      if (lead) {
        let u = (lead.ch + ch.ch).b2u();
        if (u.length == 1) {
          if (this._isBadDBCS(u)) {
            builder.appendNormalText('?', lead.getColor());
            builder.appendNormalText('?', ch.getColor());
          } else if (lead.getColor().equals(ch.getColor())) {
            builder.appendNormalText(u, lead.getColor());
          } else {
            builder.appendTwoColorWord(u, lead.getColor(), ch.getColor());
          }
        } else {
          // Conversion error.
          builder.appendNormalText('?', lead.getColor());
          builder.appendNormalText(ch.ch == '\x20' ? ' ' : '?', ch.getColor());
        }
        lead = null
      } else {
        builder.appendNormalText(ch.ch, ch.getColor());
      }
    }
    return builder.build();
  }

  render() {
    let cols = [];
    for (let linkSeg of this._segmentHyperLinks(this.props.chars)) {
      let inner = [];
      for (let colorSeg of this._segmentTwoColorDBCS(linkSeg.chars)) {
        let chars = [];
        for (let ch of colorSeg.chars) {
          let forceWidth = (this.props.forceWidth && this._shouldForceWidth) ?
            this.props.forceWidth : 0;
          switch (ch.type) {
            case 'normalText':
              chars.push(<NormalText text={ch.text} />);
              break;
            case 'forceWidthWord':
              chars.push(<ForceWidthWord inner={ch.text} forceWidth={forceWidth} />);
              break;
            case 'twoColorWord':
              chars.push(<TwoColorWord text={ch.text}
                colorLead={ch.color} colorTail={ch.color2} forceWidth={forceWidth} />);
              break;
          }
        }
        inner.push(<ColorSpan colorState={colorSeg.colorState}
          inner={chars} />);
      }
      if (linkSeg.href) {
        cols.push(<HyperLink scol={linkSeg.col} srow={this.props.row}
          href={linkSeg.href} inner={inner} />);
      } else {
        cols = cols.concat(inner);
      }
    }
    return <span>{cols}</span>;
  }

  _isBadDBCS(u) {
    return lib.symbolTable['x' + u.charCodeAt(0).toString(16)] == 3;
  }

  _shouldForceWidth(u) {
    let code = lib.symbolTable['x' + u.charCodeAt(0).toString(16)];
    return code == 1 || code == 2;
  }
}

function renderRowHtml(chars, row, forceWidth, cont) {
  ReactDOM.render(<Row chars={chars} row={row} forceWidth={forceWidth} />, cont);
}

$(document).ready(startApp);
