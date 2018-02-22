import {
  unescapeStr,
  b2u,
  parseWaterball,
  wrapText,
  u2b,
  parseStatusRow,
} from "../js/string_util";
import { termInvColors } from "../js/term_buf";
import { i18n } from "../js/i18n";

const DEFAULT_SETTINGS = {
  // general
  enablePicPreview: true,
  enableNotifications: true,
  enableEasyReading: false,
  endTurnsOnLiveUpdate: false,
  copyOnSelect: false,
  antiIdleTime: 0,
  lineWrap: 78,

  // mouse browsing
  useMouseBrowsing: false,
  mouseBrowsingHighlight: true,
  mouseBrowsingHighlightColor: 2,
  mouseLeftFunction: 0,
  mouseMiddleFunction: 0,
  mouseWheelFunction1: 1,
  mouseWheelFunction2: 2,
  mouseWheelFunction3: 3,

  // displays
  fontFitWindowWidth: false,
  fontFace: "MingLiu,SymMingLiU,monospace",
  bbsMargin: 0,
};

const SETTINGS_STORAGE_KEY = "pttchrome.pref.v1";
const BUTTON_LEFT = 0;
const BUTTON_MIDDLE = 1;
const BUTTON_RIGHT = 2;

export const readValuesWithDefault = () => {
  try {
    return {
      ...DEFAULT_SETTINGS,
      ...JSON.parse(window.localStorage.getItem(SETTINGS_STORAGE_KEY)).values,
    };
  } catch (e) {
    return {
      ...DEFAULT_SETTINGS,
    };
  }
};

export const writeValues = pendingValues => {
  try {
    window.localStorage.setItem(
      SETTINGS_STORAGE_KEY,
      JSON.stringify({
        pendingValues,
      })
    );
  } catch (e) {}
};

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

export const WS_BEFORE_CONNECT = Symbol.for("WS_CONNECTION");
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

export const UPDATE_CURSOR = Symbol.for("UPDATE_CURSOR");
export const MANUAL_FOCUS_INPUT = Symbol.for("MANUAL_FOCUS_INPUT");

const singleton = {
  idleTime: 0,
};

export const initialState = {
  dropdownMenuRef: React.createRef(),
  inputRef: React.createRef(),

  focused: false,
  connection: 0,
  waterballTitle: undefined,

  showsContextMenu: false,
  showsSettings: false,
  showsPasteShortcutAlert: false,
  showsDevModeAlert: process.env.DEVELOPER_MODE,
  DeveloperModeAlert: undefined,

  dropdown: {
    pageX: 0,
    pageY: 0,
    top: 0,
    left: 0,
    contextOnUrl: "",
    aElement: undefined,
    selectedText: "",
    urlEnabled: false,
    normalEnabled: false,
    selEnabled: false,
  },
  dropdownMenu: {
    showsInputHelper: false,
    showsLiveHelper: false,
  },
  liveHelper: {
    enabled: false,
    sec: 1,
  },
  settings: readValuesWithDefault(),
  pendingSettings: readValuesWithDefault(),

  screen: {
    lines: [],
    highlightedIndex: -1,
    scaleX: 1,
    scaleY: 1,
    chh: undefined,
    chw: undefined,
    innerBounds: {
      width: 0,
      height: 0,
    },
  },
  cursor: {
    left: 0,
    top: 0,
    color: undefined,
  },
  input: {
    left: 0,
    top: 0,
    width: 1,
  },
};

