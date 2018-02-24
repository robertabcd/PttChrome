import React from "react";
import BaseModal from "react-overlays/lib/Modal";
import { Fade, Modal } from "react-bootstrap";

export const CustomModal = ({ children, ...restProps }) => (
  <BaseModal
    {...restProps}
    backdropClassName="modal-backdrop"
    containerClassName="modal-open"
    backdropTransition={Fade}
    transition={Fade}
    dialogTransitionTimeout={Modal.TRANSITION_DURATION}
    backdropTransitionTimeout={Modal.BACKDROP_TRANSITION_DURATION}
  >
    {children}
  </BaseModal>
);

export default CustomModal;
