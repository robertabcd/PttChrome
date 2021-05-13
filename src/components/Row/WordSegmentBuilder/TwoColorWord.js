import cx from "classnames";
import { forceWidthStyle } from "./ForceWidthWord";

/**
 * TwoColorWord implements the two-color-word effect,
 * where the first half ("head") and the last half ("tail")
 * of a fullwidth character ("word") have different colors.
 *
 * The two-color-word effect is achieved by adding a half-word overlay to a word,
 * so that the overlaid half of the word has the color of the overlay.
 *
 * If both the head and the tail have the same foreground color and blinking effect,
 * the half-word overlay is not needed.
 *
 * The blinking effect is achieved by the following cases:
 * - Only the tail blinks: Overlay the head and blink only the underneath word
 * - Only the head blinks: Overlay the tail and blink only the underneath word
 * - Both blink: Overlay the head and blink both the underneath word and the overlay
 */
export const TwoColorWord = ({ colorLead, colorTail, forceWidth, text }) => (
  <span
    className={cx({
      // classes for foreground
      ...(colorLead.fg === colorTail.fg
        ? {
            // for one-color-word (including blinking differences)
            [`q${colorLead.fg}`]: true,
            [`w${colorTail.fg}`]: colorLead.blink !== colorTail.blink
          }
        : {
            // for two-color-word with only the head blinks
            [`q${colorLead.fg}`]: colorLead.blink && !colorTail.blink,
            [`w${colorTail.fg}`]: colorLead.blink && !colorTail.blink,
            // for two-color-word in other cases
            [`w${colorLead.fg}`]: !colorLead.blink || colorTail.blink,
            [`q${colorTail.fg}`]: !colorLead.blink || colorTail.blink
          }),
      // classes for the half-word overlay
      o: colorLead.fg !== colorTail.fg || colorLead.blink !== colorTail.blink,
      ot: colorLead.blink && !colorTail.blink, // overlay the tail instead
      // classes for background
      [`b${colorLead.bg}`]: colorLead.bg === colorTail.bg,
      [`b${colorLead.bg}b${colorTail.bg}`]: colorLead.bg !== colorTail.bg,
      // other classes
      qq: colorLead.blink || colorTail.blink, // blink the underneath word
      ww: colorLead.blink && colorTail.blink, // blink the half-word overlay
      wpadding: forceWidth
    })}
    style={forceWidthStyle(forceWidth)}
    data-text={text}
  >
    {text}
  </span>
);

export default TwoColorWord;
