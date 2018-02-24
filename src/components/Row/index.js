import LinkSegmentBuilder from "./LinkSegmentBuilder";

export const Row = ({
  chars,
  row,
  enableLinkInlinePreview,
  forceWidth,
  highlighted,
  highlightedClassName,
  onHyperLinkMouseOver,
  onHyperLinkMouseOut,
}) => (
  <div className="View__Main__Row">
    {chars
      .reduce(
        LinkSegmentBuilder.accumulator,
        new LinkSegmentBuilder(
          row,
          enableLinkInlinePreview,
          forceWidth,
          highlighted,
          highlightedClassName,
          onHyperLinkMouseOver,
          onHyperLinkMouseOut
        )
      )
      .build()}
  </div>
);

export default Row;