export function reducer(state, action) {
  // console.log(`called reducer()`, state.connection, action.type);
  switch (action.type) {
    case LEGACY_INIT: {
      singleton.legacy = action.data;
      return state;
    }
    case WINDOW_BEFOREUNLOAD: {
      if (
        state.connection === 1 &&
        singleton.legacy.bbscore.conn &&
        singleton.legacy.buf.pageState != 0
      ) {
        action.event.returnValue = "You are currently connected. Are you sure?";
      }
      return state;
    }
    case WINDOW_RESIZE: {
      const nextScreen = getNextScreen(state);
      const nextCursor = getNextCursor(state, nextScreen);
      const nextInput = getNextInput(
        state.inputRef,
        state.settings,
        nextScreen,
        state.input
      );
      return {
        ...state,
        screen: nextScreen,
        cursor: nextCursor,
        input: nextInput,
      };
    }
    case WINDOW_FOCUS: {
      return {
        ...state,
        focused: true,
      };
    }
    case WINDOW_BLUR: {
      return {
        ...state,
        focused: false,
      };
    }
    case WINDOW_TOUCHSTART: {
      if (action.event.target.getAttribute("role") !== "menuitem") {
        return {
          ...state,
          showsContextMenu: false,
        };
      }
      return state;
    }
    case WINDOW_CLICK: {
      if (state.showsSettings || state.showsPasteShortcutAlert) {
        return state;
      }
      singleton.legacy.bbscore.mouse_click(event);
      return {
        ...state,
        showsContextMenu: false,
      };
    }
    case WINDOW_MOUSEDOWN: {
      if (state.showsSettings || state.showsPasteShortcutAlert) {
        return state;
      }
      const { event } = action;
      let { showsPasteShortcutAlert } = state;
      switch (event.button) {
        case BUTTON_LEFT: {
          if (state.settings.useMouseBrowsing) {
            if (singleton.legacy.bbscore.dblclickTimer) {
              //skip
              event.preventDefault();
              event.stopPropagation();
              event.cancelBubble = true;
            }
            singleton.legacy.bbscore.setDblclickTimer();
          }
          singleton.legacy.bbscore.mouseLeftButtonDown = true;
          manualFocusInput(state);
          if (!window.getSelection().isCollapsed) {
            singleton.legacy.bbscore.CmdHandler.setAttribute(
              "SkipMouseClick",
              "1"
            );
          }
          break;
        }
        case BUTTON_MIDDLE: {
          const { target } = event;
          if (
            [target, target.parentNode]
              .map(it => it.nodeName.toLowerCase())
              .indexOf("a") === -1
          ) {
            let killEvent = true;
            switch (state.settings.mouseMiddleFunction) {
              case 1:
                singleton.legacy.bbscore.conn.send("\r");
                break;
              case 2:
                singleton.legacy.bbscore.conn.send("\x1b[D");
                break;
              case 3:
                showsPasteShortcutAlert = true;
                break;
              default:
                killEvent = false;
                break;
            }
            if (killEvent) {
              event.preventDefault();
              event.stopPropagation();
            }
          }

          break;
        }
        case BUTTON_RIGHT: {
          singleton.legacy.bbscore.mouseRightButtonDown = true;
          break;
        }
        default:
          break;
      }
      return {
        ...state,
        showsPasteShortcutAlert,
      };
    }
    case WINDOW_MOUSEUP: {
      if (state.showsSettings || state.showsPasteShortcutAlert) {
        return state;
      }
      singleton.legacy.bbscore.mouse_up(action.event);
      return state;
    }
    case WINDOW_MOUSEMOVE: {
      singleton.legacy.bbscore.mouse_move(action.event);
      return state;
    }
    case WINDOW_MOUSEOVER: {
      if (state.showsSettings || state.showsPasteShortcutAlert) {
        return state;
      }
      if (
        window.getSelection().isCollapsed &&
        !singleton.legacy.bbscore.mouseLeftButtonDown
      ) {
        manualFocusInput(state);
      }
      return state;
    }
    case WINDOW_MOUSEWHEEL: {
      if (state.showsSettings || state.showsPasteShortcutAlert) {
        return state;
      }
      singleton.legacy.bbscore.mouse_scroll(action.event);
      return state;
    }
    case WINDOW_KEYDOWN: {
      const { event } = action;
      if (state.connection === 2) {
        if (event.keyCode === 13) {
          singleton.legacy.bbscore.connect(
            singleton.legacy.bbscore.connectedUrl.url
          );
          return state;
        }
        // Kills everything becase we don't want any further action performed under ConnectionAlert status
        event.preventDefault();
        event.stopImmediatePropagation();
      } else {
        if (skipIfMatchesKey(event)) {
          return state;
        }
        // disable auto update pushthread if any command is issued;
        if (!event.altKey) {
          state = onDisableLiveHelper(state);
        }
        if (event.keyCode > 15 && event.keyCode < 19) {
          return state; // Shift Ctrl Alt (19)
        }
        if (
          state.showsSettings ||
          state.showsPasteShortcutAlert ||
          state.showsContextMenu
        ) {
          return state;
        }
        if (
          singleton.legacy.bbscore.easyReading._enabled &&
          singleton.legacy.buf.startedEasyReading &&
          !singleton.legacy.buf.easyReadingShowReplyText &&
          !singleton.legacy.buf.easyReadingShowPushInitText
        ) {
          singleton.legacy.view.easyReadingKeyDownKeyCode = event.keyCode;
          singleton.legacy.bbscore.easyReading._onKeyDown(event);
          if (event.defaultPrevented) {
            return state;
          }
        }
        let killEvent = true;
        switch (`${Boolean(event.ctrlKey)}_${Boolean(event.altKey)}_${Boolean(
          event.shiftKey
        )}_${event.key.toLowerCase()}`) {
          case "false_false_false_end":
          // fallthrough
          case "false_false_true_end":
            if (
              (singleton.legacy.buf.pageState == 2 ||
                singleton.legacy.buf.pageState == 3) &&
              state.settings.endTurnsOnLiveUpdate
            ) {
              state = onToggleLiveHelper(state);
            } else {
              killEvent = false;
            }
            break;
          case "true_false_false_c":
            if (!window.getSelection().isCollapsed) {
              //^C , do copy
              const selectedText = window
                .getSelection()
                .toString()
                .replace(/\u00a0/g, " ");
              singleton.legacy.bbscore.doCopy(selectedText);
            } else {
              killEvent = false;
            }
            break;
          case "true_false_false_a":
            singleton.legacy.bbscore.doSelectAll();
            break;
          case "true_false_true_v":
            state = {
              ...state,
              showsPasteShortcutAlert: true,
            };
            break;
          default:
            killEvent = false;
            break;
        }

        if (killEvent) {
          event.preventDefault();
          return state;
        }
        singleton.legacy.view._keyboard.onKeyDown(event);
      }
      return state;
    }
    case WINDOW_KEYPRESS: {
      const { event } = action;
      if (skipIfMatchesKey(event)) {
        return state;
      }
      singleton.legacy.view._keyboard.onKeyPress(event);
      return state;
    }
    case WINDOW_KEYUP: {
      const { event } = action;
      if (state.showsContextMenu) {
        event.preventDefault();
        event.stopPropagation();

        if (!event.altKey && !event.ctrlKey && !event.shiftKey) {
          // const eventKey = EVENT_KEY_BY_HOT_KEY[event.keyCode];
          // if (eventKey) {
          //   this.props.onMenuSelect(eventKey, event);
          // }
        }
      }
      // We don't need to handle code 229 here, as it should be already composing.
      if (event.keyCode > 15 && event.keyCode < 19) {
        return state; // Shift Ctrl Alt (19)
      }
      if (state.showsSettings || state.showsPasteShortcutAlert) {
        return state;
      }
      // set input area focus whenever key down even if there is selection
      manualFocusInput(state);
      return state;
    }
    case WS_BEFORE_CONNECT: {
      return {
        ...state,
        connection: 0,
      };
    }
    case WS_CONNECTED: {
      singleton.idleTime = 0;

      const link = document.querySelector("link[rel~='icon']");
      link.setAttribute("href", require("../icon/logo_connect.png"));

      manualFocusInput(state);
      return {
        ...state,
        connection: 1,
      };
    }
    case WS_DATA: {
      if (!state.focused && state.enableNotifications) {
        // parse received data for waterball
        const waterball = parseWaterball(b2u(action.data));
        if (waterball) {
          // TODO: Notification.requestPermission()
          //
          // const title = `${waterball.userId} ${i18n("notification_said")}`;
          // const notif = new Notification(title, {
          //   icon: require("../icon/icon_128.png"),
          //   body: waterball.message,
          //   tag: waterball.userId,
          // });
          // notif.onclick = () => {
          //   notif.close();
          //   this.setState({ waterballTitle: undefined, waterballNotif: undefined });
          //   window.focus();
          // };
          // return {
          //   ...state,
          //   waterballTitle: `${title} ${waterball.message}`,
          //   waterballNotif: notif,
          // };
        }
      }
      return state;
    }
    case WS_CLOSED: {
      singleton.idleTime = 0;

      const link = document.querySelector("link[rel~='icon']");
      link.setAttribute("href", require("../icon/logo_disconnect.png"));

      return {
        ...state,
        connection: 2,
      };
    }
    case UPDATE_WATERBALL_TITLE: {
      try {
        if (state.waterballTitle && document.title !== state.waterballTitle) {
          document.title = state.waterballTitle;
        } else {
          document.title = singleton.legacy.bbscore.connectedUrl.site;
        }
      } catch (e) {}
      return state;
    }
    case ANTI_IDLE: {
      if (state.connection === 1) {
        if (state.antiIdleTime && singleton.idleTime > state.antiIdleTime) {
          singleton.legacy.bbscore.conn.send(ANTI_IDLE_STR);
          singleton.idleTime = 0;
        } else {
          singleton.idleTime += 1;
        }
        singleton.legacy.buf.blinkOn = true;
        singleton.legacy.buf.queueUpdate(true);
        singleton.legacy.bbscore.incrementCountToUpdatePushthread();
      }
      return state;
    }
    case DOCUMENT_COPY: {
      const { event } = action;
      if (singleton.legacy.bbscore.strToCopy) {
        event.clipboardData.setData("text", singleton.legacy.bbscore.strToCopy);
        event.preventDefault();
        console.log("copied: ", singleton.legacy.bbscore.strToCopy);
        singleton.legacy.bbscore.strToCopy = null;
      }
      return state;
    }
    case INPUT_PASTE: {
      const { event } = action;
      const content = event.clipboardData.getData("text");
      if (content) {
        event.preventDefault();
        singleton.legacy.view.onTextInput(
          reformatPaste(content, state.settings.lineWrap)
        );
      }
      return state;
    }
    case INPUT: {
      return onInput(state);
    }
    case INPUT_COMPOSITION_START: {
      singleton.isComposition = true;
      const nextInput = getNextInput(
        state.inputRef,
        state.settings,
        state.screen,
        state.input
      );
      manualFocusInput(state);
      state.inputRef.value.classList.add("View__Input--active");
      return {
        ...state,
        input: nextInput,
      };
    }
    case INPUT_COMPOSITION_END: {
      state.inputRef.value.classList.remove("View__Input--active");
      singleton.isComposition = false;
      manualFocusInput(state);
      // Some browsers fire another input event after composition; some not.
      // The strategy here is to ignore the inputs during composition.
      // Instead, we pull all input text at composition end, and clear input text.
      // So if input event do fire after composition end, we'll get a empty string.
      return onInput(state);
    }
    case SHOW_CONTEXT_MENU: {
      const dropdown = (event => {
        const top = (mouseHeight, menuHeight) => {
          const pageHeight = window.innerHeight;

          // opening menu would pass the bottom of the page
          if (
            mouseHeight + menuHeight > pageHeight &&
            menuHeight < mouseHeight
          ) {
            return mouseHeight - menuHeight;
          }
          return mouseHeight;
        };

        const left = (mouseWidth, menuWidth) => {
          const pageWidth = window.innerWidth;

          // opening menu would pass the side of the page
          if (mouseWidth + menuWidth > pageWidth && menuWidth < mouseWidth) {
            return mouseWidth - menuWidth;
          }
          return mouseWidth;
        };

        const target = $(event.target);
        let contextOnUrl = "";
        let aElement;
        if (target.is("a")) {
          contextOnUrl = target.attr("href");
          aElement = target[0];
        } else if (target.parent().is("a")) {
          contextOnUrl = target.parent().attr("href");
          aElement = target[0].parentNode;
        }

        // replace the &nbsp;
        const selectedText = window
          .getSelection()
          .toString()
          .replace(/\u00a0/g, " ");
        const urlEnabled = !!contextOnUrl;
        const normalEnabled = !urlEnabled && window.getSelection().isCollapsed;
        const selEnabled = !normalEnabled;

        return {
          pageX: event.pageX,
          pageY: event.pageY,
          top: top(event.pageY, state.dropdownMenuRef.value.clientHeight),
          left: left(event.pageX, state.dropdownMenuRef.value.clientWidth),
          contextOnUrl,
          aElement,
          selectedText,
          urlEnabled,
          normalEnabled,
          selEnabled,
        };
      })(action.event);

      const { CmdHandler } = singleton.legacy.bbscore;
      if (CmdHandler.getAttribute("doDOMMouseScroll") === "1") {
        CmdHandler.setAttribute("doDOMMouseScroll", "0");
      }
      // just in case the selection get de-selected
      if (window.getSelection().isCollapsed) {
        singleton.legacy.bbscore.lastSelection = null;
      } else {
        singleton.legacy.bbscore.lastSelection = singleton.legacy.view.getSelectionColRow();
      }
      return {
        ...state,
        showsContextMenu: true,
        dropdown,
      };
    }
    case HIDE_CONTEXT_MENU: {
      return {
        ...state,
        showsContextMenu: false,
      };
    }
    case DROPDOWN_MENU_COPY: {
      singleton.legacy.bbscore.doCopy(state.dropdown.selectedText);
      return {
        ...state,
        showsContextMenu: false,
      };
    }
    case DROPDOWN_MENU_COPY_ANSI: {
      singleton.legacy.bbscore.doCopyAnsi();
      return {
        ...state,
        showsContextMenu: false,
      };
    }
    case DROPDOWN_MENU_PASTE: {
      return {
        ...state,
        showsContextMenu: false,
        showsPasteShortcutAlert: true,
      };
    }
    case DROPDOWN_MENU_SEARCH_GOOGLE: {
      window.open(`http://google.com/search?q=${state.dropdown.selectedText}`);
      return {
        ...state,
        showsContextMenu: false,
      };
    }
    case DROPDOWN_MENU_OPEN_URL_NEW_TAB: {
      const event = document.createEvent("MouseEvents");
      event.initMouseEvent(
        "click",
        true,
        true,
        window,
        0,
        0,
        0,
        0,
        0,
        true,
        false,
        false,
        false,
        0,
        null
      );
      state.dropdown.aElement.dispatchEvent(event);
      return {
        ...state,
        showsContextMenu: false,
      };
    }
    case DROPDOWN_MENU_COPY_LINK_URL: {
      singleton.legacy.bbscore.doCopy(state.dropdown.contextOnUrl);
      return {
        ...state,
        showsContextMenu: false,
      };
    }
    case DROPDOWN_MENU_QUICK_SEARCH: {
      window.open(action.data);
      return {
        ...state,
        showsContextMenu: false,
      };
    }
    case DROPDOWN_MENU_SELECT_ALL: {
      singleton.legacy.bbscore.doSelectAll();
      return {
        ...state,
        showsContextMenu: false,
      };
    }
    case DROPDOWN_MENU_TOGGLE_MOUSE_BROWSING: {
      // handleToggleMouseBrowsing = () => {
      //   const nextPrefValues = {
      //     ...this.state.prefValues,
      //     useMouseBrowsing: !this.state.prefValues.useMouseBrowsing,
      //   };
      //   this.setState({
      //     prefValues: nextPrefValues,
      //   });

      //   if (!nextPrefValues.useMouseBrowsing) {
      //     this.props.__APP__.buf.BBSWin.style.cursor = "auto";
      //     this.props.__APP__.buf.clearHighlight();
      //     this.props.__APP__.buf.mouseCursor = 0;
      //     this.props.__APP__.buf.nowHighlight = -1;
      //     this.props.__APP__.buf.tempMouseCol = 0;
      //     this.props.__APP__.buf.tempMouseRow = 0;
      //   } else {
      //     this.props.__APP__.buf.resetMousePos();
      //     this.props.__APP__.view.redraw(true);
      //    getNextCursor();
      // getNextInput(inputRef, settings, screen, input)
      //   }
      // };
      // if (this.state.prefValues !== prevState.prefValues) {
      //   writeValues(this.state.prefValues);
      // }
      return {
        ...state,
        showsContextMenu: false,
        settings: {
          ...state.settings,
          useMouseBrowsing: !state.settings.useMouseBrowsing,
        },
      };
    }
    case DROPDOWN_MENU_SHOW_INPUT_HELPER: {
      return {
        ...state,
        showsContextMenu: false,
        dropdownMenu: {
          ...state.dropdownMenu,
          showsInputHelper: true,
        },
      };
    }
    case DROPDOWN_MENU_SHOW_LIVE_HELPER: {
      return {
        ...state,
        showsContextMenu: false,
        dropdownMenu: {
          ...state.dropdownMenu,
          showsLiveHelper: true,
        },
      };
    }
    case DROPDOWN_MENU_SHOW_SETTINGS: {
      return {
        ...state,
        showsContextMenu: false,
        showsSettings: true,
        pendingSettings: state.settings,
        liveHelper: {
          ...state.liveHelper,
          enabled: false,
        },
      };
    }
    case HIDE_INPUT_HELPER: {
      return {
        ...state,
        dropdownMenu: {
          ...state.dropdownMenu,
          showsInputHelper: false,
        },
      };
    }
    case HIDE_LIVE_HELPER: {
      return {
        ...state,
        dropdownMenu: {
          ...state.dropdownMenu,
          showsLiveHelper: false,
          liveHelper: {
            ...state.liveHelper,
            enabled: false,
          },
        },
      };
    }
    case INPUT_HELPER_SEND: {
      let cmd = action.data;
      if (
        !window.getSelection().isCollapsed &&
        ingleton.legacy.buf.pageState == 6
      ) {
        // something selected
        const sel = ingleton.legacy.view.getSelectionColRow();
        let y = ingleton.legacy.buf.cur_y;
        let selCmd = "";
        // move cursor to end and send reset code
        selCmd += "\x1b[H";
        if (y > sel.end.row) {
          selCmd += "\x1b[A".repeat(y - sel.end.row);
        } else if (y < sel.end.row) {
          selCmd += "\x1b[B".repeat(sel.end.row - y);
        }
        var repeats = ingleton.legacy.buf.getRowText(
          sel.end.row,
          0,
          sel.end.col
        ).length;
        selCmd += "\x1b[C".repeat(repeats) + "\x15[m";

        // move cursor to start and send color code
        y = sel.end.row;
        selCmd += "\x1b[H";
        if (y > sel.start.row) {
          selCmd += "\x1b[A".repeat(y - sel.start.row);
        } else if (y < sel.start.row) {
          selCmd += "\x1b[B".repeat(sel.start.row - y);
        }
        repeats = ingleton.legacy.buf.getRowText(
          sel.start.row,
          0,
          sel.start.col
        ).length;
        selCmd += "\x1b[C".repeat(repeats);
        cmd = selCmd + cmd;
      }
      singleton.legacy.bbscore.conn.send(cmd);
      return state;
    }
    case INPUT_HELPER_SYMBOL: {
      singleton.legacy.bbscore.conn.convSend(action.data);
      return state;
    }
    case INPUT_HELPER_RESET: {
      singleton.legacy.bbscore.conn.send("\x15[m");
      return state;
    }
    case DISABLE_LIVE_HELPER: {
      return onDisableLiveHelper(state);
    }
    case LIVE_HELPER_TOGGLE_ENABLED: {
      return onToggleLiveHelper(state);
    }
    case LIVE_HELPER_CHANGE_SEC: {
      return {
        ...state,
        liveHelper: {
          ...state.liveHelper,
          sec: action.data,
        },
      };
    }
    case HIDE_SETTINGS: {
      // onHideSettings(values);
      // TODO: onSave(pendingValues)
      // onPrefReset: (state, { pttchrome, onHideSettings }) => values => {
      //   onHideSettings(values);
      //   pttchrome.view.redraw(true);
      // },
      // manualFocusInput(state);
      // this.props.__APP__.switchToEasyReadingMode();
      // if (this.state.prefValues !== prevState.prefValues) {
      //   writeValues(this.state.prefValues);
      // }
      return {
        ...state,
        showsSettings: false,
        settings: state.pendingSettings,
      };
    }
    case CHANGE_PENDING_SETTINGS: {
      return {
        ...state,
        pendingSettings: {
          ...state.pendingSettings,
          ...action.data,
        },
      };
    }
    case RESET_DEFAULT_SETTINGS: {
      return {
        ...state,
        pendingSettings: DEFAULT_SETTINGS,
      };
    }
    case HIDE_PASTE_SHORTCUT_ALERT: {
      return {
        ...state,
        showsPasteShortcutAlert: false,
      };
    }
    case HIDE_LOST_CONNECTION_ALERT: {
      singleton.legacy.bbscore.connect(
        singleton.legacy.bbscore.connectedUrl.url
      );
      return state;
    }
    case SHOW_DEV_MODE_ALERT: {
      return {
        ...state,
        showsDevModeAlert: true,
        DeveloperModeAlert: action.data,
      };
    }
    case HIDE_DEV_MODE_ALERT: {
      return {
        ...state,
        showsDevModeAlert: false,
      };
    }
    case CHANGE_LINES: {
      return {
        ...state,
        screen: {
          ...state.screen,
          lines: action.data,
        },
      };
    }
    case HIGHLIGHT_ROW: {
      if (state.settings.mouseBrowsingHighlight) {
        return {
          ...state,
          screen: {
            ...state.screen,
            highlightedIndex: action.data,
          },
        };
      }
      return state;
    }
    case UPDATE_CURSOR: {
      const nextCursor = getNextCursor(state, state.screen);
      const nextInput = getNextInput(
        state.inputRef,
        state.settings,
        state.screen,
        state.input
      );

      return {
        ...state,
        cursor: nextCursor,
        input: nextInput,
      };
    }
    case MANUAL_FOCUS_INPUT: {
      manualFocusInput(state);
      return state;
    }
    default: {
      return state;
    }
  }
}

