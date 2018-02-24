import { createSelector, createStructuredSelector } from "reselect";
import cx from "classnames";
import React from "react";
import { compose, withHandlers } from "recompose";
import { Modal, OverlayTrigger, Tooltip, Button } from "react-bootstrap";
import { i18n } from "../../js/i18n";
import { CallbagConsumer } from "../Callbag";
import {
  LIVE_HELPER_TOGGLE_ENABLED,
  LIVE_HELPER_CHANGE_SEC,
  HIDE_LIVE_HELPER,
} from "../../application/callbagDuplex";
import "./LiveHelperModal.css";

const normalizeSec = value => {
  const sec = parseInt(value, 10);
  return sec > 1 ? sec : 1;
};

export const LiveHelperModal = ({ showsLiveHelper, liveHelper, dispatch }) => (
  <Modal show={showsLiveHelper}>
    <Modal.Body className="LiveHelperModal__Body">
      <OverlayTrigger placement="top" overlay={<Tooltip>Alt + r</Tooltip>}>
        <Button
          active={liveHelper.enabled}
          onClick={() => {
            dispatch(LIVE_HELPER_TOGGLE_ENABLED);
          }}
        >
          {i18n("liveHelperEnable")}
        </Button>
      </OverlayTrigger>
      <span className="LiveHelperModal__Body__Text nomouse_command">
        {i18n("liveHelperSpan")}
      </span>
      <input
        type="number"
        className="LiveHelperModal__Body__Input form-control nomouse_command"
        value={liveHelper.sec}
        onChange={({ target: { value } }) => {
          dispatch({
            type: LIVE_HELPER_CHANGE_SEC,
            data: normalizeSec(value),
          });
        }}
      />
      <span className="LiveHelperModal__Body__Text nomouse_command">
        {i18n("liveHelperSpanSec")}
      </span>
      <button
        type="button"
        className="LiveHelperModal__Body__Close close nomouse_command"
        onClick={() => {
          dispatch(HIDE_LIVE_HELPER);
        }}
      >
        &times;
      </button>
    </Modal.Body>
  </Modal>
);

const children = createSelector(
  createStructuredSelector({
    showsLiveHelper: ({ state }) => state.dropdownMenu.showsLiveHelper,
    liveHelper: ({ state }) => state.liveHelper,
    dispatch: ({ dispatch }) => dispatch,
  }),
  props => <LiveHelperModal {...props} />
);

export const constElement = <CallbagConsumer>{children}</CallbagConsumer>;
