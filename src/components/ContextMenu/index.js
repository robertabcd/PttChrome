import $ from "jquery";
import cx from "classnames";
import React from "react";
import { compose, withStateHandlers, withProps, lifecycle } from "recompose";
import { MenuItem } from "react-bootstrap";
import { i18n } from "../../js/i18n";
import DropdownMenu from "./DropdownMenu";
import InputHelperModal from "./InputHelperModal";
import LiveHelperModal from "./LiveHelperModal";
import PrefModal from "./PrefModal";

function noop() {}

const EVENT_KEY_BY_HOT_KEY = {
  ["C".charCodeAt(0)]: "copy",
  ["E".charCodeAt(0)]: "copyLinkUrl",
  ["P".charCodeAt(0)]: "paste",
  ["S".charCodeAt(0)]: "searchGoogle",
  ["T".charCodeAt(0)]: "openUrlNewTab"
};

const menuHandlerByEventKey = {
  copy: (pttchrome, { selectedText }) => pttchrome.doCopy(selectedText),
  copyAnsi: pttchrome => pttchrome.doCopyAnsi(),
  paste: pttchrome => pttchrome.doPaste(),
  searchGoogle: (pttchrome, { selectedText }) =>
    pttchrome.doSearchGoogle(selectedText),
  openUrlNewTab: (pttchrome, { aElement }) =>
    pttchrome.doOpenUrlNewTab(aElement),
  copyLinkUrl: (pttchrome, { contextOnUrl }) => pttchrome.doCopy(contextOnUrl),
  selectAll: pttchrome => pttchrome.doSelectAll(),
  mouseBrowsing: pttchrome => pttchrome.switchMouseBrowsing()
};

const onPrefSaveImpl = (pttchrome, values) => {
  pttchrome.onValuesPrefChange(values);
  pttchrome.modalShown = false;
  pttchrome.setInputAreaFocus();
  pttchrome.switchToEasyReadingMode(pttchrome.view.useEasyReadingMode);

  return {
    showsSettings: false
  };
};

const initialState = {
  // --- Menu state ---
  open: false,
  pageX: 0,
  pageY: 0,
  contextOnUrl: "",
  aElement: undefined,
  selectedText: "",
  urlEnabled: false,
  normalEnabled: false,
  selEnabled: false,
  // --- Modal state ---
  showsInputHelper: false,
  showsLiveArticleHelper: false,
  showsSettings: false,
  // --- LiveHelper state ---
  liveHelperEnabled: false,
  liveHelperSec: 1
};