const ENTER_CHAR = "\r";
const ESC_CHAR = "\x15"; // Ctrl-U
const ANTI_IDLE_STR = "\x1b\x1b";

function reformatPaste(text, lineWrap) {
  text = text.replace(/\r\n/g, "\r");
  text = text.replace(/\n/g, "\r");
  text = text.replace(/\r/g, ENTER_CHAR);

  if (text.indexOf("\x1b") < 0 && lineWrap > 0) {
    text = wrapText(text, lineWrap, ENTER_CHAR);
  }

  //FIXME: stop user from pasting DBCS words with 2-color
  text = text.replace(/\x1b/g, ESC_CHAR);
  return text;
}

function manualFocusInput(state) {
  if (
    state.showsSettings ||
    state.showsPasteShortcutAlert ||
    (singleton.legacy.bbscore.touch &&
      singleton.legacy.bbscore.touch.touchStarted)
  ) {
    return;
  }
  state.inputRef.value.focus();
}

function getInnerBounds(bbsMargin) {
  const { clientWidth, clientHeight } = document.documentElement;
  return {
    width: clientWidth - bbsMargin * 2,
    height: clientHeight - bbsMargin * 2,
  };
}

function getCharSizing({ chh: nextChh, chw: nextChw }, innerBounds) {
  let { width, height } = innerBounds;
  width -= 10; // for scroll bar

  let o_h;
  let o_w;
  let i = 4;
  do {
    ++i;
    nextChh = i * 2;
    nextChw = i;
    o_h = nextChh * 24;
    o_w = nextChw * 80;
  } while (o_h <= height && o_w <= width);
  --i;
  nextChh = i * 2;
  nextChw = i;

  return {
    chh: nextChh,
    chw: nextChw,
  };
}

