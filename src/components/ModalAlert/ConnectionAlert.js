import React from "react";
import { Alert, Button } from "react-bootstrap";
import { i18n } from "../../js/i18n";

export const ConnectionAlert = props => (
  <Alert {...props} bsStyle="danger">
    <h4>{i18n("alert_connectionHeader")}</h4>
    <p>{i18n("alert_connectionText")}</p>
    <p>
      <Button bsStyle="danger" onClick={props.onDismiss}>
        {i18n("alert_connectionReconnect")}
      </Button>
    </p>
  </Alert>
);

export default ConnectionAlert;
