import Row from "./Row";

export class Screen extends React.Component {
  setCurrentHighlighted = currentHighlighted => {
    this.setState({ currentHighlighted });
  };

  state = { currentHighlighted: undefined };

  render() {
    return (
      <div id="mainContainer">
        {this.props.lines.map((chars, row) => (
          <Row
            key={row}
            chars={chars}
            row={row}
            forceWidth={this.props.forceWidth}
            showsLinkPreviews={this.props.showsLinkPreviews}
            highlighted={this.state.currentHighlighted === row}
          />
        ))}
      </div>
    );
  }
}

export default Screen;
