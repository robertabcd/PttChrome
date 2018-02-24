import { createSelector, createStructuredSelector } from "reselect";
import cx from "classnames";
import React from "react";
import ConnectionAlert from "./ConnectionAlert";
import { CallbagConsumer } from "../Callbag";
import { HIDE_LOST_CONNECTION_ALERT } from "../../application/callbagDuplex";
import CustomModal from "./CustomModal";
import "./ModalAlert.css";

export const ConnectionModalAlert = ({ connection, dispatch }) => (
  <CustomModal
    show={connection === 2}
    onExited={() => {
      dispatch(HIDE_LOST_CONNECTION_ALERT);
    }}
  >
    <ConnectionAlert
      className={cx("ModalAlert")}
      onDismiss={() => {
        dispatch(HIDE_LOST_CONNECTION_ALERT);
      }}
    />
  </CustomModal>
);

const children = createSelector(
  createStructuredSelector({
    connection: ({ state }) => state.connection,
    dispatch: ({ dispatch }) => dispatch,
  }),
  props => <ConnectionModalAlert {...props} />
);

export const constElement = <CallbagConsumer>{children}</CallbagConsumer>;
