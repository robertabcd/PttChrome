import { createSelector, createStructuredSelector } from "reselect";
import cx from "classnames";
import React from "react";
import { CallbagConsumer } from "../Callbag";
import { HIDE_DEV_MODE_ALERT } from "../../application/callbagDuplex";
import CustomModal from "./CustomModal";
import "./ModalAlert.css";

export const DeveloperModeModalAlert = ({
  DeveloperModeAlert,
  showsDevModeAlert,
  dispatch,
}) => {
  if (!DeveloperModeAlert) {
    return false;
  }
  return (
    <CustomModal
      show={showsDevModeAlert}
      onExited={() => {
        dispatch(HIDE_DEV_MODE_ALERT);
      }}
    >
      <DeveloperModeAlert
        className={cx("ModalAlert")}
        onDismiss={() => {
          dispatch(HIDE_DEV_MODE_ALERT);
        }}
      />
    </CustomModal>
  );
};

const children = createSelector(
  createStructuredSelector({
    DeveloperModeAlert: ({ state }) => state.DeveloperModeAlert,
    showsDevModeAlert: ({ state }) => state.showsDevModeAlert,
    dispatch: ({ dispatch }) => dispatch,
  }),
  props => <DeveloperModeModalAlert {...props} />
);

export const constElement = <CallbagConsumer>{children}</CallbagConsumer>;