const enhance = compose(
  withStateHandlers(initialState, {
    onContextMenu: (state, { pttchrome }) => event => {
      event.stopPropagation();
      event.preventDefault();
      const { CmdHandler } = pttchrome;
      const doDOMMouseScroll =
        CmdHandler.getAttribute("doDOMMouseScroll") === "1";
      if (doDOMMouseScroll) {
        CmdHandler.setAttribute("doDOMMouseScroll", "0");
        return;
      }
      pttchrome.contextMenuShown = true;
      // just in case the selection get de-selected
      if (window.getSelection().isCollapsed) {
        pttchrome.lastSelection = null;
      } else {
        pttchrome.lastSelection = pttchrome.view.getSelectionColRow();
      }

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
        open,
        pageX: event.pageX,
        pageY: event.pageY,
        contextOnUrl,
        aElement,
        selectedText,
        urlEnabled,
        normalEnabled,
        selEnabled
      };
    },

    onHide: (state, { pttchrome }) => () => {
      if (state.open) {
        pttchrome.contextMenuShown = false;
        return initialState;
      }
    },

    onMenuSelect: (state, { pttchrome }) => (eventKey, event) => {
      menuHandlerByEventKey[eventKey](pttchrome, state);
      event.stopPropagation();
      pttchrome.contextMenuShown = false;
      return initialState;
    },

    onInputHelperClick: (state, { pttchrome }) => event => {
      event.stopPropagation();
      pttchrome.contextMenuShown = false;
      return {
        ...initialState,
        showsInputHelper: true
      };
    },

    onLiveArticleHelperClick: (state, { pttchrome }) => event => {
      event.stopPropagation();
      pttchrome.contextMenuShown = false;
      return {
        ...initialState,
        showsLiveArticleHelper: true
      };
    },

    onSettingsClick: (state, { pttchrome }) => event => {
      event.stopPropagation();
      pttchrome.contextMenuShown = false;
      pttchrome.onDisableLiveHelperModalState();
      pttchrome.modalShown = true;
      return {
        ...initialState,
        showsSettings: true
      };
    },

    onQuickSearchSelect: (state, { pttchrome, selectedText }) => (
      eventKey,
      event
    ) => {
      const url = eventKey.replace("%s", selectedText);
      window.open(url);
      event.stopPropagation();
      pttchrome.contextMenuShown = false;
      return initialState;
    },

    onInputHelperHide: (state, { pttchrome }) => () => {
      return {
        showsInputHelper: false
      };
    },
    onInputHelperReset: (state, { pttchrome }) => () => {
      pttchrome.conn.send("\x15[m");
    },
    onInputHelperCmdSend: (state, { pttchrome }) => cmd => {
      if (!window.getSelection().isCollapsed && pttchrome.buf.pageState == 6) {
        // something selected
        var sel = pttchrome.view.getSelectionColRow();
        var y = pttchrome.buf.cur_y;
        var selCmd = "";
        // move cursor to end and send reset code
        selCmd += "\x1b[H";
        if (y > sel.end.row) {
          selCmd += "\x1b[A".repeat(y - sel.end.row);
        } else if (y < sel.end.row) {
          selCmd += "\x1b[B".repeat(sel.end.row - y);
        }
        var repeats = pttchrome.buf.getRowText(sel.end.row, 0, sel.end.col)
          .length;
        selCmd += "\x1b[C".repeat(repeats) + "\x15[m";

        // move cursor to start and send color code
        y = sel.end.row;
        selCmd += "\x1b[H";
        if (y > sel.start.row) {
          selCmd += "\x1b[A".repeat(y - sel.start.row);
        } else if (y < sel.start.row) {
          selCmd += "\x1b[B".repeat(sel.start.row - y);
        }
        repeats = pttchrome.buf.getRowText(sel.start.row, 0, sel.start.col)
          .length;
        selCmd += "\x1b[C".repeat(repeats);
        cmd = selCmd + cmd;
      }
      pttchrome.conn.send(cmd);
    },
    onInputHelperConvSend: (state, { pttchrome }) => value => {
      pttchrome.conn.convSend(value);
    },

    onLiveHelperHide: (state, { pttchrome }) => nextState => {
      pttchrome.setAutoPushthreadUpdate(-1);
      return {
        showsLiveArticleHelper: false,
        liveHelperEnabled: false
      };
    },
    onLiveHelperChange: (state, { pttchrome }) => nextState => {
      if (nextState.enabled) {
        // cancel easy reading mode first
        pttchrome.view.useEasyReadingMode = false;
        pttchrome.switchToEasyReadingMode();
        pttchrome.setAutoPushthreadUpdate(nextState.sec);
      } else {
        pttchrome.setAutoPushthreadUpdate(-1);
      }
      return {
        liveHelperEnabled: nextState.enabled,
        liveHelperSec: nextState.sec
      };
    },

    onPrefSave: (state, { pttchrome }) => values => {
      return onPrefSaveImpl(pttchrome, values);
    },
    onPrefReset: (state, { pttchrome }) => values => {
      pttchrome.view.redraw(true);
      return onPrefSaveImpl(pttchrome, values);
    }
  }),
  withProps(({ pttchrome, liveHelperEnabled, onLiveHelperChange }) => {
    // FIXME: side effect
    if (liveHelperEnabled) {
      pttchrome.onToggleLiveHelperModalState = () => {
        onLiveHelperChange({
          enabled: !state.enabled,
          sec: state.sec
        });
      };
      pttchrome.onDisableLiveHelperModalState = () => {
        onLiveHelperChange({
          enabled: false,
          sec: state.sec
        });
      };
    } else {
      pttchrome.onToggleLiveHelperModalState = pttchrome.onDisableLiveHelperModalState = noop;
    }
  }),
  lifecycle({
    componentDidMount() {
      this.contextMenuHandler = event => {
        this.props.onContextMenu(event);
      };
      document
        .getElementById("BBSWindow")
        .addEventListener("contextmenu", this.contextMenuHandler, true);

      this.clickHandler = () => {
        this.props.onHide();
      };
      window.addEventListener("click", this.clickHandler, false);

      this.touchStartHandler = event => {
        if (event.target.getAttribute("role") === "menuitem") {
          return;
        }
        this.props.onHide();
      };
      window.addEventListener("touchstart", this.touchStartHandler, false);

      this.hotKeyUpHandler = event => {
        if (!this.props.open) {
          return;
        }
        event.preventDefault();
        event.stopPropagation();
        if (event.altKey || event.ctrlKey || event.shiftKey) {
          return;
        }
        const eventKey = EVENT_KEY_BY_HOT_KEY[event.keyCode];
        if (eventKey) {
          this.props.onMenuSelect(eventKey, event);
        }
      };
      window.addEventListener("keyup", this.hotKeyUpHandler, false);
    },
    componentWillUnmount() {
      window.removeEventListener("keyup", this.hotKeyUpHandler, false);
      window.removeEventListener("touchstart", this.touchStartHandler, false);
      window.removeEventListener("click", this.clickHandler, false);
      document.BBSWindow.removeEventListener(
        "keyup",
        this.contextMenuHandler,
        false
      );
    }
  })
);

