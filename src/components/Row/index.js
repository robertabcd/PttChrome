import LinkSegmentBuilder from "./LinkSegmentBuilder";

export const Row = ({
  chars,
  row,
  enableLinkInlinePreview,
  forceWidth,
  highlighted,
  onHyperLinkMouseOver,
  onHyperLinkMouseOut
}) => (
  <span type="bbsrow" srow={row}>
    {chars
      .reduce(
        LinkSegmentBuilder.accumulator,
        new LinkSegmentBuilder(
          row,
          enableLinkInlinePreview,
          forceWidth,
          highlighted,
          onHyperLinkMouseOver,
          onHyperLinkMouseOut
        )
      )
      .build()}
  </span>
);

export default Row;
