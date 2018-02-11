import { createSelector, createStructuredSelector } from "reselect";
import cx from "classnames";
import React from "react";
import PasteShortcutAlert from "./PasteShortcutAlert";
import { CallbagConsumer } from "../Callbag";
import { HIDE_PASTE_SHORTCUT_ALERT } from "../reducer";
import CustomModal from "./CustomModal";
import "./ModalAlert.css";

export const PasteShortcutModalAlert = ({
  showsPasteShortcutAlert,
  dispatch,
}) => (
  <CustomModal
    show={showsPasteShortcutAlert}
    onExited={() => {
      dispatch(HIDE_PASTE_SHORTCUT_ALERT);
    }}
  >
    <PasteShortcutAlert
      className={cx("ModalAlert")}
      onDismiss={() => {
        dispatch(HIDE_PASTE_SHORTCUT_ALERT);
      }}
    />
  </CustomModal>
);

const children = createSelector(
  createStructuredSelector({
    showsPasteShortcutAlert: ({ state }) => state.showsPasteShortcutAlert,
    dispatch: ({ dispatch }) => dispatch,
  }),
  props => <PasteShortcutModalAlert {...props} />
);

export const constElement = <CallbagConsumer>{children}</CallbagConsumer>;
