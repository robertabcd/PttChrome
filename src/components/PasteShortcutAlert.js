import React from "react";
import { Alert, Button } from "react-bootstrap";
import { i18n } from "../js/i18n";

export const PasteShortcutAlert = ({ onDismiss }) => (
  <Alert
    bsStyle="info"
    id="pasteShortcutAlert"
    style={{ display: "block" /* FIXME: Overrides main.css */ }}
    tabIndex={-1}
    onDismiss={onDismiss}
  >
    <h4>{i18n("alert_pasteShortcutHeader")}</h4>
    <p>{i18n("alert_pasteShortcutText")}</p>
    <p>
      <Button bsStyle="primary" onClick={onDismiss}>
        {i18n("alert_pasteShortcutClose")}
      </Button>
    </p>
  </Alert>
);

export default PasteShortcutAlert;
