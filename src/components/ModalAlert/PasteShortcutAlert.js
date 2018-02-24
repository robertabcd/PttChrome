import React from "react";
import { Alert, Button } from "react-bootstrap";
import { i18n } from "../../js/i18n";

export const PasteShortcutAlert = props => (
  <Alert {...props} bsStyle="info">
    <h4>{i18n("alert_pasteShortcutHeader")}</h4>
    <p>{i18n("alert_pasteShortcutText")}</p>
    <p>
      <Button bsStyle="primary" onClick={props.onDismiss}>
        {i18n("alert_pasteShortcutClose")}
      </Button>
    </p>
  </Alert>
);

export default PasteShortcutAlert;