function getScale({ width, height }, chh, chw) {
  return {
    scaleX:
      Math.floor(width / (chw * singleton.legacy.buf.cols + 10) * 100) / 100,
    scaleY: Math.floor(height / (chh * singleton.legacy.buf.rows) * 100) / 100,
  };
}

function getNextScreen(state) {
  const { bbsMargin, fontFitWindowWidth } = state.settings;
  const innerBounds = getInnerBounds(bbsMargin);
  const { chh, chw } = getCharSizing(state.screen, innerBounds);

  const mainWidth = chw * singleton.legacy.buf.cols + 10;
  const mainMarginTop =
    chh * singleton.legacy.buf.rows < innerBounds.height
      ? (innerBounds.height - chh * singleton.legacy.buf.rows) / 2 + bbsMargin
      : bbsMargin;

  return {
    ...state.screen,
    innerBounds,
    chh,
    chw,
    mainWidth,
    mainMarginTop,
    ...(fontFitWindowWidth ? getScale(innerBounds, chh, chw) : {}),
  };
}

function convertMN2XYEx(
  bbsMargin,
  { innerBounds: { width, height }, scaleX, scaleY, chw, chh },
  cx,
  cy
) {
  let origin;
  if (scaleX !== 1 || scaleY !== 1) {
    origin = [
      (width - (chw * singleton.legacy.buf.cols + 10) * scaleX) / 2 + bbsMargin,
      (height - chh * singleton.legacy.buf.rows * scaleY) / 2 + bbsMargin,
    ];
  } else {
    const firstGridOffset = singleton.legacy.bbscore.getFirstGridOffsets();
    origin = [firstGridOffset.left, firstGridOffset.top];
  }
  return {
    left: origin[0] + cx * chw * scaleX,
    top: origin[1] + cy * chh * scaleY,
  };
}

