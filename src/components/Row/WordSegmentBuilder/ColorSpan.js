import cx from "classnames";

export const ColorSpan = ({ colorState, inner }) => (
  <span className={cx(`q${colorState.fg}`, `b${colorState.bg}`)}>
    {colorState.blink && ( // FIXME: tagName??, attrName??
      <x
        s={cx(`q${colorState.fg}`, `b${colorState.bg}`)}
        h={`qq${colorState.bg}`}
      />
    )}
    {inner}
  </span>
);

export default ColorSpan;
