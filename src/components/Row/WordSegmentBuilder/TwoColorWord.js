import cx from "classnames";
import { forceWidthStyle } from "./ForceWidthWord";

/**
 * TwoColorWord implements the two-color-word effect,
 * where the first half ("head") and the last half ("tail")
 * of a fullwidth character ("word") have different colors.
 *
 * The two-color-word effect is achieved
 * by using two half-word pseudo elements (enabled by CSS class .o),
 * one for the left half (::before; controlled by non-prefixed CSS classes)
 * and one for the right half (::after; controlled by CSS classes prefixed with 'r'),
 * so that the two halves of the word can be controlled independently.
 *
 * Additionally, to make the text selection appear normal,
 * the real element is made invisible and placed on top of the pseudo elements.
 */
export const TwoColorWord = ({ colorLead, colorTail, forceWidth, text }) => (
  <span
    className={cx(
      "o",
      `q${colorLead.fg}`,
      `rq${colorTail.fg}`,
      `b${colorLead.bg}`,
      `rb${colorTail.bg}`,
      {
        qq: colorLead.blink,
        rqq: colorTail.blink,
        wpadding: forceWidth
      }
    )}
    style={forceWidthStyle(forceWidth)}
    data-text={text}
  >
    {text}
  </span>
);

export default TwoColorWord;
