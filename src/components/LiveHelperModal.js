import cx from "classnames";
import React from "react";
import { compose, withHandlers } from "recompose";
import { Modal, OverlayTrigger, Tooltip, Button } from "react-bootstrap";
import { i18n } from "../js/i18n";
import "./LiveHelperModal.css";

const normalizeSec = value => {
  const sec = parseInt(value, 10);
  return sec > 1 ? sec : 1;
};

const enhance = compose(
  withHandlers({
    onEnabledClick: ({ enabled, sec, onChange }) => () =>
      onChange({ enabled: !enabled, sec }),

    onSecChange: ({ enabled, onChange }) => ({ target: { value } }) =>
      onChange({ enabled, sec: normalizeSec(value) })
  })
);

export const LiveHelperModal = ({
  onHide,
  enabled,
  sec,
  // from recompose
  onEnabledClick,
  onSecChange
}) => (
  <Modal.Dialog>
    <Modal.Body className="LiveHelperModal__Body">
      <OverlayTrigger placement="top" overlay={<Tooltip>Alt + r</Tooltip>}>
        <Button active={enabled} onClick={onEnabledClick}>
          {i18n("liveHelperEnable")}
        </Button>
      </OverlayTrigger>
      <span className="LiveHelperModal__Body__Text nomouse_command">
        {i18n("liveHelperSpan")}
      </span>
      <input
        type="number"
        className="LiveHelperModal__Body__Input form-control nomouse_command"
        value={sec}
        onChange={onSecChange}
      />
      <span className="LiveHelperModal__Body__Text nomouse_command">
        {i18n("liveHelperSpanSec")}
      </span>
      <button
        type="button"
        className="LiveHelperModal__Body__Close close nomouse_command"
        onClick={onHide}
      >
        &times;
      </button>
    </Modal.Body>
  </Modal.Dialog>
);

export default enhance(LiveHelperModal);
