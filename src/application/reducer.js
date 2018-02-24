import URL from "url";
import { pipe, take, map, filter, share, merge, forEach } from "callbag-basics";
import makeSubject from "callbag-subject";
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
import makeWebSocketDuplex from "../callbags/webSocketDuplex";
import { mapSource, mapSink } from "../callbags/binaryDuplex";
import {
  makeMapSource as makeTelnetMapSource,
  mapSink as mapTelnetSink,
  ACTION_SEND,
  ACTION_CONV_SEND,
} from "../callbags/telnetDuplex";
import { makeMapSource as makeAnsiMapSource } from "../callbags/ansiTx";
import { makeMapSource as makeLegacyBufMapSource } from "../callbags/legacyBufTx";
import {
  LEGACY_INIT,
  WINDOW_BEFOREUNLOAD,
  WINDOW_RESIZE,
  WINDOW_FOCUS,
  WINDOW_BLUR,
  WINDOW_TOUCHSTART,
  WINDOW_CLICK,
  WINDOW_MOUSEDOWN,
  WINDOW_MOUSEUP,
  WINDOW_MOUSEOVER,
  WINDOW_MOUSEMOVE,
  WINDOW_MOUSEWHEEL,
  WINDOW_KEYDOWN,
  WINDOW_KEYPRESS,
  WINDOW_KEYUP,
  WS_CONNECTING,
  WS_CONNECTED,
  WS_DATA,
  WS_CLOSED,
  UPDATE_WATERBALL_TITLE,
  ANTI_IDLE,
  DOCUMENT_COPY,
  INPUT_PASTE,
  INPUT,
  INPUT_COMPOSITION_START,
  INPUT_COMPOSITION_END,
  SHOW_CONTEXT_MENU,
  HIDE_CONTEXT_MENU,
  DROPDOWN_MENU_COPY,
  DROPDOWN_MENU_COPY_ANSI,
  DROPDOWN_MENU_PASTE,
  DROPDOWN_MENU_SEARCH_GOOGLE,
  DROPDOWN_MENU_OPEN_URL_NEW_TAB,
  DROPDOWN_MENU_COPY_LINK_URL,
  DROPDOWN_MENU_QUICK_SEARCH,
  DROPDOWN_MENU_SELECT_ALL,
  DROPDOWN_MENU_TOGGLE_MOUSE_BROWSING,
  DROPDOWN_MENU_SHOW_INPUT_HELPER,
  DROPDOWN_MENU_SHOW_LIVE_HELPER,
  DROPDOWN_MENU_SHOW_SETTINGS,
  HIDE_INPUT_HELPER,
  HIDE_LIVE_HELPER,
  HIDE_SETTINGS,
  HIDE_PASTE_SHORTCUT_ALERT,
  HIDE_LOST_CONNECTION_ALERT,
  SHOW_DEV_MODE_ALERT,
  HIDE_DEV_MODE_ALERT,
  INPUT_HELPER_SEND,
  INPUT_HELPER_SYMBOL,
  INPUT_HELPER_RESET,
  DISABLE_LIVE_HELPER,
  LIVE_HELPER_TOGGLE_ENABLED,
  LIVE_HELPER_CHANGE_SEC,
  CHANGE_PENDING_SETTINGS,
  RESET_DEFAULT_SETTINGS,
  CHANGE_LINES,
  HIGHLIGHT_ROW,
  INIT_ER_LINES,
  APPEND_ER_LINES,
  UPDATE_ER_ACTION_LINE,
  UPDATE_CURSOR,
  MANUAL_FOCUS_INPUT,
  MANUAL_TELNET_SEND,
} from "./callbagDuplex";

const CONTROL_KEY_MAP = {
  backspace: "\b",
  tab: "\t",
  enter: "\r",
  escape: "\x1b",
  home: "\x1b[1~",
  insert: "\x1b[2~",
  delete: "\x1b[3~",
  end: "\x1b[4~",
  pageup: "\x1b[5~",
  pagedown: "\x1b[6~",
  arrowup: "\x1b[A",
  arrowdown: "\x1b[B",
  arrowright: "\x1b[C",
  arrowleft: "\x1b[D",
  // Edge.
  up: "\x1b[A",
  down: "\x1b[B",
  right: "\x1b[C",
  left: "\x1b[D",
};

const CHAR_KEY_MAP = {
  "@": 50,
  "^": 54,
  _: 109,
  "?": 127,
  "[": 219,
  "\\": 220,
  "]": 221,
  a: 1,
  b: 2,
  c: 3,
  d: 4,
  e: 5,
  f: 6,
  g: 7,
  h: 8,
  i: 9,
  j: 10,
  k: 11,
  l: 12,
  m: 13,
  n: 14,
  o: 15,
  p: 16,
  q: 17,
  r: 18,
  s: 19,
  t: 20,
  u: 21,
  v: 22,
  w: 23,
  x: 24,
  y: 25,
  z: 26,
};