export const ContextMenu = ({
  pttchrome,
  //
  pageX,
  pageY,
  open,
  urlEnabled,
  normalEnabled,
  selEnabled,
  selectedText,
  onMenuSelect,
  onInputHelperClick,
  onLiveArticleHelperClick,
  onSettingsClick,
  onQuickSearchSelect,
  //
  showsInputHelper,
  showsLiveArticleHelper,
  showsSettings,
  //
  liveHelperEnabled,
  liveHelperSec,
  onInputHelperHide,
  onInputHelperReset,
  onInputHelperCmdSend,
  onInputHelperConvSend,
  onLiveHelperHide,
  onLiveHelperChange,
  onPrefSave,
  onPrefReset
}) => (
  <React.Fragment>
    <div
      className={cx({
        open
      })}
    >
      <DropdownMenu
        pageX={pageX}
        pageY={pageY}
        urlEnabled={urlEnabled}
        normalEnabled={normalEnabled}
        selEnabled={selEnabled}
        mouseBrowsingEnabled={pttchrome.buf.useMouseBrowsing}
        selectedText={selectedText}
        onMenuSelect={onMenuSelect}
        onInputHelperClick={onInputHelperClick}
        onLiveArticleHelperClick={onLiveArticleHelperClick}
        onSettingsClick={onSettingsClick}
        onQuickSearchSelect={onQuickSearchSelect}
      />
    </div>
    <InputHelperModal
      show={showsInputHelper}
      onHide={onInputHelperHide}
      onReset={onInputHelperReset}
      onCmdSend={onInputHelperCmdSend}
      onConvSend={onInputHelperConvSend}
    />
    <LiveHelperModal
      show={showsLiveArticleHelper}
      onHide={onLiveHelperHide}
      enabled={liveHelperEnabled}
      sec={liveHelperSec}
      onChange={onLiveHelperChange}
    />
    <PrefModal show={showsSettings} onSave={onPrefSave} onReset={onPrefReset} />
  </React.Fragment>
);

export default enhance(ContextMenu);
