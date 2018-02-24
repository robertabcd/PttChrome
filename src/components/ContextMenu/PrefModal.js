import { createSelector, createStructuredSelector } from "reselect";
import cx from "classnames";
import React from "react";
import { compose, withStateHandlers, withHandlers, lifecycle } from "recompose";
import {
  Modal,
  Tab,
  Row,
  Col,
  Nav,
  NavItem,
  Button,
  Checkbox,
  FormGroup,
  ControlLabel,
  FormControl,
  OverlayTrigger,
  Popover,
} from "react-bootstrap";
import { i18n } from "../../js/i18n";
import { CallbagConsumer } from "../Callbag";
import {
  HIDE_SETTINGS,
  CHANGE_PENDING_SETTINGS,
  RESET_DEFAULT_SETTINGS,
} from "../../application/callbagDuplex";
import "./PrefModal.css";

const link = (text, url) => (
  <a href={url} target="_blank" rel="noreferrer">
    {text}
  </a>
);

const REPLACEMENTS = {
  link_github_iamchucky: link("Chuck Yang", "https://github.com/iamchucky"),
  link_github_robertabcd: link("robertabcd", "https://github.com/robertabcd"),
  link_robertabcd_PttChrome: link(
    "robertabcd/PttChrome",
    "https://github.com/robertabcd/PttChrome"
  ),
  link_iamchucky_PttChrome: link(
    "iamchucky/PttChrome",
    "https://github.com/iamchucky/PttChrome"
  ),
  link_GPL20: link(
    "General Public License v2.0",
    "https://www.gnu.org/licenses/old-licenses/gpl-2.0.html"
  ),
};

