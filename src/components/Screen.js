import { createSelector, createStructuredSelector } from "reselect";
import Row from "./Row";
import ImagePreviewer, {
  of,
  resolveSrcToImageUrl,
  resolveWithImageDOM,
} from "./ImagePreviewer";
import { CallbagConsumer } from "./Callbag";

export class Screen extends React.Component {
  state = {
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
      <div className="View__Container" onMouseMove={this.handleMouseMove}>
        {this.props.lines.map((chars, row) => (
          <Row
            key={row}
            chars={chars}
            row={row}
            forceWidth={this.props.forceWidth}
            enableLinkInlinePreview={this.props.enableLinkInlinePreview}
            highlighted={this.props.highlightedIndex === row}
            highlightedClassName={this.props.highlightedClassName}
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

const children = createSelector(
  createStructuredSelector({
    highlightedIndex: ({ state }) => state.screen.highlightedIndex,
    highlightedClassName: ({ state }) =>
      `b${state.settings.mouseBrowsingHighlightColor}`,
    lines: ({ state }) => state.screen.lines,
    forceWidth: ({ state }) => state.screen.chh,
    enableLinkHoverPreview: ({ state }) => state.settings.enablePicPreview,
  }),
  props => <Screen {...props} enableLinkInlinePreview={false} />
);

export const constElement = <CallbagConsumer>{children}</CallbagConsumer>;
