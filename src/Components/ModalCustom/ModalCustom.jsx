import { Modal } from "antd";
import React from "react";
import { useSelector } from "react-redux";
import ModalCloseIcon from "../../Assets/ModalCloseIcon.svg";
import darkclose from "../../Assets/darkclose.svg";

function ModalCustom({
  isModalOpen,
  handleOk,
  handleCancel,
  children,
  customClass,
  title,
  closable,
}) {
  // this is  sample
  const { theme } = useSelector((state) => state);
  return (
    <div>
      <Modal
        closeIcon={
          theme == "darkTheme" ? (
            <img src={darkclose} />
          ) : (
            <img src={ModalCloseIcon} />
          )
        }
        closable={closable === false ? false : true}
        title={title}
        className={`modalCustom ${customClass && customClass}`}
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
