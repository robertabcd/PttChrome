import LinkSegmentBuilder from "./LinkSegmentBuilder";

export class Row extends React.Component {
  constructor() {
    super();
    this.state = { highlighted: false };
  }

  render() {
    return this.props.chars
      .reduce(
        LinkSegmentBuilder.accumulator,
        new LinkSegmentBuilder(
          this.props.row,
          this.props.showsLinkPreviews,
          this.props.forceWidth,
          this.state.highlighted
        )
      )
      .build();
  }

  setHighlight(shouldHighlight) {
    if (this.state.highlighted != shouldHighlight) {
      this.setState({ highlighted: shouldHighlight });
    }
  }
}

export default Row;