function getNextCursor(state, nextScreen) {
  const position = convertMN2XYEx(
    state.settings.bbsMargin,
    nextScreen,
    singleton.legacy.buf.cur_x,
    singleton.legacy.buf.cur_y
  );
  // if you want to set cursor color by now background, use this.props.__VIEW__.
  if (
    singleton.legacy.buf.cur_y >= singleton.legacy.buf.rows ||
    singleton.legacy.buf.cur_x >= singleton.legacy.buf.cols
  ) {
    return state.cursor; //sometimes, the value of singleton.legacy.buf.cur_x is 80 :(
  }

  const lines = singleton.legacy.buf.lines;
  const line = lines[singleton.legacy.buf.cur_y];
  const ch = line[singleton.legacy.buf.cur_x];
  const bg = ch.getBg();
  // if you want to set cursor color by now background, use this.
  const color = termInvColors[bg];

  return {
    ...position,
    color,
  };
}

function updateInputBufferWidth(state) {
  const { value: input } = state.inputRef;
  const { chh, innerBounds } = state.screen;
  // change width according to input
  const wordCounts = u2b(input.value).length;
  // chh / 2 - 2 because border of 1
  const oneWordWidth = chh / 2 - 2;
  const width = oneWordWidth * wordCounts;

  return {
    ...state,
    input: {
      ...state.input,
      width,
      left:
        state.input.left + width + oneWordWidth * 2 >= innerBounds.width
          ? innerBounds.width - width - oneWordWidth * 2
          : state.input.left,
    },
  };
}

