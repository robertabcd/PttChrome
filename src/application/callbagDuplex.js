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

export const LEGACY_INIT = Symbol.for("LEGACY_INIT");

export const WINDOW_BEFOREUNLOAD = Symbol.for("WINDOW_BEFOREUNLOAD");
export const WINDOW_RESIZE = Symbol.for("WINDOW_RESIZE");
export const WINDOW_FOCUS = Symbol.for("WINDOW_FOCUS");
export const WINDOW_BLUR = Symbol.for("WINDOW_BLUR");
export const WINDOW_TOUCHSTART = Symbol.for("WINDOW_TOUCHSTART");
export const WINDOW_CLICK = Symbol.for("WINDOW_CLICK");

export const WINDOW_MOUSEDOWN = Symbol.for("WINDOW_MOUSEDOWN");
export const WINDOW_MOUSEUP = Symbol.for("WINDOW_MOUSEUP");
export const WINDOW_MOUSEOVER = Symbol.for("WINDOW_MOUSEOVER");
export const WINDOW_MOUSEMOVE = Symbol.for("WINDOW_MOUSEMOVE");
export const WINDOW_MOUSEWHEEL = Symbol.for("WINDOW_MOUSEWHEEL");

export const WINDOW_KEYDOWN = Symbol.for("WINDOW_KEYDOWN");
export const WINDOW_KEYPRESS = Symbol.for("WINDOW_KEYPRESS");
export const WINDOW_KEYUP = Symbol.for("WINDOW_KEYUP");

export const WS_CONNECTING = Symbol.for("WS_CONNECTING");
export const WS_CONNECTED = Symbol.for("WS_CONNECTED");
export const WS_DATA = Symbol.for("WS_DATA");
export const WS_CLOSED = Symbol.for("WS_CLOSED");
export const UPDATE_WATERBALL_TITLE = Symbol.for("UPDATE_WATERBALL_TITLE");
export const ANTI_IDLE = Symbol.for("ANTI_IDLE");

export const DOCUMENT_COPY = Symbol.for("DOCUMENT_COPY");

export const INPUT_PASTE = Symbol.for("INPUT_PASTE");
export const INPUT = Symbol.for("INPUT");
export const INPUT_COMPOSITION_START = Symbol.for("INPUT_COMPOSITION_START");
export const INPUT_COMPOSITION_END = Symbol.for("INPUT_COMPOSITION_END");

export const SHOW_CONTEXT_MENU = Symbol.for("SHOW_CONTEXT_MENU");
export const HIDE_CONTEXT_MENU = Symbol.for("HIDE_CONTEXT_MENU");

export const DROPDOWN_MENU_COPY = Symbol.for("DROPDOWN_MENU_COPY");
export const DROPDOWN_MENU_COPY_ANSI = Symbol.for("DROPDOWN_MENU_COPY_ANSI");
export const DROPDOWN_MENU_PASTE = Symbol.for("DROPDOWN_MENU_PASTE");
export const DROPDOWN_MENU_SEARCH_GOOGLE = Symbol.for(
  "DROPDOWN_MENU_SEARCH_GOOGLE"
);
export const DROPDOWN_MENU_OPEN_URL_NEW_TAB = Symbol.for(
  "DROPDOWN_MENU_OPEN_URL_NEW_TAB"
);
export const DROPDOWN_MENU_COPY_LINK_URL = Symbol.for(
  "DROPDOWN_MENU_COPY_LINK_URL"
);
export const DROPDOWN_MENU_QUICK_SEARCH = Symbol.for(
  "DROPDOWN_MENU_QUICK_SEARCH"
);
export const DROPDOWN_MENU_SELECT_ALL = Symbol.for("DROPDOWN_MENU_SELECT_ALL");
export const DROPDOWN_MENU_TOGGLE_MOUSE_BROWSING = Symbol.for(
  "DROPDOWN_MENU_TOGGLE_MOUSE_BROWSING"
);
export const DROPDOWN_MENU_SHOW_INPUT_HELPER = Symbol.for(
  "DROPDOWN_MENU_SHOW_INPUT_HELPER"
);
export const DROPDOWN_MENU_SHOW_LIVE_HELPER = Symbol.for(
  "DROPDOWN_MENU_SHOW_LIVE_HELPER"
);
export const DROPDOWN_MENU_SHOW_SETTINGS = Symbol.for(
  "DROPDOWN_MENU_SHOW_SETTINGS"
);

export const HIDE_INPUT_HELPER = Symbol.for("HIDE_INPUT_HELPER");
export const HIDE_LIVE_HELPER = Symbol.for("HIDE_LIVE_HELPER");
export const HIDE_SETTINGS = Symbol.for("HIDE_SETTINGS");
export const HIDE_PASTE_SHORTCUT_ALERT = Symbol.for(
  "HIDE_PASTE_SHORTCUT_ALERT"
);
export const HIDE_LOST_CONNECTION_ALERT = Symbol.for(
  "HIDE_LOST_CONNECTION_ALERT"
);
export const SHOW_DEV_MODE_ALERT = Symbol.for("SHOW_DEV_MODE_ALERT");
export const HIDE_DEV_MODE_ALERT = Symbol.for("HIDE_DEV_MODE_ALERT");

export const INPUT_HELPER_SEND = Symbol.for("INPUT_HELPER_SEND");
export const INPUT_HELPER_SYMBOL = Symbol.for("INPUT_HELPER_SYMBOL");
export const INPUT_HELPER_RESET = Symbol.for("INPUT_HELPER_RESET");
export const DISABLE_LIVE_HELPER = Symbol.for("DISABLE_LIVE_HELPER");
export const LIVE_HELPER_TOGGLE_ENABLED = Symbol.for(
  "LIVE_HELPER_TOGGLE_ENABLED"
);
export const LIVE_HELPER_CHANGE_SEC = Symbol.for("LIVE_HELPER_CHANGE_SEC");
export const CHANGE_PENDING_SETTINGS = Symbol.for("CHANGE_PENDING_SETTINGS");
export const RESET_DEFAULT_SETTINGS = Symbol.for("RESET_DEFAULT_SETTINGS");

export const CHANGE_LINES = Symbol.for("CHANGE_LINES");
export const HIGHLIGHT_ROW = Symbol.for("HIGHLIGHT_ROW");

// ER = Easy Reading
export const INIT_ER_LINES = Symbol.for("INIT_ER_LINES");
export const APPEND_ER_LINES = Symbol.for("APPEND_ER_LINES");
export const UPDATE_ER_ACTION_LINE = Symbol.for("UPDATE_ER_ACTION_LINE");

export const UPDATE_CURSOR = Symbol.for("UPDATE_CURSOR");
export const MANUAL_FOCUS_INPUT = Symbol.for("MANUAL_FOCUS_INPUT");
export const MANUAL_TELNET_SEND = Symbol.for("MANUAL_TELNET_SEND");

export const makeApplicationSource = () =>
  merge(
    pipe(
      fromPromise(
        process.env.DEVELOPER_MODE
          ? import("../components/ModalAlert/DeveloperModeAlert")
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
  );

const WHEEL_NAME = "onwheel" in window ? "wheel" : "mousewheel";
