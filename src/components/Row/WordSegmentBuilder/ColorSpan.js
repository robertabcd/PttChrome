import cx from "classnames";

export const ColorSpan = ({ colorState, inner }) => (
  <span
    className={cx(`q${colorState.fg}`, `b${colorState.bg}`, {
      [`qq${colorState.bg}`]: colorState.blink
    })}
  >
    {inner}
  </span>
);

export default ColorSpan;
