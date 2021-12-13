import cx from "classnames";

export const ColorSpan = ({ className, colorState, inner }) => (
  <span
    className={cx(className, `q${colorState.fg}`, `b${colorState.bg}`, {
      qq: colorState.blink
    })}
  >
    {inner}
  </span>
);

export default ColorSpan;
