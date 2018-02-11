import {
  pipe,
  fromEvent,
  fromPromise,
  filter,
  interval,
  map,
  merge,
  scan,
  forEach,
} from "callbag-basics";
import makeSubject from "callbag-subject";
import {
  WINDOW_BEFOREUNLOAD,
  WINDOW_RESIZE,
  UPDATE_WATERBALL_TITLE,
  WINDOW_KEYPRESS,
  WINDOW_KEYDOWN,
  WINDOW_KEYUP,
  WINDOW_CLICK,
  WINDOW_MOUSEDOWN,
  WINDOW_MOUSEUP,
  WINDOW_MOUSEMOVE,
  WINDOW_MOUSEOVER,
  WINDOW_MOUSEWHEEL,
  WINDOW_FOCUS,
  WINDOW_BLUR,
  DOCUMENT_COPY,
  SHOW_DEV_MODE_ALERT,
  ANTI_IDLE,
  LEGACY_INIT,
  WS_BEFORE_CONNECT,
  WS_CONNECTED,
  WS_DATA,
  WS_CLOSED,
  DISABLE_LIVE_HELPER,
  HIGHLIGHT_ROW,
  CHANGE_LINES,
  UPDATE_CURSOR,
  MANUAL_FOCUS_INPUT,
} from "./reducer";

const WHEEL_NAME = "onwheel" in window ? "wheel" : "mousewheel";

const CallbagContext = React.createContext({
  dispatch() {},
  state: {},
});

export const CallbagConsumer = CallbagContext.Consumer;

export class Callbag extends React.Component {
  subject = makeSubject();

  state = this.props.initialState;

  handleDispatch = actionOrType => {
    const action =
      typeof actionOrType === "symbol" ? { type: actionOrType } : actionOrType;
    this.subject(1, action);
  };

  handleSubscribe = state => {
    this.setState(prevState => {
      if (prevState !== state) {
        return state;
      }
    });
  };

  onBeforeConnect() {
    this.handleDispatch(WS_BEFORE_CONNECT);
  }

  onConnected() {
    this.handleDispatch(WS_CONNECTED);
  }

  onData(data) {
    this.handleDispatch({
      type: WS_DATA,
      data,
    });
  }

  onClosed() {
    this.handleDispatch(WS_CLOSED);
  }

  onDisableLiveHelper() {
    this.handleDispatch(DISABLE_LIVE_HELPER);
  }

  onLines(lines) {
    this.handleDispatch({
      type: CHANGE_LINES,
      data: lines,
    });
  }

  onCurrentHighlighted(highlightedIndex) {
    this.handleDispatch({
      type: HIGHLIGHT_ROW,
      data: highlightedIndex,
    });
  }

  onUpdateCursor() {
    this.handleDispatch(UPDATE_CURSOR);
  }

  onManualFocusInput() {
    this.handleDispatch(MANUAL_FOCUS_INPUT);
  }

  componentDidMount() {
    pipe(
      merge(
        this.subject,
        pipe(
          fromPromise(
            process.env.DEVELOPER_MODE
              ? import("./ModalAlert/DeveloperModeAlert")
              : Promise.resolve()
          ),
          filter(it => it),
          map(({ DeveloperModeAlert }) => ({
            type: SHOW_DEV_MODE_ALERT,
            data: DeveloperModeAlert,
          }))
        ),
        pipe(
          fromEvent(window, "beforeunload"),
          map(event => ({
            type: WINDOW_BEFOREUNLOAD,
            event,
          }))
        ),
        pipe(
          fromEvent(window, "resize"),
          map(() => ({
            type: WINDOW_RESIZE,
          }))
        ),
        pipe(
          fromEvent(window, "focus"),
          map(event => ({
            type: WINDOW_FOCUS,
            event,
          }))
        ),
        pipe(
          fromEvent(window, "blur"),
          map(event => ({
            type: WINDOW_BLUR,
            event,
          }))
        ),
        pipe(
          fromEvent(window, "touchstart"),
          map(event => ({
            type: WINDOW_TOUCHSTART,
            event,
          }))
        ),
        pipe(
          fromEvent(window, "click"),
          map(event => ({
            type: WINDOW_CLICK,
            event,
          }))
        ),
        pipe(
          fromEvent(window, "mousedown"),
          map(event => ({
            type: WINDOW_MOUSEDOWN,
            event,
          }))
        ),
        pipe(
          fromEvent(window, "mouseup"),
          map(event => ({
            type: WINDOW_MOUSEUP,
            event,
          }))
        ),
        pipe(
          fromEvent(window, "mousemove"),
          map(event => ({
            type: WINDOW_MOUSEMOVE,
            event,
          }))
        ),
        pipe(
          fromEvent(window, "mouseover"),
          map(event => ({
            type: WINDOW_MOUSEOVER,
            event,
          }))
        ),
        pipe(
          fromEvent(window, WHEEL_NAME),
          map(event => ({
            type: WINDOW_MOUSEWHEEL,
            event,
          }))
        ),
        pipe(
          fromEvent(window, "keydown"),
          map(event => ({
            type: WINDOW_KEYDOWN,
            event,
          }))
        ),
        pipe(
          fromEvent(window, "keypress"),
          map(event => ({
            type: WINDOW_KEYPRESS,
            event,
          }))
        ),
        pipe(
          fromEvent(window, "keyup"),
          map(event => ({
            type: WINDOW_KEYUP,
            event,
          }))
        ),
        pipe(
          interval(1500),
          map(() => ({
            type: UPDATE_WATERBALL_TITLE,
          }))
        ),
        pipe(
          interval(1000),
          map(() => ({
            type: ANTI_IDLE,
          }))
        ),
        pipe(
          fromEvent(document, "copy"),
          map(event => ({
            type: DOCUMENT_COPY,
            event,
          }))
        )
      ),
      scan(this.props.reducer, this.props.initialState),
      forEach(this.handleSubscribe)
    );
    this.handleDispatch({
      type: LEGACY_INIT,
      data: this.props.legacy,
    });
    this.handleDispatch(WINDOW_RESIZE);
  }

  render() {
    return (
      <CallbagContext.Provider
        value={{
          dispatch: this.handleDispatch,
          state: this.state,
        }}
      >
        {this.props.children}
      </CallbagContext.Provider>
    );
  }
}
