import { createSelector, createStructuredSelector } from "reselect";
import cx from "classnames";
import React from "react";
import { MenuItem } from "react-bootstrap";
import { i18n } from "../../js/i18n";
import { CallbagConsumer } from "../Callbag";
import {
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
} from "../reducer";
import "./DropdownMenu.css";

const normalizeSelectedText = selectedText => {
  if (selectedText.length > 15) {
    return `${selectedText.substr(0, 15)} …`;
  }
  return selectedText;
};

const QUICK_SEARCH = {
  providers: [
    {
      name: "goo.gl",
      url: "https://goo.gl/%s",
    },
  ],
};

export const DropdownMenu = ({
  dropdownMenuRef,
  showsContextMenu,
  dropdown,
  useMouseBrowsing,
  dispatch,
}) => (
  <React.Fragment>
    <style>
      {`
.DropdownMenu {
  top:${dropdown.top}px;
  left:${dropdown.left}px;
}
          `}
    </style>
    <div
      className={cx({
        open: showsContextMenu,
      })}
    >
      <ul
        className="dropdown-menu DropdownMenu DropdownMenu--reset"
        ref={dropdownMenuRef}
        onContextMenu={event => {
          event.stopPropagation();
          event.preventDefault();
        }}
      >
        {dropdown.selEnabled && (
          <React.Fragment>
            <MenuItem
              eventKey="copy"
              onSelect={(eventKey, event) => {
                event.stopPropagation();
                dispatch(DROPDOWN_MENU_COPY);
              }}
            >
              {i18n("cmenu_copy")}
              <span className="DropdownMenu__Item__HotKey">Ctrl+C</span>
            </MenuItem>
            <MenuItem
              eventKey="copyAnsi"
              onSelect={(eventKey, event) => {
                event.stopPropagation();
                dispatch(DROPDOWN_MENU_COPY_ANSI);
              }}
            >
              {i18n("cmenu_copyAnsi")}
            </MenuItem>
          </React.Fragment>
        )}
        {dropdown.normalEnabled && (
          <MenuItem
            eventKey="paste"
            onSelect={(eventKey, event) => {
              event.stopPropagation();
              dispatch(DROPDOWN_MENU_PASTE);
            }}
          >
            {i18n("cmenu_paste")}
            <span className="DropdownMenu__Item__HotKey">Shift+Insert</span>
          </MenuItem>
        )}
        {dropdown.selEnabled && (
          <MenuItem
            eventKey="searchGoogle"
            onSelect={(eventKey, event) => {
              event.stopPropagation();
              dispatch(DROPDOWN_MENU_SEARCH_GOOGLE);
            }}
          >
            {i18n("cmenu_searchGoogle")}{" "}
            <span>'{normalizeSelectedText(dropdown.selectedText)}'</span>
          </MenuItem>
        )}
        {dropdown.urlEnabled && (
          <React.Fragment>
            <MenuItem
              eventKey="openUrlNewTab"
              onSelect={(eventKey, event) => {
                event.stopPropagation();
                dispatch(DROPDOWN_MENU_OPEN_URL_NEW_TAB);
              }}
            >
              {i18n("cmenu_openUrlNewTab")}
            </MenuItem>
            <MenuItem
              eventKey="copyLinkUrl"
              onSelect={(eventKey, event) => {
                event.stopPropagation();
                dispatch(DROPDOWN_MENU_COPY_LINK_URL);
              }}
            >
              {i18n("cmenu_copyLinkUrl")}
            </MenuItem>
          </React.Fragment>
        )}
        <MenuItem divider />
        {dropdown.selEnabled && (
          <React.Fragment>
            <MenuItem className="DropdownMenu__Item--quickSearch">
              {i18n("cmenu_quickSearch")}{" "}
              <span style={{ float: "right" }}>&#9658;</span>
              <ul
                className={cx(
                  "dropdown-menu",
                  "DropdownMenu--reset",
                  "QuickSearchMenu",
                  {
                    "QuickSearchMenu--up":
                      dropdown.pageY > window.innerHeight / 2,
                    "QuickSearchMenu--left":
                      dropdown.pageX > window.innerWidth * 0.7,
                  }
                )}
                role="menu"
              >
                {QUICK_SEARCH.providers.map(p => (
                  <MenuItem
                    key={p.url}
                    eventKey={p.url}
                    onSelect={(eventKey, event) => {
                      event.stopPropagation();
                      // TODO: const url = eventKey.replace("%s", selectedText);
                      dispatch({
                        type: DROPDOWN_MENU_QUICK_SEARCH,
                        data: url,
                      });
                    }}
                  >
                    {p.name}
                  </MenuItem>
                ))}
              </ul>
            </MenuItem>
            <MenuItem divider />
          </React.Fragment>
        )}
        {dropdown.normalEnabled && (
          <React.Fragment>
            <MenuItem
              eventKey="selectAll"
              onSelect={(eventKey, event) => {
                event.stopPropagation();
                dispatch(DROPDOWN_MENU_SELECT_ALL);
              }}
            >
              {i18n("cmenu_selectAll")}
              <span className="DropdownMenu__Item__HotKey">Ctrl+A</span>
            </MenuItem>
            <MenuItem
              eventKey="mouseBrowsing"
              onSelect={(eventKey, event) => {
                event.stopPropagation();
                dispatch(DROPDOWN_MENU_TOGGLE_MOUSE_BROWSING);
              }}
              className={cx({
                "DropdownMenu__Item--checked": useMouseBrowsing,
              })}
            >
              {i18n("cmenu_mouseBrowsing")}
            </MenuItem>
            <MenuItem
              onClick={event => {
                event.stopPropagation();
                dispatch(DROPDOWN_MENU_SHOW_INPUT_HELPER);
              }}
            >
              {i18n("cmenu_showInputHelper")}
            </MenuItem>
            <MenuItem
              onClick={event => {
                event.stopPropagation();
                dispatch(DROPDOWN_MENU_SHOW_LIVE_HELPER);
              }}
            >
              {i18n("cmenu_showLiveArticleHelper")}
            </MenuItem>
            <MenuItem divider />
          </React.Fragment>
        )}
        <MenuItem
          onClick={event => {
            event.stopPropagation();
            dispatch(DROPDOWN_MENU_SHOW_SETTINGS);
          }}
        >
          {i18n("cmenu_settings")}
        </MenuItem>
      </ul>
    </div>
  </React.Fragment>
);

const children = createSelector(
  createStructuredSelector({
    dropdownMenuRef: ({ state }) => state.dropdownMenuRef,
    showsContextMenu: ({ state }) => state.showsContextMenu,
    dropdown: ({ state }) => state.dropdown,
    useMouseBrowsing: ({ state }) => state.settings.useMouseBrowsing,
    dispatch: ({ dispatch }) => dispatch,
  }),
  props => <DropdownMenu {...props} />
);

export const constElement = <CallbagConsumer>{children}</CallbagConsumer>;
