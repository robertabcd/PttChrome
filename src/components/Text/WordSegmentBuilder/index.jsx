import ForceWidthWord from "./ForceWidthWord";
import TwoColorWord from "./TwoColorWord";
import ColorSpan from "./ColorSpan";

export class WordSegmentBuilder {
  constructor(key, colorState) {
    this.key = key;
    this.colorState = colorState;
    this.inner = [];
  }

  isLastSegmentSameColor(color) {
    return this.colorState.equals(color);
  }

  appendNormalText(text) {
    const last = this.inner[this.inner.length - 1];
    if (typeof last === "string") {
      this.inner[this.inner.length - 1] = last + text;
    } else {
      this.inner.push(text);
    }
  }

  appendForceWidthWord(text, forceWidth) {
    this.inner.push(
      <ForceWidthWord
        key={this.inner.length}
        inner={text}
        forceWidth={forceWidth}
      />
    );
  }

  appendTwoColorWord(text, colorLead, colorTail, forceWidth) {
    this.inner.push(
      <TwoColorWord
        key={this.inner.length}
        text={text}
        colorLead={colorLead}
        colorTail={colorTail}
        forceWidth={forceWidth}
      />
    );
  }

  build() {
    return (
      <ColorSpan
        key={this.key}
        colorState={this.colorState}
        inner={this.inner}
      />
    );
  }
}

WordSegmentBuilder.NullObject = {
  isLastSegmentSameColor() {
    return false;
  },

  build() {
    return false;
  }
};

export default WordSegmentBuilder;
