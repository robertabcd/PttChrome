import cx from "classnames";
import ColorSegmentBuilder from "./ColorSegmentBuilder";

export const Text = ({ chars, forceWidth }) =>
  chars
    .reduce(
      ColorSegmentBuilder.accumulator,
      new ColorSegmentBuilder(forceWidth)
    )
    .build();

export default Text;
