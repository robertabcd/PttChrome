import React from "react";
import { compose, lifecycle } from "recompose";
import { Alert, Button, Fade } from "react-bootstrap";
import { i18n } from "../js/i18n";
import "./PageTopAlert.css";

const enhance = compose(
  lifecycle({
    componentDidMount() {
      this.handler = e => {
        if (e.keyCode == 13) {
          this.props.onDismiss();
        }
        // Kills everything becase we don't want any further action performed under ConnectionAlert status
        event.preventDefault();
        event.stopImmediatePropagation();
      };
      window.addEventListener("keydown", this.handler, true);
    },
    componentWillUnmount() {
      window.removeEventListener("keydown", this.handler, true);
    },
  })
);

export const ConnectionAlert = ({ onDismiss }) => (
  <Fade in>
    <Alert bsStyle="danger" className="PageTopAlert" onDismiss={onDismiss}>
      <h4>{i18n("alert_connectionHeader")}</h4>
      <p>{i18n("alert_connectionText")}</p>
      <p>
        <Button bsStyle="danger" onClick={onDismiss}>
          {i18n("alert_connectionReconnect")}
        </Button>
      </p>
    </Alert>
  </Fade>
);

export default enhance(ConnectionAlert);
