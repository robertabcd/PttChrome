import { symbolTable } from './symbol_table';
import { HyperLinkPreview } from './image_preview';
import { b2u } from './string_util';
import HyperLink from '../components/HyperLink';
import ColorSpan from '../components/ColorSpan';
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
  constructor(currCol, forceWidth) {
    this.segs = [];
    this.props = null;
    this.currCol = currCol;
    this.forceWidth = forceWidth;
  }

  _isLastSegmentSameColor(color) {
    return this.props && this.props.colorState.equals(color);
  }

  _beginSegment(color) {
    if (this.props) {
      this.segs.push(
        <ColorSpan {...this.props} />
      )
    }
    this.props = {
      key: `colorSpan-c-${this.currCol}`,
      colorState: color,
      inner: []
    }
  }

  _appendNormalText(width, text, color) {
    if (!this._isLastSegmentSameColor(color))
      this._beginSegment(color);

    this.props.inner.push(
      text
    );
    this.currCol += width;
  }

  appendNormalChar(text, color) {
    this._appendNormalText(1, text, color);
  }

  appendNormalWord(text, color, forceWidth) {
    if (forceWidth) {
      if (!this._isLastSegmentSameColor(color))
        this._beginSegment(color);
      this.props.inner.push(
        <ForceWidthWord key={`text-c-${this.currCol}`} inner={text}
        forceWidth={this.forceWidth} />
      );

      this.currCol += 2;
    } else {
      this._appendNormalText(2, text, color);
    }
  }

  appendTwoColorWord(text, color, color2) {
    this._beginSegment(color);
    this.props.inner.push(
      <TwoColorWord key={`text-c-${this.currCol}`} text={text}
      colorLead={color} colorTail={color2}
      forceWidth={this.forceWidth} />
    );
    this.currCol += 2;
  }

  build() {
    this._beginSegment()
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
    let builder = new ColorSegmentBuilder(colOffset, this.props.forceWidth);
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
      let inner = this._segmentTwoColorDBCS(colOffset, linkSeg.chars)

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
