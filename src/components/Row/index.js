import LinkSegmentBuilder from "./LinkSegmentBuilder";

export const Row = ({
  chars,
  row,
  showsLinkPreviews,
  forceWidth,
  highlighted
}) => (
  <span type="bbsrow" srow={row}>
    {chars
      .reduce(
        LinkSegmentBuilder.accumulator,
        new LinkSegmentBuilder(row, showsLinkPreviews, forceWidth, highlighted)
      )
      .build()}
  </span>
);

export default Row;
