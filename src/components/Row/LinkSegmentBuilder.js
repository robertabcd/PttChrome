import cx from "classnames";
import HyperLink from "./HyperLink";
import ColorSegmentBuilder from "./ColorSegmentBuilder";
import ImagePreviewer, { of, makeSrcResolver } from "../ImagePreviewer";

export class LinkSegmentBuilder {
  constructor(
    row,
    enableLinkInlinePreview,
    forceWidth,
    highlighted,
    onHyperLinkMouseOver,
    onHyperLinkMouseOut
  ) {
    this.row = row;
    this.forceWidth = forceWidth;
    this.highlighted = highlighted;
    this.onHyperLinkMouseOver = onHyperLinkMouseOver;
    this.onHyperLinkMouseOut = onHyperLinkMouseOut;
    //
    this.segs = [];
    this.inlineLinkPreviews = enableLinkInlinePreview ? [] : false;
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
          onMouseOver={this.onHyperLinkMouseOver}
          onMouseOut={this.onHyperLinkMouseOut}
        />
      );
      // TODO: Modularize this.
      if (this.inlineLinkPreviews) {
        this.inlineLinkPreviews.push(
          <ImagePreviewer
            key={`${this.col}-${this.href}`}
            request={of(this.href).then(makeSrcResolver)}
            render={ImagePreviewer.renderInline}
          />
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
          className={cx({ b2: this.highlighted })}
          data-type="bbsline"
          data-row={this.row}
        >
          {this.segs}
        </span>
        <div>{this.inlineLinkPreviews}</div>
      </div>
    );
  }
}

LinkSegmentBuilder.accumulator = (builder, ch, i) => {
  builder.readChar(ch, i);
  return builder;
};

export default LinkSegmentBuilder;