Object.keys(CHAR_KEY_MAP).forEach(key => {
  CHAR_KEY_MAP[key] = String.fromCharCode(CHAR_KEY_MAP[key]);
});

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

const __SINGLETON__ = {
  idleTime: 0,
  pushthreadAutoUpdateCount: 0,
  isComposition: false,
  legacy: undefined,
};

const telnetInputSubject = makeSubject();
const telnetInputSource = share(telnetInputSubject);

export const initialState = {
  dropdownMenuRef: React.createRef(),
  inputRef: React.createRef(),
  mainRef: React.createRef(),
  containerRef: React.createRef(),

  focused: false,
  connection: 0,
  connectedUrl: undefined,
  connectedTitle: undefined,
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
    sec: -1,
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
    erLines: [],
    erActionLine: undefined,
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
  // console.log(`called reducer()`, action.type, state, singleton);
  switch (action.type) {
    case LEGACY_INIT: {
      __SINGLETON__.legacy = action.data;
      return state;
    }
    case WINDOW_BEFOREUNLOAD: {
      if (
        state.connection === 1 &&
        __SINGLETON__.legacy.bbscore.conn &&
        __SINGLETON__.legacy.buf.pageState != 0
      ) {
        action.event.returnValue = "You are currently connected. Are you sure?";
      }
      return state;
    }
    case WINDOW_RESIZE: {
      const nextScreen = getNextScreen(state);
      const nextCursor = getNextCursor(state, nextScreen);
      const nextInput = getNextInput(
        state.mainRef,
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
      __SINGLETON__.legacy.bbscore.mouse_click(event);
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
            if (__SINGLETON__.legacy.bbscore.dblclickTimer) {
              //skip
              event.preventDefault();
              event.stopPropagation();
              event.cancelBubble = true;
            }
            __SINGLETON__.legacy.bbscore.setDblclickTimer();
          }
          __SINGLETON__.legacy.bbscore.mouseLeftButtonDown = true;
          manualFocusInput(state);
          if (!window.getSelection().isCollapsed) {
            __SINGLETON__.legacy.bbscore.CmdHandler.setAttribute(
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
                telnetInputSubject(1, {
                  type: ACTION_SEND,
                  data: CONTROL_KEY_MAP.enter,
                });
                break;
              case 2:
                telnetInputSubject(1, {
                  type: ACTION_SEND,
                  data: CONTROL_KEY_MAP.arrowleft,
                });
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
          __SINGLETON__.legacy.bbscore.mouseRightButtonDown = true;
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
      __SINGLETON__.legacy.bbscore.mouse_up(action.event);
      return state;
    }
    case WINDOW_MOUSEMOVE: {
      const { event } = action;

      if (state.settings.useMouseBrowsing) {
        if (window.getSelection().isCollapsed) {
          if (!__SINGLETON__.legacy.bbscore.mouseLeftButtonDown) {
            __SINGLETON__.legacy.bbscore.onMouse_move(
              event.clientX,
              event.clientY
            );
          }
        } else {
          __SINGLETON__.legacy.buf.BBSWin.style.cursor = "auto";
          __SINGLETON__.legacy.buf.mouseCursor = 11;
        }
      }
      return state;
    }
    case WINDOW_MOUSEOVER: {
      if (state.showsSettings || state.showsPasteShortcutAlert) {
        return state;
      }
      if (
        window.getSelection().isCollapsed &&
        !__SINGLETON__.legacy.bbscore.mouseLeftButtonDown
      ) {
        manualFocusInput(state);
      }
      return state;
    }
    case WINDOW_MOUSEWHEEL: {
      if (state.showsSettings || state.showsPasteShortcutAlert) {
        return state;
      }
      // if in easyreading, use it like webpage
      if (
        __SINGLETON__.legacy.easyReading._enabled &&
        __SINGLETON__.legacy.buf.pageState == 3
      ) {
        return state;
      }
      const { value: main } = state.mainRef;
      const { value: container } = state.containerRef;
      const { event } = action;
      event.stopPropagation();
      event.preventDefault();
      const isScrollingUp = event.deltaY < 0 || event.wheelDelta > 0;
      const {
        mouseRightButtonDown,
        mouseLeftButtonDown,
      } = __SINGLETON__.legacy.bbscore;

      switch (getMouseWheelAction(
        isScrollingUp,
        mouseRightButtonDown,
        mouseLeftButtonDown,
        state.settings
      )) {
        case "MOUSE_WHEEL_ARROW_UP": {
          if (
            __SINGLETON__.legacy.easyReading._enabled &&
            __SINGLETON__.legacy.buf.startedEasyReading
          ) {
            if (main.scrollTop === 0) {
              __SINGLETON__.legacy.easyReading.leaveCurrentPost();
              telnetInputSubject(1, {
                type: ACTION_SEND,
                data: "\x1b[D\x1b[A\x1b[C",
              });
            } else {
              main.scrollTop -= state.screen.chh;
            }
          } else {
            telnetInputSubject(1, {
              type: ACTION_SEND,
              data: CONTROL_KEY_MAP.arrowup,
            });
          }
          break;
        }
        case "MOUSE_WHEEL_ARROW_DOWN": {
          if (
            __SINGLETON__.legacy.easyReading._enabled &&
            __SINGLETON__.legacy.buf.startedEasyReading
          ) {
            if (
              main.scrollTop >=
              container.clientHeight -
                state.screen.chh * __SINGLETON__.legacy.buf.rows
            ) {
              __SINGLETON__.legacy.easyReading.leaveCurrentPost();
              telnetInputSubject(1, {
                type: ACTION_SEND,
                data: CONTROL_KEY_MAP.arrowdown,
              });
            } else {
              main.scrollTop += state.screen.chh;
            }
          } else {
            telnetInputSubject(1, {
              type: ACTION_SEND,
              data: CONTROL_KEY_MAP.arrowdown,
            });
          }
          break;
        }
        case "MOUSE_WHEEL_PAGE_UP": {
          if (
            __SINGLETON__.legacy.easyReading._enabled &&
            __SINGLETON__.legacy.buf.startedEasyReading
          ) {
            main.scrollTop -=
              state.screen.chh *
              __SINGLETON__.legacy.easyReading._turnPageLines;
          } else {
            telnetInputSubject(1, {
              type: ACTION_SEND,
              data: CONTROL_KEY_MAP.pageup,
            });
          }
          break;
        }
        case "MOUSE_WHEEL_PAGE_DOWN": {
          if (
            __SINGLETON__.legacy.easyReading._enabled &&
            __SINGLETON__.legacy.buf.startedEasyReading
          ) {
            main.scrollTop +=
              state.screen.chh *
              __SINGLETON__.legacy.easyReading._turnPageLines;
          } else {
            telnetInputSubject(1, {
              type: ACTION_SEND,
              data: CONTROL_KEY_MAP.pagedown,
            });
          }
          break;
        }
        case "MOUSE_WHEEL_PREVIOUS_THREAD": {
          if (
            __SINGLETON__.legacy.easyReading._enabled &&
            __SINGLETON__.legacy.buf.startedEasyReading
          ) {
            __SINGLETON__.legacy.easyReading.leaveCurrentPost();
            telnetInputSubject(1, { type: ACTION_SEND, data: "[" });
          } else if (
            __SINGLETON__.legacy.buf.pageState === 2 ||
            __SINGLETON__.legacy.buf.pageState === 3 ||
            __SINGLETON__.legacy.buf.pageState === 4
          ) {
            telnetInputSubject(1, { type: ACTION_SEND, data: "[" });
          }
          break;
        }
        case "MOUSE_WHEEL_NEXT_THREAD": {
          if (
            __SINGLETON__.legacy.easyReading._enabled &&
            __SINGLETON__.legacy.buf.startedEasyReading
          ) {
            __SINGLETON__.legacy.easyReading.leaveCurrentPost();
            telnetInputSubject(1, { type: ACTION_SEND, data: "]" });
          } else if (
            __SINGLETON__.legacy.buf.pageState == 2 ||
            __SINGLETON__.legacy.buf.pageState == 3 ||
            __SINGLETON__.legacy.buf.pageState == 4
          ) {
            telnetInputSubject(1, { type: ACTION_SEND, data: "]" });
          }
          break;
        }
        default:
          break;
      }
      if (mouseRightButtonDown) {
        //prevent context menu popup
        __SINGLETON__.legacy.bbscore.CmdHandler.setAttribute(
          "doDOMMouseScroll",
          "1"
        );
      }
      if (mouseLeftButtonDown) {
        if (state.settings.useMouseBrowsing) {
          __SINGLETON__.legacy.bbscore.CmdHandler.setAttribute(
            "SkipMouseClick",
            "1"
          );
        }
      }
      return state;
    }
    case WINDOW_KEYDOWN: {
      const { event } = action;
      const { key, keyCode, ctrlKey, altKey, shiftKey } = event;
      if (state.connection === 2) {
        // Kills everything becase we don't want any further action performed under ConnectionAlert status
        event.preventDefault();
        event.stopImmediatePropagation();
        if (keyCode === 13) {
          return [
            state,
            applicationSubject => {
              applicationSubject(1, {
                type: WS_CONNECTING,
                data: state.connectedUrl,
              });
            },
          ];
        } else {
          return state;
        }
      }
      if (state.showsDevModeAlert) {
        if (keyCode === 13) {
          return {
            ...state,
            showsDevModeAlert: false,
          };
        }
      }
      if (skipIfMatchesKey(event)) {
        return state;
      }
      // disable auto update pushthread if any command is issued;
      if (!altKey) {
        state = onDisableLiveHelper(state);
      }
      if (keyCode > 15 && keyCode < 19) {
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
        __SINGLETON__.legacy.easyReading._enabled &&
        __SINGLETON__.legacy.buf.startedEasyReading &&
        !__SINGLETON__.legacy.buf.easyReadingShowReplyText &&
        !__SINGLETON__.legacy.buf.easyReadingShowPushInitText
      ) {
        __SINGLETON__.legacy.view.easyReadingKeyDownKeyCode = keyCode;
        __SINGLETON__.legacy.easyReading._onKeyDown(event);
        if (event.defaultPrevented) {
          return state;
        }
      }
      // Windows/Command key.
      if (event.getModifierState("Meta")) {
        return state;
      }
      const lowerCaseKey = key.toLowerCase();
      let killEvent = true;
      switch (`${ctrlKey}_${altKey}_${shiftKey}_${lowerCaseKey}`) {
        case "false_false_false_end":
        // fallthrough
        case "false_false_true_end": {
          if (
            (__SINGLETON__.legacy.buf.pageState == 2 ||
              __SINGLETON__.legacy.buf.pageState == 3) &&
            state.settings.endTurnsOnLiveUpdate
          ) {
            state = onToggleLiveHelper(state);
          } else {
            killEvent = false;
          }
          break;
        }
        case "false_false_true_insert": {
          // Shift-Insert as paste.
          killEvent = false;
          break;
        }
        case "false_false_false_backspace":
        // fallthrough
        case "false_false_true_backspace":
        // fallthrough
        case "false_false_false_tab":
        // fallthrough
        case "false_false_true_tab":
        // fallthrough
        case "false_false_false_enter":
        // fallthrough
        case "false_false_true_enter":
        // fallthrough
        case "false_false_false_escape":
        // fallthrough
        case "false_false_true_escape":
        // fallthrough
        case "false_false_false_home":
        // fallthrough
        case "false_false_true_home":
        // fallthrough
        case "false_false_false_insert":
        // fallthrough
        case "false_false_true_insert":
        // fallthrough
        case "false_false_false_delete":
        // fallthrough
        case "false_false_true_delete":
        // fallthrough
        case "false_false_false_end":
        // fallthrough
        case "false_false_true_end":
        // fallthrough
        case "false_false_false_pageup":
        // fallthrough
        case "false_false_true_pageup":
        // fallthrough
        case "false_false_false_pagedown":
        // fallthrough
        case "false_false_true_pagedown":
        // fallthrough
        case "false_false_false_arrowup":
        // fallthrough
        case "false_false_true_arrowup":
        // fallthrough
        case "false_false_false_arrowdown":
        // fallthrough
        case "false_false_true_arrowdown":
        // fallthrough
        case "false_false_false_arrowright":
        // fallthrough
        case "false_false_true_arrowright":
        // fallthrough
        case "false_false_false_arrowleft":
        // fallthrough
        case "false_false_true_arrowleft":
        // fallthrough
        case "false_false_false_up":
        // fallthrough
        case "false_false_true_up":
        // fallthrough
        case "false_false_false_down":
        // fallthrough
        case "false_false_true_down":
        // fallthrough
        case "false_false_false_right":
        // fallthrough
        case "false_false_true_right":
        // fallthrough
        case "false_false_false_left":
        // fallthrough
        case "false_false_true_left": {
          const mapped = CONTROL_KEY_MAP[lowerCaseKey];
          if (mapped) {
            if (checkDB(lowerCaseKey)) {
              telnetInputSubject(1, {
                type: ACTION_SEND,
                data: mapped + mapped,
              });
            } else {
              telnetInputSubject(1, { type: ACTION_SEND, data: mapped });
            }
          } else {
            killEvent = false;
          }
          break;
        }
        case "true_false_false_@":
        // fallthrough
        case "true_false_false_^":
        // fallthrough
        case "true_false_false__":
        // fallthrough
        case "true_false_false_?":
        // fallthrough
        case "true_false_false_[":
        // fallthrough
        case "true_false_false_\\":
        // fallthrough
        case "true_false_false_]":
        // fallthrough
        case "true_false_false_b":
        // fallthrough
        case "true_false_false_d":
        // fallthrough
        case "true_false_false_e":
        // fallthrough
        case "true_false_false_f":
        // fallthrough
        case "true_false_false_g":
        // fallthrough
        case "true_false_false_h":
        // fallthrough
        case "true_false_false_i":
        // fallthrough
        case "true_false_false_j":
        // fallthrough
        case "true_false_false_k":
        // fallthrough
        case "true_false_false_l":
        // fallthrough
        case "true_false_false_m":
        // fallthrough
        case "true_false_false_n":
        // fallthrough
        case "true_false_false_o":
        // fallthrough
        case "true_false_false_p":
        // fallthrough
        case "true_false_false_q":
        // fallthrough
        case "true_false_false_r":
        // fallthrough
        case "true_false_false_s":
        // fallthrough
        case "true_false_false_t":
        // fallthrough
        case "true_false_false_u":
        // fallthrough
        case "true_false_false_v":
        // fallthrough
        case "true_false_false_w":
        // fallthrough
        case "true_false_false_x":
        // fallthrough
        case "true_false_false_y":
        // fallthrough
        case "true_false_false_z": {
          const mapped = CHAR_KEY_MAP[lowerCaseKey];
          telnetInputSubject(1, { type: ACTION_SEND, data: mapped });
          break;
        }
        case "true_false_false_a": {
          selectAllMain(state);
          break;
        }
        case "true_false_false_c": {
          if (window.getSelection().isCollapsed) {
            const mapped = CHAR_KEY_MAP[lowerCaseKey];
            telnetInputSubject(1, { type: ACTION_SEND, data: mapped });
          } else {
            //^C , do copy
            const selectedText = window
              .getSelection()
              .toString()
              .replace(/\u00a0/g, " ");
            __SINGLETON__.legacy.bbscore.doCopy(selectedText);
          }
          break;
        }
        case "true_false_true_v": {
          state = {
            ...state,
            showsPasteShortcutAlert: true,
          };
          break;
        }
        case "false_true_false_r":
        // fallthrough
        case "false_true_false_t":
        // fallthrough
        case "false_true_false_w": {
          // Remapped keys, which conflict browser shortcuts.
          // Use lowercase no even capslock's on.
          const mapped = String.fromCharCode(
            key.toUpperCase().charCodeAt(0) - 64
          );
          telnetInputSubject(1, { type: ACTION_SEND, data: mapped });
          break;
        }
        default: {
          killEvent = false;
          break;
        }
      }
      if (killEvent) {
        event.preventDefault();
        return state;
      }
      return state;
    }
    case WINDOW_KEYPRESS: {
      const { event } = action;
      if (skipIfMatchesKey(event)) {
        return state;
      }
      // Firefox on Mac issues keyCode for the key that starts composition (while
      // other browsers send 229), so a normal char is handled using keypress. We
      // can't move all key handling here since ctrl- and alt-compounds are
      // handled by browsers before keypress.
      if (!event.ctrlKey && !event.altKey && event.key.length == 1) {
        event.preventDefault();
        telnetInputSubject(1, {
          type: ACTION_SEND,
          data: event.key,
        });
      }
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
    case WS_CONNECTING: {
      const connectedUrl = action.data;
      const parsed = URL.parse(connectedUrl);

      let webSocketUrl;
      switch (parsed.protocol) {
        case "wsstelnet:": {
          webSocketUrl = `wss://${parsed.host}${parsed.path}`;
          break;
        }
        case "wstelnet:": {
          webSocketUrl = `ws://${parsed.host}${parsed.path}`;
          break;
        }
        default: {
          console.log(`unsupport connect url protocol: ${parsed.protocol}`);
          return state;
        }
      }
      console.log(`webSocketUrl: ${webSocketUrl}`);
      return [
        {
          ...state,
          connection: 0,
          connectedUrl,
          connectedTitle: parsed.hostname,
        },
        applicationSubject => {
          const { source, forEachSink } = makeWebSocketDuplex({ webSocketUrl });
          pipe(telnetInputSource, mapTelnetSink, mapSink, forEachSink);

          const telnetOutputSource = pipe(
            source,
            mapSource,
            makeTelnetMapSource({ telnetSubject: telnetInputSubject }),
            share
          );
          const bufOutputSource = pipe(
            telnetOutputSource,
            makeAnsiMapSource(),
            makeLegacyBufMapSource({ buf: __SINGLETON__.legacy.buf }),
            share
          );
          const onCloseSubject = makeSubject();
          bufOutputSource(0, t => {
            if (t === 2) {
              onCloseSubject(1, {
                type: WS_CLOSED,
              });
            }
          });
          return pipe(
            merge(
              pipe(bufOutputSource, map(() => undefined), filter(it => it)),
              pipe(
                bufOutputSource,
                take(1),
                map(() => ({
                  type: WS_CONNECTED,
                }))
              ),
              pipe(
                telnetOutputSource,
                map(data => ({
                  type: WS_DATA,
                  data,
                }))
              ),
              onCloseSubject
            ),
            forEach(action => {
              applicationSubject(1, action);
            })
          );
        },
      ];
    }
    case WS_CONNECTED: {
      __SINGLETON__.idleTime = 0;

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
      __SINGLETON__.idleTime = 0;

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
          document.title = state.connectedTitle;
        }
      } catch (e) {}
      return state;
    }
    case ANTI_IDLE: {
      if (state.connection === 1) {
        if (state.antiIdleTime && __SINGLETON__.idleTime > state.antiIdleTime) {
          telnetInputSubject(1, { type: ACTION_SEND, data: ANTI_IDLE_STR });
          __SINGLETON__.idleTime = 0;
        } else {
          __SINGLETON__.idleTime += 1;
        }
        __SINGLETON__.legacy.buf.blinkOn = true;
        __SINGLETON__.legacy.buf.queueUpdate(true);

        if (state.liveHelper.enabled && state.liveHelper.sec !== -1) {
          ++__SINGLETON__.pushthreadAutoUpdateCount;
          if (__SINGLETON__.pushthreadAutoUpdateCount >= state.liveHelper.sec) {
            __SINGLETON__.pushthreadAutoUpdateCount = 0;

            if (
              __SINGLETON__.legacy.buf.pageState === 3 ||
              __SINGLETON__.legacy.buf.pageState === 2
            ) {
              //this.conn.send('qrG');
              telnetInputSubject(1, {
                type: ACTION_SEND,
                data: "\x1b[D\x1b[C\x1b[4~",
              });
            }
          }
        }
      }
      return state;
    }
    case DOCUMENT_COPY: {
      const { event } = action;
      if (__SINGLETON__.legacy.bbscore.strToCopy) {
        event.clipboardData.setData(
          "text",
          __SINGLETON__.legacy.bbscore.strToCopy
        );
        event.preventDefault();
        console.log("copied: ", __SINGLETON__.legacy.bbscore.strToCopy);
        __SINGLETON__.legacy.bbscore.strToCopy = null;
      }
      return state;
    }
    case INPUT_PASTE: {
      const { event } = action;
      const content = event.clipboardData.getData("text");
      if (content) {
        event.preventDefault();
        telnetInputSubject(1, {
          type: ACTION_CONV_SEND,
          data: reformatPaste(content, state.settings.lineWrap),
        });
      }
      return state;
    }
    case INPUT: {
      return onInput(state);
    }
    case INPUT_COMPOSITION_START: {
      __SINGLETON__.isComposition = true;
      const nextInput = getNextInput(
        state.mainRef,
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
      __SINGLETON__.isComposition = false;
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

      const { CmdHandler } = __SINGLETON__.legacy.bbscore;
      if (CmdHandler.getAttribute("doDOMMouseScroll") === "1") {
        CmdHandler.setAttribute("doDOMMouseScroll", "0");
      }
      // just in case the selection get de-selected
      if (window.getSelection().isCollapsed) {
        __SINGLETON__.legacy.bbscore.lastSelection = null;
      } else {
        __SINGLETON__.legacy.bbscore.lastSelection = __SINGLETON__.legacy.view.getSelectionColRow();
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
      __SINGLETON__.legacy.bbscore.doCopy(state.dropdown.selectedText);
      return {
        ...state,
        showsContextMenu: false,
      };
    }
    case DROPDOWN_MENU_COPY_ANSI: {
      __SINGLETON__.legacy.bbscore.doCopyAnsi();
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
      __SINGLETON__.legacy.bbscore.doCopy(state.dropdown.contextOnUrl);
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
      selectAllMain(state);
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
      // getNextInput(mainRef, settings, screen, input)
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
        __SINGLETON__.legacy.buf.pageState == 6
      ) {
        // something selected
        const sel = __SINGLETON__.legacy.view.getSelectionColRow();
        let y = __SINGLETON__.legacy.buf.cur_y;
        let selCmd = "";
        // move cursor to end and send reset code
        selCmd += "\x1b[H";
        if (y > sel.end.row) {
          selCmd += CONTROL_KEY_MAP.arrowup.repeat(y - sel.end.row);
        } else if (y < sel.end.row) {
          selCmd += CONTROL_KEY_MAP.arrowdown.repeat(sel.end.row - y);
        }
        var repeats = __SINGLETON__.legacy.buf.getRowText(
          sel.end.row,
          0,
          sel.end.col
        ).length;
        selCmd += CONTROL_KEY_MAP.arrowright.repeat(repeats) + "\x15[m";

        // move cursor to start and send color code
        y = sel.end.row;
        selCmd += "\x1b[H";
        if (y > sel.start.row) {
          selCmd += CONTROL_KEY_MAP.arrowup.repeat(y - sel.start.row);
        } else if (y < sel.start.row) {
          selCmd += CONTROL_KEY_MAP.arrowdown.repeat(sel.start.row - y);
        }
        repeats = __SINGLETON__.legacy.buf.getRowText(
          sel.start.row,
          0,
          sel.start.col
        ).length;
        selCmd += CONTROL_KEY_MAP.arrowright.repeat(repeats);
        cmd = selCmd + cmd;
      }
      telnetInputSubject(1, { type: ACTION_SEND, data: cmd });
      return state;
    }
    case INPUT_HELPER_SYMBOL: {
      telnetInputSubject(1, { type: ACTION_CONV_SEND, data: action.data });
      return state;
    }
    case INPUT_HELPER_RESET: {
      telnetInputSubject(1, { type: ACTION_SEND, data: "\x15[m" });
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
      if (state.connection !== 2) {
        return state;
      }
      return [
        state,
        applicationSubject => {
          applicationSubject(1, {
            type: WS_CONNECTING,
            data: state.connectedUrl,
          });
        },
      ];
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
          erLines: [],
          erActionLine: undefined,
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
    case INIT_ER_LINES: {
      return {
        ...state,
        screen: {
          ...state.screen,
          erLines: cloneERLines(action.data),
          erActionLine: undefined,
        },
      };
    }
    case APPEND_ER_LINES: {
      return {
        ...state,
        screen: {
          ...state.screen,
          erLines: [...state.screen.erLines, ...cloneERLines(action.data)],
        },
      };
    }
    case UPDATE_ER_ACTION_LINE: {
      return {
        ...state,
        screen: {
          ...state.screen,
          erActionLine: cloneERRow(action.data),
        },
      };
    }
    case UPDATE_CURSOR: {
      const nextCursor = getNextCursor(state, state.screen);
      const nextInput = getNextInput(
        state.mainRef,
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
    case MANUAL_TELNET_SEND: {
      telnetInputSubject(1, {
        type: action.conv ? ACTION_CONV_SEND : ACTION_SEND,
        data: action.data,
      });
      return state;
    }
    default: {
      return state;
    }
  }
}

const ESC_CHAR = "\x15"; // Ctrl-U
const ANTI_IDLE_STR = "\x1b\x1b";

function reformatPaste(text, lineWrap) {
  text = text.replace(/\r\n/g, CONTROL_KEY_MAP.enter);
  text = text.replace(/\n/g, CONTROL_KEY_MAP.enter);
  text = text.replace(/\r/g, CONTROL_KEY_MAP.enter);

  if (text.indexOf(CONTROL_KEY_MAP.escape) < 0 && lineWrap > 0) {
    text = wrapText(text, lineWrap, CONTROL_KEY_MAP.enter);
  }

  //FIXME: stop user from pasting DBCS words with 2-color
  text = text.replace(/\x1b/g, ESC_CHAR);
  return text;
}

function manualFocusInput(state) {
  if (
    !state.inputRef.value ||
    state.showsSettings ||
    state.showsPasteShortcutAlert ||
    (__SINGLETON__.legacy.bbscore.touch &&
      __SINGLETON__.legacy.bbscore.touch.touchStarted)
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
      Math.floor(width / (chw * __SINGLETON__.legacy.buf.cols + 10) * 100) /
      100,
    scaleY:
      Math.floor(height / (chh * __SINGLETON__.legacy.buf.rows) * 100) / 100,
  };
}

function getNextScreen(state) {
  const { bbsMargin, fontFitWindowWidth } = state.settings;
  const innerBounds = getInnerBounds(bbsMargin);
  const { chh, chw } = getCharSizing(state.screen, innerBounds);

  const mainWidth = chw * __SINGLETON__.legacy.buf.cols + 10;
  const mainMarginTop =
    chh * __SINGLETON__.legacy.buf.rows < innerBounds.height
      ? (innerBounds.height - chh * __SINGLETON__.legacy.buf.rows) / 2 +
        bbsMargin
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

function getFirstGridOffsets(mainRef) {
  const value = mainRef.value || {};
  return {
    top: value.offsetTop,
    left: value.offsetLeft,
  };
}

function convertMN2XYEx(
  bbsMargin,
  mainRef,
  { innerBounds: { width, height }, scaleX, scaleY, chw, chh },
  cx,
  cy
) {
  let origin;
  if (scaleX !== 1 || scaleY !== 1) {
    origin = [
      (width - (chw * __SINGLETON__.legacy.buf.cols + 10) * scaleX) / 2 +
        bbsMargin,
      (height - chh * __SINGLETON__.legacy.buf.rows * scaleY) / 2 + bbsMargin,
    ];
  } else {
    const firstGridOffset = getFirstGridOffsets(mainRef);
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
    state.mainRef,
    nextScreen,
    __SINGLETON__.legacy.buf.cur_x,
    __SINGLETON__.legacy.buf.cur_y
  );
  // if you want to set cursor color by now background, use this.props.__VIEW__.
  if (
    __SINGLETON__.legacy.buf.cur_y >= __SINGLETON__.legacy.buf.rows ||
    __SINGLETON__.legacy.buf.cur_x >= __SINGLETON__.legacy.buf.cols
  ) {
    return state.cursor; //sometimes, the value of singleton.legacy.buf.cur_x is 80 :(
  }

  const lines = __SINGLETON__.legacy.buf.lines;
  const line = lines[__SINGLETON__.legacy.buf.cur_y];
  const ch = line[__SINGLETON__.legacy.buf.cur_x];
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
  if (__SINGLETON__.isComposition) {
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
    __SINGLETON__.legacy.easyReading._enabled &&
    __SINGLETON__.legacy.buf.startedEasyReading &&
    !__SINGLETON__.legacy.buf.easyReadingShowReplyText &&
    !__SINGLETON__.legacy.buf.easyReadingShowPushInitText &&
    __SINGLETON__.legacy.easyReadingKeyDownKeyCode == 229 &&
    input.value != "X"
  ) {
    // only use on chinese IME
    input.value = "";
    return state;
  }
  if (input.value) {
    telnetInputSubject(1, {
      type: ACTION_CONV_SEND,
      data: input.value,
    });
  }
  input.value = "";
  return state;
}

function getNextInput(mainRef, settings, screen, input) {
  if (__SINGLETON__.isComposition) {
    const position = convertMN2XYEx(
      settings.bbsMargin,
      mainRef,
      screen,
      __SINGLETON__.legacy.buf.cur_x,
      __SINGLETON__.legacy.buf.cur_y
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

const DBCS_DETECT = true;

function checkDB(key) {
  switch (key) {
    case "backspace":
    case "arrowleft": {
      if (DBCS_DETECT && __SINGLETON__.legacy.buf.cur_x > 1) {
        const lines = __SINGLETON__.legacy.buf.lines;
        const line = lines[__SINGLETON__.legacy.buf.cur_y];
        const ch = line[__SINGLETON__.legacy.buf.cur_x - 2];
        return ch.isLeadByte;
      }
      return false;
    }
    case "delete":
    case "arrowright": {
      if (DBCS_DETECT) {
        // && __SINGLETON__.legacy.buf.cur_x<__SINGLETON__.legacy.buf.cols-2){
        const lines = __SINGLETON__.legacy.buf.lines;
        const line = lines[__SINGLETON__.legacy.buf.cur_y];
        const ch = line[__SINGLETON__.legacy.buf.cur_x];
        return ch.isLeadByte;
      }
      return false;
    }
  }
  return false;
}

function selectAllMain(state) {
  const { value } = state.mainRef;
  window.getSelection().selectAllChildren(value);
}

const MOUSE_WHEEL_UP_ACTIONS = [
  "NONE",
  "MOUSE_WHEEL_ARROW_UP",
  "MOUSE_WHEEL_PAGE_UP",
  "MOUSE_WHEEL_PREVIOUS_THREAD",
];
const MOUSE_WHEEL_DOWN_ACTIONS = [
  "NONE",
  "MOUSE_WHEEL_ARROW_DOWN",
  "MOUSE_WHEEL_PAGE_DOWN",
  "MOUSE_WHEEL_NEXT_THREAD",
];

function getMouseWheelAction(
  isScrollingUp,
  mouseRightButtonDown,
  mouseLeftButtonDown,
  settings
) {
  if (isScrollingUp) {
    if (mouseRightButtonDown) {
      return MOUSE_WHEEL_UP_ACTIONS[settings.mouseWheelFunction2];
    } else if (mouseLeftButtonDown) {
      return MOUSE_WHEEL_UP_ACTIONS[settings.mouseWheelFunction3];
    } else {
      return MOUSE_WHEEL_UP_ACTIONS[settings.mouseWheelFunction1];
    }
  } else {
    if (mouseRightButtonDown) {
      return MOUSE_WHEEL_DOWN_ACTIONS[settings.mouseWheelFunction2];
    } else if (mouseLeftButtonDown) {
      return MOUSE_WHEEL_DOWN_ACTIONS[settings.mouseWheelFunction3];
    } else {
      return MOUSE_WHEEL_DOWN_ACTIONS[settings.mouseWheelFunction1];
    }
  }
}

function cloneERRow(row) {
  return row.map(char => char.clone());
}

function cloneERLines(lines) {
  return lines.map(cloneERRow);
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
  if (__SINGLETON__.isComposition && !event.ctrlKey && !event.altKey) {
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
//     } else {
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
