import { WordSegmentBuilder, TwoColorWordBuilder } from "./WordSegmentBuilder";
import { b2u, isDBCSLead } from "../../js/string_util";
import { symbolTable } from "../../js/symbol_table";

function isBadDBCS(u) {
  return symbolTable["x" + u.charCodeAt(0).toString(16)] == 3;
}

function shouldForceWidth(u) {
  const code = symbolTable["x" + u.charCodeAt(0).toString(16)];
  return code == 1 || code == 2;
}

export class ColorSegmentBuilder {
  constructor(forceWidth) {
    this.segs = [];
    this.wordBuilder = WordSegmentBuilder.NullObject;
    this.forceWidth = forceWidth;
    this.lead = null;
  }

  beginSegment(color) {
    this.segs.push(this.wordBuilder.build());
    this.wordBuilder = new WordSegmentBuilder(this.segs.length, color);
  }

  appendNormalChar(text, color) {
    if (!this.wordBuilder.isLastSegmentSameColor(color))
      this.beginSegment(color);
    this.wordBuilder.appendNormalText(text);
  }

  readChar(ch) {
    if (!this.lead) {
      if (isDBCSLead(ch.ch)) {
        this.lead = ch;
        return;
      }

      this.appendNormalChar(ch.ch, ch.getColor());
      return;
    }
    const { lead } = this;
    const leadColor = lead.getColor();
    this.lead = null;
    const text = b2u(lead.ch + ch.ch);
    if (text.length !== 1) {
      // Conversion error.
      this.appendNormalChar("?", leadColor);
      this.appendNormalChar(ch.ch == "\x20" ? " " : "?", ch.getColor());
      return;
    }
    if (isBadDBCS(text)) {
      this.appendNormalChar("?", leadColor);
      this.appendNormalChar("?", ch.getColor());
      return;
    }
    if (!leadColor.equals(ch.getColor())) {
      this.segs.push(this.wordBuilder.build());
      this.wordBuilder = new TwoColorWordBuilder(
        this.segs.length,
        leadColor,
        ch.getColor(),
        this.forceWidth
      );
      this.wordBuilder.appendNormalText(text);
      return;
    }
    const forceWidth = shouldForceWidth(text) ? this.forceWidth : 0;
    if (!forceWidth) {
      this.appendNormalChar(text, leadColor);
      return;
    }
    if (!this.wordBuilder.isLastSegmentSameColor(leadColor))
      this.beginSegment(leadColor);
    this.wordBuilder.appendForceWidthWord(text, forceWidth);
  }

  build() {
    this.beginSegment();
    return this.segs;
  }
}

ColorSegmentBuilder.accumulator = (builder, ch) => {
  builder.readChar(ch);
  return builder;
};

export default ColorSegmentBuilder;
