import cx from "classnames";
import { forceWidthStyle } from "./ForceWidthWord";

/**
 * TODO: add blinking.
 */
export const TwoColorWord = ({ colorLead, colorTail, forceWidth, text }) => (
  <span
    className={cx({
      [`q${colorLead.fg}`]: colorLead.fg === colorTail.fg,
      [`w${colorLead.fg}`]: colorLead.fg !== colorTail.fg,
      [`q${colorTail.fg}`]: colorLead.fg !== colorTail.fg,
      o: colorLead.fg !== colorTail.fg,
      [`b${colorLead.bg}`]: colorLead.bg === colorTail.bg,
      [`b${colorLead.bg}b${colorTail.bg}`]: colorLead.bg !== colorTail.bg,
      wpadding: forceWidth
    })}
    style={forceWidthStyle(forceWidth)}
    data-text={text}
  >
    {text}
  </span>
);

export default TwoColorWord;
