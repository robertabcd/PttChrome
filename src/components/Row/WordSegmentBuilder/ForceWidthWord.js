/**
 * FIXME: css solution??
 */
export const forceWidthStyle = forceWidth =>
  forceWidth
    ? {
        display: "inline-block",
        width: forceWidth,
      }
    : undefined;

export const ForceWidthWord = ({ forceWidth, inner }) => (
  <span style={forceWidthStyle(forceWidth)}>{inner}</span>
);

export default ForceWidthWord;