function onInput(state) {
  if (singleton.isComposition) {
    // beginning chrome 55, we no longer can update input buffer width on compositionupdate
    // so we update it on input event
    return updateInputBufferWidth(state);
  }
  if (
    state.showsSettings ||
    state.showsPasteShortcutAlert ||
    state.showsContextMenu
  ) {
    return state;
  }
  const { value: input } = state.inputRef;
  if (
    singleton.legacy.bbscore.easyReading._enabled &&
    singleton.legacy.buf.startedEasyReading &&
    !singleton.legacy.buf.easyReadingShowReplyText &&
    !singleton.legacy.buf.easyReadingShowPushInitText &&
    singleton.legacy.easyReadingKeyDownKeyCode == 229 &&
    input.value != "X"
  ) {
    // only use on chinese IME
    input.value = "";
    return state;
  }
  if (input.value) {
    singleton.legacy.view.onTextInput(input.value);
  }
  input.value = "";
  return state;
}

function getNextInput(inputRef, settings, screen, input) {
  if (singleton.isComposition) {
    const position = convertMN2XYEx(
      settings.bbsMargin,
      screen,
      singleton.legacy.buf.cur_x,
      singleton.legacy.buf.cur_y
    );
    const { width, height } = screen.innerBounds;

    return {
      ...input,
      left:
        width < position.left + input.width
          ? width - pinput.width - 10
          : position.left,
      top:
        height < position.top + screen.chh * 2
          ? position.top - screen.chh * 2 + 4
          : position.top + screen.chh,
    };
  }
  return input;
}

