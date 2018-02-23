import cx from "classnames";
import React from "react";
import { compose, withStateHandlers, withHandlers } from "recompose";
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
import "./PrefModal.css";

const DEFAULT_PREFS = {
  // general
  //dbcsDetect    : false,
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

const PREF_STORAGE_KEY = "pttchrome.pref.v1";

export const readValuesWithDefault = () => {
  try {
    return {
      ...DEFAULT_PREFS,
      ...JSON.parse(window.localStorage.getItem(PREF_STORAGE_KEY)).values,
    };
  } catch (e) {
    return {
      ...DEFAULT_PREFS,
    };
  }
};

const writeValues = values => {
  try {
    window.localStorage.setItem(
      PREF_STORAGE_KEY,
      JSON.stringify({
        values,
      })
    );
  } catch (e) {}
  return values;
};

const normalizeSec = value => {
  const sec = parseInt(value, 10);
  return sec > 1 ? sec : 1;
};

const replaceI18n = (id, replacements) => {
  return i18n(id)
    .split(/#(\S+)#/gi)
    .map((it, index) => {
      if (index % 2 === 1 && it in replacements) {
        return replacements[it];
      } else {
        return it;
      }
    });
};

const link = (text, url) => (
  <a href={url} target="_blank" rel="noreferrer">
    {text}
  </a>
);

const enhance = compose(
  withStateHandlers(
    () => ({
      navActiveKey: "general",
      values: readValuesWithDefault(),
      replacements: {
        link_github_iamchucky: link(
          "Chuck Yang",
          "https://github.com/iamchucky"
        ),
        link_github_robertabcd: link(
          "robertabcd",
          "https://github.com/robertabcd"
        ),
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
      },
    }),
    {
      onCloseClick: ({ values }, { onSave }) => () =>
        onSave(writeValues(values)),

      onResetClick: (state, { onReset }) => () =>
        onReset(
          writeValues({
            ...DEFAULT_PREFS,
          })
        ),

      onNavSelect: () => activeKey => ({
        navActiveKey: activeKey,
      }),

      onCheckboxChange: ({ values }) => ({ target: { name, checked } }) => ({
        values: {
          ...values,
          [name]: checked,
        },
      }),

      onNumberInputChange: ({ values }) => ({ target: { name, value } }) => ({
        values: {
          ...values,
          [name]: parseInt(value, 10),
        },
      }),

      onNumberTextChange: ({ values }) => ({ target: { name, value } }) => ({
        values: {
          ...values,
          [name]: value,
        },
      }),
    }
  )
);

export const PrefModal = ({
  show,
  // from recompose
  onCloseClick,
  onResetClick,
  navActiveKey,
  onNavSelect,
  values,
  onCheckboxChange,
  onNumberInputChange,
  onNumberTextChange,
  replacements,
}) => (
  <Modal show={show} onHide={onCloseClick} className="PrefModal">
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
              onClick={onResetClick}
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
                      onClick={onCloseClick}
                    >
                      &times;
                    </button>
                  </legend>
                  <Checkbox
                    name="enablePicPreview"
                    checked={values.enablePicPreview}
                    onChange={onCheckboxChange}
                  >
                    {i18n("options_enablePicPreview")}
                  </Checkbox>
                  <Checkbox
                    name="enableNotifications"
                    checked={values.enableNotifications}
                    onChange={onCheckboxChange}
                  >
                    {i18n("options_enableNotifications")}
                  </Checkbox>
                  <Checkbox
                    name="enableEasyReading"
                    checked={values.enableEasyReading}
                    onChange={onCheckboxChange}
                  >
                    {i18n("options_enableEasyReading")}
                  </Checkbox>
                  <Checkbox
                    name="endTurnsOnLiveUpdate"
                    checked={values.endTurnsOnLiveUpdate}
                    onChange={onCheckboxChange}
                  >
                    {i18n("options_endTurnsOnLiveUpdate")}
                  </Checkbox>
                  <Checkbox
                    name="copyOnSelect"
                    checked={values.copyOnSelect}
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
                        value={values.antiIdleTime}
                        onChange={onNumberInputChange}
                      />
                    </OverlayTrigger>
                  </FormGroup>
                  <FormGroup controlId="lineWrap">
                    <ControlLabel>{i18n("options_lineWrap")}</ControlLabel>
                    <FormControl
                      name="lineWrap"
                      type="number"
                      value={values.lineWrap}
                      onChange={onNumberInputChange}
                    />
                  </FormGroup>
                </fieldset>
                <fieldset className="PrefModal__Grid__Col--right__Fieldset">
                  <legend>{i18n("options_appearance")}</legend>
                  <Checkbox
                    name="fontFitWindowWidth"
                    checked={values.fontFitWindowWidth}
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
                        value={values.fontFace}
                        onChange={onNumberTextChange}
                      />
                    </OverlayTrigger>
                  </FormGroup>
                  <FormGroup controlId="bbsMargin">
                    <ControlLabel>{i18n("options_bbsMargin")}</ControlLabel>
                    <FormControl
                      name="bbsMargin"
                      type="number"
                      value={values.bbsMargin}
                      onChange={onNumberInputChange}
                    />
                  </FormGroup>
                </fieldset>
                <fieldset className="PrefModal__Grid__Col--right__Fieldset">
                  <legend>{i18n("options_mouseBrowsing")}</legend>
                  <Checkbox
                    name="useMouseBrowsing"
                    checked={values.useMouseBrowsing}
                    onChange={onCheckboxChange}
                  >
                    {i18n("options_useMouseBrowsing")}
                  </Checkbox>
                  <Checkbox
                    name="mouseBrowsingHighlight"
                    checked={values.mouseBrowsingHighlight}
                    onChange={onCheckboxChange}
                  >
                    {i18n("options_mouseBrowsingHighlight")}
                  </Checkbox>
                  <div className="PrefModal__Grid__Col--right__MouseBrowsingHighlightColor">
                    {i18n("options_highlightColor")}
                    <FormControl
                      componentClass="select"
                      className={cx(
                        `b${values.mouseBrowsingHighlightColor}`,
                        `b${values.mouseBrowsingHighlightColor}`
                      )}
                      name="mouseBrowsingHighlightColor"
                      value={values.mouseBrowsingHighlightColor}
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
                      value={values.mouseLeftFunction}
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
                      value={values.mouseMiddleFunction}
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
                      value={values.mouseWheelFunction1}
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
                      value={values.options_mouseWheelFunction2}
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
                      value={values.options_mouseWheelFunction3}
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
                      onClick={onCloseClick}
                    >
                      &times;
                    </button>
                  </legend>
                  <p>{replaceI18n("about_description", replacements)}</p>
                </div>
                <div>
                  <legend>{i18n("about_version_title")}</legend>
                  <ul>
                    <li>
                      {replaceI18n("about_version_current", replacements)}
                    </li>
                    <li>
                      {replaceI18n("about_version_original", replacements)}
                    </li>
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

export default enhance(PrefModal);
