import React from "react";
import { Alert, Button } from "react-bootstrap";
import { i18n } from "../../js/i18n";

export const DeveloperModeAlert = props => (
  <Alert {...props} bsStyle="danger">
    <h4>{i18n("alert_developerModeHeader")}</h4>
    <p>{i18n("alert_developerModeText")}</p>
    <p>
      <Button bsStyle="danger" onClick={props.onDismiss}>
        {i18n("alert_developerModeDismiss")}
      </Button>
    </p>
  </Alert>
);

export default DeveloperModeAlert;