function onDisableLiveHelper(state) {
  return {
    ...state,
    liveHelper: {
      ...state.liveHelper,
      enabled: false,
    },
  };
}

function onToggleLiveHelper(state) {
  return {
    ...state,
    liveHelper: {
      ...state.liveHelper,
      enabled: !state.liveHelper.enabled,
    },
  };
}

function skipIfMatchesKey(event) {
  // On both Mac and Windows, control/alt+key will be sent as original key
  // code even under IME.
  // Char inputs will be handler on input event.
  // We can safely ignore those IME keys here.
  if (event.keyCode == 229) {
    return true;
  }
  // TODO: Since the app is almost useless on mobile devices, we might want
  // to revisit if we want this code.

  // iOS sends the keydown that starts composition as key code 0. Ignore it.
  if (event.keyCode == 0) {
    return true;
  }
  // iOS sends backspace when composing. Disallow any non-control keys during it.
  if (singleton.isComposition && !event.ctrlKey && !event.altKey) {
    return true;
  }
  return false;
}

// componentDidUpdate(prevProps, prevState) {
//   if (this.state.liveHelperEnabled !== prevState.liveHelperEnabled) {
//     if (this.state.liveHelperEnabled) {
//       // cancel easy reading mode first
//       this.props.__APP__.easyReading._enabled = false;
//       this.props.__APP__.switchToEasyReadingMode();
//       this.props.__APP__.setAutoPushthreadUpdate(this.state.liveHelperSec);
//     } else {
//       this.props.__APP__.setAutoPushthreadUpdate(-1);
//     }
//   }
// }

// componentDidUpdate(prevProps) {
//   const needsForceRedraw =
//     this.props.highlightedClassName !== prevProps.highlightedClassName ||
//     this.props.mouseBrowsingHighlight !== prevProps.mouseBrowsingHighlight;
//   const needsResize =
//     needsForceRedraw ||
//     this.props.fontFitWindowWidth !== prevProps.fontFitWindowWidth ||
//     this.props.bbsMargin !== prevProps.bbsMargin;
//   if (needsForceRedraw) {
//     this.props.__VIEW__.redraw(true);
//   }
//   if (needsResize) {
//     this.handleResize();
//   }
// }

// const EVENT_KEY_BY_HOT_KEY = {
//   ["C".charCodeAt(0)]: "copy",
//   ["E".charCodeAt(0)]: "copyLinkUrl",
//   ["P".charCodeAt(0)]: "paste",
//   ["S".charCodeAt(0)]: "searchGoogle",
//   ["T".charCodeAt(0)]: "openUrlNewTab",
// };
