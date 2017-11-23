import { symbolTable } from './symbol_table';
import { HyperLinkPreview } from './image_preview';
import { b2u } from './string_util';
import HyperLink from '../components/HyperLink';
import ColorSpan from '../components/ColorSpan';
import NormalText from '../components/NormalText';
import ForceWidthWord from '../components/ForceWidthWord';
import TwoColorWord from '../components/TwoColorWord';

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

class ColorSegmentBuilder {
  constructor(currCol) {
    this.segs = [];
    this.curr = null;
    this.currCol = currCol;
  }

  _isLastSegmentSameColor(color) {
    return this.curr && this.curr.colorState.equals(color);
  }

  _addSegment(color) {
    this.curr = {
      col: this.currCol,
      colorState: color,
      texts: []
    };
    this.segs.push(this.curr);
  }

  _append(type, text, color) {
    if (!this._isLastSegmentSameColor(color))
      this._addSegment(color);
    this.curr.texts.push({
      col: this.currCol,
      type: type,
      text: text
    });
  }

  _reuseChars(type, color) {
    if (!this._isLastSegmentSameColor(color))
      return null;
    let len = this.curr.texts.length;
    if (len == 0)
      return null;
    let last = this.curr.texts[len - 1];
    return last.type == type ? last : null;
  }

  _appendNormalText(width, text, color) {
    let reuse = this._reuseChars('normalText', color);
    if (reuse)
      reuse.text += text;
    else
      this._append('normalText', text, color);
    this.currCol += width;
  }

  appendNormalChar(text, color) {
    this._appendNormalText(1, text, color);
  }

  appendNormalWord(text, color, forceWidth) {
    if (forceWidth) {
      this._append('forceWidthWord', text, color);
      this.currCol += 2;
    } else {
      this._appendNormalText(2, text, color);
    }
  }

  appendTwoColorWord(text, color, color2) {
    this._addSegment(color);
    this.curr.texts.push({
      col: this.currCol,
      type: 'twoColorWord',
      text: text,
      color: color,
      color2: color2
    });
    this.currCol += 2;
    this.curr = null;
  }

  build() {
    return this.segs;
  }
}

class Row extends React.Component {
  constructor() {
    super();
    this.state = {highlighted: false};
  }

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

  _segmentTwoColorDBCS(colOffset, chars) {
    let builder = new ColorSegmentBuilder(colOffset);
    let lead = null;
    for (let ch of chars) {
      if (ch.isLeadByte) {
        lead = ch;
        continue;
      }
      if (lead) {
        let u = b2u(lead.ch + ch.ch);
        if (u.length == 1) {
          if (this._isBadDBCS(u)) {
            builder.appendNormalChar('?', lead.getColor());
            builder.appendNormalChar('?', ch.getColor());
          } else if (lead.getColor().equals(ch.getColor())) {
            builder.appendNormalWord(u, lead.getColor(),
              this._shouldForceWidth(u) ? this.props.forceWidth : 0);
          } else {
            builder.appendTwoColorWord(u, lead.getColor(), ch.getColor());
          }
        } else {
          // Conversion error.
          builder.appendNormalChar('?', lead.getColor());
          builder.appendNormalChar(ch.ch == '\x20' ? ' ' : '?', ch.getColor());
        }
        lead = null
      } else {
        builder.appendNormalChar(ch.ch, ch.getColor());
      }
    }
    return builder.build();
  }

  render() {
    let colOffset = 0;
    let cols = [];
    let linkPreviews = [];
    for (let linkSeg of this._segmentHyperLinks(this.props.chars)) {
      let inner = [];
      for (let colorSeg of this._segmentTwoColorDBCS(colOffset, linkSeg.chars)) {
        let texts = [];
        for (let ch of colorSeg.texts) {
          let key = 'text-c-' + ch.col;
          let forceWidth = this.props.forceWidth ? this.props.forceWidth : 0;
          switch (ch.type) {
            case 'normalText':
              texts.push(<NormalText key={key} text={ch.text} />);
              break;
            case 'forceWidthWord':
              texts.push(<ForceWidthWord key={key} inner={ch.text}
                forceWidth={forceWidth} />);
              break;
            case 'twoColorWord':
              texts.push(<TwoColorWord key={key} text={ch.text}
                colorLead={ch.color} colorTail={ch.color2}
                forceWidth={forceWidth} />);
              break;
          }
        }
        let key = 'colorSpan-c-' + colorSeg.col;
        inner.push(<ColorSpan key={key} colorState={colorSeg.colorState}
          inner={texts} />);
      }
      if (linkSeg.href) {
        let key = 'hyperLink-c-' + linkSeg.col;
        cols.push(<HyperLink key={key} href={linkSeg.href} inner={inner}
          data-scol={linkSeg.col} data-srow={this.props.row} />);
        // TODO: Modularize this.
        if (this.props.showsLinkPreviews) {
          linkPreviews.push(
            <HyperLinkPreview key={key} src={linkSeg.href} />);
        }
      } else {
        cols = cols.concat(inner);
      }
      colOffset += linkSeg.chars.length;
    }
    let classes = [];
    if (this.state.highlighted) {
      classes.push('b2');
    }
    // TODO: Detect userid and apply class "blu_$userid".
    return (
      <div>
        <span key="line" className={classes.join(' ')}
            data-type="bbsline"
            data-row={this.props.row}>{cols}</span>
        <div key="previews">{linkPreviews}</div>
      </div>
    );
  }

  setHighlight(shouldHighlight) {
    if (this.state.highlighted != shouldHighlight) {
      this.setState({highlighted: shouldHighlight});
    }
  }

  _isBadDBCS(u) {
    return symbolTable['x' + u.charCodeAt(0).toString(16)] == 3;
  }

  _shouldForceWidth(u) {
    let code = symbolTable['x' + u.charCodeAt(0).toString(16)];
    return code == 1 || code == 2;
  }
}

export function renderRowHtml(chars, row, forceWidth, showsLinkPreviews, cont) {
  return ReactDOM.render(
    <Row chars={chars} row={row} forceWidth={forceWidth}
      showsLinkPreviews={showsLinkPreviews} />, cont);
}
