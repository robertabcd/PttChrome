import Row from "./Row";
import ImagePreviewer, {
  of,
  resolveSrcToImageUrl,
  resolveWithImageDOM,
} from "./ImagePreviewer";

export class Screen extends React.Component {
  setCurrentHighlighted = currentHighlighted => {
    this.setState({ currentHighlighted });
  };

  state = {
    currentHighlighted: undefined,
    currentImagePreview: undefined,
    left: undefined,
    top: undefined,
  };

  componentWillReceiveProps(nextProps) {
    if (this.props.lines !== nextProps.lines) {
      this.setState({ currentImagePreview: undefined });
    }
  }

  handleMouseMove = ({ clientX, clientY }) => {
    if (this.state.currentImagePreview) {
      this.setState({
        left: clientX,
        top: clientY,
      });
    }
  };

  handleHyperLinkMouseOver = ({ currentTarget: { href } }) => {
    if (this.props.enableLinkHoverPreview) {
      this.setState({
        currentImagePreview: of(href)
          .then(resolveSrcToImageUrl)
          .then(resolveWithImageDOM),
      });
    }
  };

  handleHyperLinkMouseOut = () => {
    this.setState({ currentImagePreview: undefined });
  };

  render() {
    return (
      <div id="mainContainer" onMouseMove={this.handleMouseMove}>
        {this.props.lines.map((chars, row) => (
          <Row
            key={row}
            chars={chars}
            row={row}
            forceWidth={this.props.forceWidth}
            enableLinkInlinePreview={this.props.enableLinkInlinePreview}
            highlighted={this.state.currentHighlighted === row}
            onHyperLinkMouseOver={this.handleHyperLinkMouseOver}
            onHyperLinkMouseOut={this.handleHyperLinkMouseOut}
          />
        ))}
        {this.state.currentImagePreview && (
          <ImagePreviewer
            request={this.state.currentImagePreview}
            component={ImagePreviewer.OnHover}
            left={this.state.left}
            top={this.state.top}
          />
        )}
      </div>
    );
  }
}

export default Screen;
