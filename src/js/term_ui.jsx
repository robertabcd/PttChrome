import { HyperLinkPreview } from './image_preview';
import HyperLink from '../components/HyperLink';
import Text from '../components/Text';

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


  render() {
    let cols = [];
    let linkPreviews = [];
    for (let linkSeg of this._segmentHyperLinks(this.props.chars)) {
      let inner = [
        <Text
          key={`text-${cols.length}`}
          chars={linkSeg.chars}
          forceWidth={this.props.forceWidth}
        />
      ]

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
}

export function renderRowHtml(chars, row, forceWidth, showsLinkPreviews, cont) {
  return ReactDOM.render(
    <Row chars={chars} row={row} forceWidth={forceWidth}
      showsLinkPreviews={showsLinkPreviews} />, cont);
}
