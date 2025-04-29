import { Modal } from "antd";
import React from "react";
import ModalCloseIcon from "../../Assets/ModalCloseIcon.svg";
import BlackCloseIcon from "../../Assets/blackclose.svg";

function ModalCustom({
  isModalOpen,
  handleOk,
  handleCancel,
  children,
  customClass = "",
  title = "",
  closable = true,
  isWhite,
}) {
  return (
    <div>
      <Modal
        closeIcon={
          isWhite ? (
            <img src={BlackCloseIcon} alt="Close" />
          ) : (
            <img src={ModalCloseIcon} alt="Close" />
          )
        }
        closable={closable}
        title={title}
        className={`modalCustom ${customClass}`}
        open={isModalOpen}
        onOk={handleOk}
        onCancel={handleCancel}
        footer={false}
        centered
      >
        {children}
      </Modal>
    </div>
  );
}

export default ModalCustom;
