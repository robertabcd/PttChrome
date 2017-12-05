import React from "react";
import { Alert, Button, Fade } from "react-bootstrap";
import { i18n } from "../js/i18n";

export const DeveloperModeAlert = ({ onDismiss }) => (
  <Fade in>
    <Alert
      bsStyle="danger"
      id="developerModeAlert"
      style={{ display: "block" /* FIXME: Overrides main.css */ }}
      onDismiss={onDismiss}
    >
      <h4>{i18n("alert_developerModeHeader")}</h4>
      <p>{i18n("alert_developerModeText")}</p>
      <p>
        <Button bsStyle="danger" onClick={onDismiss}>
          {i18n("alert_developerModeDismiss")}
        </Button>
      </p>
    </Alert>
  </Fade>
);

export default DeveloperModeAlert;
