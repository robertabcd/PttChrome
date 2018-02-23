import cx from "classnames";
import React from "react";
import { compose, lifecycle, withHandlers } from "recompose";
import { MenuItem } from "react-bootstrap";
import { i18n } from "../../js/i18n";
import "./DropdownMenu.css";

const top = (mouseHeight, menuHeight) => {
  const pageHeight = window.innerHeight;

  // opening menu would pass the bottom of the page
  if (mouseHeight + menuHeight > pageHeight && menuHeight < mouseHeight) {
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

const enhance = compose(
  withHandlers(() => {
    const refs = {};

    return {
      onDropdownMenuMount: () => ref => {
        refs.dropdownMenu = ref;
      },
      onMousePositionChange: ({ pageX, pageY }) => () => {
        refs.dropdownMenu.style.cssText += `
          top:${top(pageY, refs.dropdownMenu.clientHeight)}px;
          left:${left(pageX, refs.dropdownMenu.clientWidth)}px;
        `;
      },
      onContextMenu: () => event => {
        event.stopPropagation();
        event.preventDefault();
      },
    };
  }),
  lifecycle({
    componentDidMount() {
      this.props.onMousePositionChange();
    },
    componentDidUpdate(prevProps) {
      if (
        this.props.pageX !== prevProps.pageX ||
        this.props.pageY !== prevProps.pageY
      ) {
        this.props.onMousePositionChange();
      }
    },
  })
);

export const DropdownMenu = ({
  pageX,
  pageY,
  urlEnabled,
  normalEnabled,
  selEnabled,
  mouseBrowsingEnabled,
  selectedText,
  onMenuSelect,
  onInputHelperClick,
  onLiveArticleHelperClick,
  onSettingsClick,
  onQuickSearchSelect,
  //
  onDropdownMenuMount,
  onContextMenu,
}) => (
  <ul
    className="dropdown-menu DropdownMenu--reset"
    ref={onDropdownMenuMount}
    onContextMenu={onContextMenu}
  >
    {selEnabled && (
      <React.Fragment>
        <MenuItem eventKey="copy" onSelect={onMenuSelect}>
          {i18n("cmenu_copy")}
          <span className="DropdownMenu__Item__HotKey">Ctrl+C</span>
        </MenuItem>
        <MenuItem eventKey="copyAnsi" onSelect={onMenuSelect}>
          {i18n("cmenu_copyAnsi")}
        </MenuItem>
      </React.Fragment>
    )}
    {normalEnabled && (
      <MenuItem eventKey="paste" onSelect={onMenuSelect}>
        {i18n("cmenu_paste")}
        <span className="DropdownMenu__Item__HotKey">Shift+Insert</span>
      </MenuItem>
    )}
    {selEnabled && (
      <MenuItem eventKey="searchGoogle" onSelect={onMenuSelect}>
        {i18n("cmenu_searchGoogle")}{" "}
        <span>'{normalizeSelectedText(selectedText)}'</span>
      </MenuItem>
    )}
    {urlEnabled && (
      <React.Fragment>
        <MenuItem eventKey="openUrlNewTab" onSelect={onMenuSelect}>
          {i18n("cmenu_openUrlNewTab")}
        </MenuItem>
        <MenuItem eventKey="copyLinkUrl" onSelect={onMenuSelect}>
          {i18n("cmenu_copyLinkUrl")}
        </MenuItem>
      </React.Fragment>
    )}
    <MenuItem divider />
    {selEnabled && (
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
                "QuickSearchMenu--up": pageY > window.innerHeight / 2,
                "QuickSearchMenu--left": pageX > window.innerWidth * 0.7,
              }
            )}
            role="menu"
          >
            {QUICK_SEARCH.providers.map(p => (
              <MenuItem
                key={p.url}
                eventKey={p.url}
                onSelect={onQuickSearchSelect}
              >
                {p.name}
              </MenuItem>
            ))}
          </ul>
        </MenuItem>
        <MenuItem divider />
      </React.Fragment>
    )}
    {normalEnabled && (
      <React.Fragment>
        <MenuItem eventKey="selectAll" onSelect={onMenuSelect}>
          {i18n("cmenu_selectAll")}
          <span className="DropdownMenu__Item__HotKey">Ctrl+A</span>
        </MenuItem>
        <MenuItem
          eventKey="mouseBrowsing"
          onSelect={onMenuSelect}
          className={cx({
            "DropdownMenu__Item--checked": mouseBrowsingEnabled,
          })}
        >
          {i18n("cmenu_mouseBrowsing")}
        </MenuItem>
        <MenuItem onClick={onInputHelperClick}>
          {i18n("cmenu_showInputHelper")}
        </MenuItem>
        <MenuItem onClick={onLiveArticleHelperClick}>
          {i18n("cmenu_showLiveArticleHelper")}
        </MenuItem>
        <MenuItem divider />
      </React.Fragment>
    )}
    <MenuItem onClick={onSettingsClick}>{i18n("cmenu_settings")}</MenuItem>
  </ul>
);

export default enhance(DropdownMenu);