const replaceI18n = id =>
  i18n(id)
    .split(/#(\S+)#/gi)
    .map((it, index) => (index % 2 === 1 && REPLACEMENTS[it]) || it);

const enhance = compose(
  withStateHandlers(
    () => ({
      navActiveKey: "general",
    }),
    {
      onNavSelect: () => activeKey => ({
        navActiveKey: activeKey,
      }),

      onCheckboxChange: (state, { dispatch }) => ({
        target: { name, checked },
      }) =>
        dispatch({
          type: CHANGE_PENDING_SETTINGS,
          data: {
            [name]: checked,
          },
        }),

      onNumberInputChange: (state, { dispatch }) => ({
        target: { name, value },
      }) =>
        dispatch({
          type: CHANGE_PENDING_SETTINGS,
          data: {
            [name]: parseInt(value, 10),
          },
        }),

      onNumberTextChange: (state, { dispatch }) => ({
        target: { name, value },
      }) =>
        dispatch({
          type: CHANGE_PENDING_SETTINGS,
          data: {
            [name]: value,
          },
        }),
    }
  )
);

export const PrefModal = ({
  showsSettings,
  pendingSettings,
  dispatch,
  // from recompose
  navActiveKey,
  onNavSelect,
  onCheckboxChange,
  onNumberInputChange,
  onNumberTextChange,
}) => (
  <Modal
    show={showsSettings}
    onHide={() => {
      dispatch(HIDE_SETTINGS);
    }}
    className="PrefModal"
  >
    <Modal.Body>
      <Tab.Container activeKey={navActiveKey} onSelect={onNavSelect}>
        <div className="PrefModal__Grid">
          <div className="PrefModal__Grid__Col--left">
            <h3>{i18n("menu_settings")}</h3>
            <Nav bsStyle="pills" stacked>
              <NavItem eventKey="general">{i18n("options_general")}</NavItem>
              <NavItem eventKey="about">{i18n("options_about")}</NavItem>
            </Nav>
            <Button
              className="PrefModal__Grid__Col--left__Reset"
              onClick={() => {
                dispatch(RESET_DEFAULT_SETTINGS);
              }}
            >
              {i18n("options_reset")}
            </Button>
          </div>
          <div className="PrefModal__Grid__Col--right">
            <Tab.Content animation>
              <Tab.Pane eventKey="general">
                <fieldset className="PrefModal__Grid__Col--right__Fieldset">
                  <legend>
                    {i18n("options_general")}
                    <button
                      type="button"
                      className="close"
                      onClick={() => {
                        dispatch(HIDE_SETTINGS);
                      }}
                    >
                      &times;
                    </button>
                  </legend>
                  <Checkbox
                    name="enablePicPreview"
                    checked={pendingSettings.enablePicPreview}
                    onChange={onCheckboxChange}
                  >
                    {i18n("options_enablePicPreview")}
                  </Checkbox>
                  <Checkbox
                    name="enableNotifications"
                    checked={pendingSettings.enableNotifications}
                    onChange={onCheckboxChange}
                  >
                    {i18n("options_enableNotifications")}
                  </Checkbox>
                  <Checkbox
                    name="enableEasyReading"
                    checked={pendingSettings.enableEasyReading}
                    onChange={onCheckboxChange}
                  >
                    {i18n("options_enableEasyReading")}
                  </Checkbox>
                  <Checkbox
                    name="endTurnsOnLiveUpdate"
                    checked={pendingSettings.endTurnsOnLiveUpdate}
                    onChange={onCheckboxChange}
                  >
                    {i18n("options_endTurnsOnLiveUpdate")}
                  </Checkbox>
                  <Checkbox
                    name="copyOnSelect"
                    checked={pendingSettings.copyOnSelect}
                    onChange={onCheckboxChange}
                  >
                    {i18n("options_copyOnSelect")}
                  </Checkbox>
                  <FormGroup controlId="antiIdleTime">
                    <ControlLabel>{i18n("options_antiIdleTime")}</ControlLabel>
                    <OverlayTrigger
                      trigger="focus"
                      placement="right"
                      overlay={
                        <Popover id="tooltip_antiIdleTime">
                          {i18n("tooltip_antiIdleTime")}
                        </Popover>
                      }
                    >
                      <FormControl
                        name="antiIdleTime"
                        type="number"
                        value={pendingSettings.antiIdleTime}
                        onChange={onNumberInputChange}
                      />
                    </OverlayTrigger>
                  </FormGroup>
                  <FormGroup controlId="lineWrap">
                    <ControlLabel>{i18n("options_lineWrap")}</ControlLabel>
                    <FormControl
                      name="lineWrap"
                      type="number"
                      value={pendingSettings.lineWrap}
                      onChange={onNumberInputChange}
                    />
                  </FormGroup>
                </fieldset>
                <fieldset className="PrefModal__Grid__Col--right__Fieldset">
                  <legend>{i18n("options_appearance")}</legend>
                  <Checkbox
                    name="fontFitWindowWidth"
                    checked={pendingSettings.fontFitWindowWidth}
                    onChange={onCheckboxChange}
                  >
                    {i18n("options_fontFitWindowWidth")}
                  </Checkbox>
                  <FormGroup controlId="fontFace">
                    <ControlLabel>{i18n("options_fontFace")}</ControlLabel>
                    <OverlayTrigger
                      trigger="focus"
                      placement="right"
                      overlay={
                        <Popover id="tooltip_fontFace">
                          {i18n("tooltip_fontFace")}
                        </Popover>
                      }
                    >
                      <FormControl
                        name="fontFace"
                        type="text"
                        value={pendingSettings.fontFace}
                        onChange={onNumberTextChange}
                      />
                    </OverlayTrigger>
                  </FormGroup>
                  <FormGroup controlId="bbsMargin">
                    <ControlLabel>{i18n("options_bbsMargin")}</ControlLabel>
                    <FormControl
                      name="bbsMargin"
                      type="number"
                      value={pendingSettings.bbsMargin}
                      onChange={onNumberInputChange}
                    />
                  </FormGroup>
                </fieldset>
                <fieldset className="PrefModal__Grid__Col--right__Fieldset">
                  <legend>{i18n("options_mouseBrowsing")}</legend>
                  <Checkbox
                    name="useMouseBrowsing"
                    checked={pendingSettings.useMouseBrowsing}
                    onChange={onCheckboxChange}
                  >
                    {i18n("options_useMouseBrowsing")}
                  </Checkbox>
                  <Checkbox
                    name="mouseBrowsingHighlight"
                    checked={pendingSettings.mouseBrowsingHighlight}
                    onChange={onCheckboxChange}
                  >
                    {i18n("options_mouseBrowsingHighlight")}
                  </Checkbox>
                  <div className="PrefModal__Grid__Col--right__MouseBrowsingHighlightColor">
                    {i18n("options_highlightColor")}
                    <FormControl
                      componentClass="select"
                      className={cx(
                        `b${pendingSettings.mouseBrowsingHighlightColor}`,
                        `b${pendingSettings.mouseBrowsingHighlightColor}`
                      )}
                      name="mouseBrowsingHighlightColor"
                      value={pendingSettings.mouseBrowsingHighlightColor}
                      onChange={onNumberInputChange}
                    >
                      {Array(16)
                        .fill(0, 1 /* skip transparent (index === 0) */)
                        .map((x, i) => (
                          <option
                            key={i}
                            value={i}
                            className={cx(
                              `b${i}` /* FIXME: Existing bug: Not working for Chrome */
                            )}
                          />
                        ))}
                    </FormControl>
                  </div>
                  <FormGroup controlId="mouseLeftFunction">
                    <ControlLabel>
                      {i18n("options_mouseLeftFunction")}
                    </ControlLabel>
                    <FormControl
                      componentClass="select"
                      name="mouseLeftFunction"
                      value={pendingSettings.mouseLeftFunction}
                      onChange={onNumberInputChange}
                    >
                      {[
                        "options_none",
                        "options_enterKey",
                        "options_rightKey",
                      ].map((key, index) => (
                        <option key={key} value={index}>
                          {i18n(key)}
                        </option>
                      ))}
                    </FormControl>
                  </FormGroup>
                  <FormGroup controlId="mouseMiddleFunction">
                    <ControlLabel>
                      {i18n("options_mouseMiddleFunction")}
                    </ControlLabel>
                    <FormControl
                      componentClass="select"
                      name="mouseMiddleFunction"
                      value={pendingSettings.mouseMiddleFunction}
                      onChange={onNumberInputChange}
                    >
                      {[
                        "options_none",
                        "options_enterKey",
                        "options_leftKey",
                        "options_doPaste",
                      ].map((key, index) => (
                        <option key={key} value={index}>
                          {i18n(key)}
                        </option>
                      ))}
                    </FormControl>
                  </FormGroup>
                  <FormGroup controlId="mouseWheelFunction1">
                    <ControlLabel>
                      {i18n("options_mouseWheelFunction1")}
                    </ControlLabel>
                    <FormControl
                      componentClass="select"
                      name="mouseWheelFunction1"
                      value={pendingSettings.mouseWheelFunction1}
                      onChange={onNumberInputChange}
                    >
                      {[
                        "options_none",
                        "options_upDown",
                        "options_pageUpDown",
                        "options_threadLastNext",
                      ].map((key, index) => (
                        <option key={key} value={index}>
                          {i18n(key)}
                        </option>
                      ))}
                    </FormControl>
                  </FormGroup>
                  <FormGroup controlId="mouseWheelFunction2">
                    <ControlLabel>
                      {i18n("options_mouseWheelFunction2")}
                    </ControlLabel>
                    <FormControl
                      componentClass="select"
                      name="options_mouseWheelFunction2"
                      value={pendingSettings.options_mouseWheelFunction2}
                      onChange={onNumberInputChange}
                    >
                      {[
                        "options_none",
                        "options_upDown",
                        "options_pageUpDown",
                        "options_threadLastNext",
                      ].map((key, index) => (
                        <option key={key} value={index}>
                          {i18n(key)}
                        </option>
                      ))}
                    </FormControl>
                  </FormGroup>
                  <FormGroup controlId="mouseWheelFunction3">
                    <ControlLabel>
                      {i18n("options_mouseWheelFunction3")}
                    </ControlLabel>
                    <FormControl
                      componentClass="select"
                      name="options_mouseWheelFunction3"
                      value={pendingSettings.options_mouseWheelFunction3}
                      onChange={onNumberInputChange}
                    >
                      {[
                        "options_none",
                        "options_upDown",
                        "options_pageUpDown",
                        "options_threadLastNext",
                      ].map((key, index) => (
                        <option key={key} value={index}>
                          {i18n(key)}
                        </option>
                      ))}
                    </FormControl>
                  </FormGroup>
                </fieldset>
              </Tab.Pane>
              <Tab.Pane eventKey="about">
                <div>
                  <legend>
                    PttChrome<small> - {i18n("about_appName_subtitle")}</small>
                    <button
                      type="button"
                      className="close"
                      onClick={() => {
                        dispatch(HIDE_SETTINGS);
                      }}
                    >
                      &times;
                    </button>
                  </legend>
                  <p>{replaceI18n("about_description")}</p>
                </div>
                <div>
                  <legend>{i18n("about_version_title")}</legend>
                  <ul>
                    <li>{replaceI18n("about_version_current")}</li>
                    <li>{replaceI18n("about_version_original")}</li>
                  </ul>
                </div>
                <div>
                  <legend>{i18n("about_new_title")}</legend>
                  <ul>
                    {i18n("about_new_content").map((text, index) => (
                      <li key={index}>{text}</li>
                    ))}
                  </ul>
                </div>
              </Tab.Pane>
            </Tab.Content>
          </div>
        </div>
      </Tab.Container>
    </Modal.Body>
  </Modal>
);

const children = createSelector(
  createStructuredSelector({
    showsSettings: ({ state }) => state.showsSettings,
    pendingSettings: ({ state }) => state.pendingSettings,
    dispatch: ({ dispatch }) => dispatch,
  }),
  createSelector(() => enhance, enhance => enhance(PrefModal)),
  (props, EnhancedPrefModal) => <EnhancedPrefModal {...props} />
);

export const constElement = <CallbagConsumer>{children}</CallbagConsumer>;
