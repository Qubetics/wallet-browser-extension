import { Modal } from "antd";
import React from "react";
// Uncomment if theme usage is needed:
// import { useSelector } from "react-redux";
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
}) {
  // Example: If using theme from Redux
  // const { theme } = useSelector((state) => state);

  return (
    <div>
      <Modal
        closeIcon={
          true ? (
            <img src={ModalCloseIcon} alt="Close" />
          ) : (
            <img src={BlackCloseIcon} alt="Close" />
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
