import cx from "classnames";
import { HyperLinkPreview } from "../../js/image_preview";
import HyperLink from "./HyperLink";
import ColorSegmentBuilder from "./ColorSegmentBuilder";

export class LinkSegmentBuilder {
  constructor(row, showsLinkPreviews, forceWidth, highlighted) {
    this.row = row;
    this.forceWidth = forceWidth;
    this.highlighted = highlighted;
    //
    this.segs = [];
    this.linkPreviews = showsLinkPreviews ? [] : false;
    //
    this.colorSegBuilder = null;
    this.col = null;
    this.href = null;
  }

  saveSegment() {
    const element = this.colorSegBuilder.build();
    if (this.href) {
      this.segs.push(
        <HyperLink
          key={this.col}
          href={this.href}
          inner={element}
          data-scol={this.col}
          data-srow={this.row}
        />
      );
      // TODO: Modularize this.
      if (this.linkPreviews) {
        this.linkPreviews.push(
          <HyperLinkPreview key={this.col} src={this.href} />
        );
      }
    } else {
      this.segs.push(element);
    }
  }

  readChar(ch, i) {
    if (this.colorSegBuilder === null || ch.isStartOfURL()) {
      this.colorSegBuilder = new ColorSegmentBuilder(this.forceWidth);
      this.col = i;
      this.href = ch.isStartOfURL() ? ch.getFullURL() : null;
    }
    this.colorSegBuilder.readChar(ch);
    if (ch.isEndOfURL()) {
      this.saveSegment();
      this.colorSegBuilder = null;
    }
  }

  build() {
    if (this.colorSegBuilder !== null) {
      this.saveSegment();
    }
    // TODO: Detect userid and apply class "blu_$userid".
    return (
      <div>
        <span
          key="line"
          className={cx({ b2: this.highlighted })}
          data-type="bbsline"
          data-row={this.row}
        >
          {this.segs}
        </span>
        <div key="previews">{this.linkPreviews}</div>
      </div>
    );
  }
}

LinkSegmentBuilder.accumulator = (builder, ch, i) => {
  builder.readChar(ch, i);
  return builder;
};

export default LinkSegmentBuilder;
