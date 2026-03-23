/* global chrome*/
import React, { useEffect } from "react";
import { Drawer } from "antd";
// import { spritzHelper } from "../../helpers/spritz.helper";
// import ButtonComp from "../../Components/ButtonComp/ButtonComp";
import ModalCloseIcon from "../../../Assets/ModalCloseIcon.svg";
import darkclose from "../../../Assets/darkclose.svg";
import { useSelector } from "react-redux";
// import { message } from "antd";
// import { store } from "../..";
// import { spritzAccounts, spritzKyc, spritzLogin } from "../../actions/spritz";
// import { setCreate } from "../../actions/create";
// import { useNavigate } from "react-router-dom";
// import { SecurityHelper } from "../../helpers/security.helper";
import standard from "../../../Assets/PNG/Standardicon.png";
import Rapid from "../../../Assets/PNG/Rapidicon.png";
export default function BankAccountDrawer({
  openDrawer,
  closeDrawer,
  setDeliveryMethod,
}) {
  const { theme } = useSelector((state) => state);

  useEffect(() => {}, [openDrawer]);

  return (
    <div className="balanceDetails__modal">
      <p className="balanceDetails__modal__title"> </p>
      <Drawer
        placement="bottom"
        title="Delivery Method"
        maskClosable={false}
        onClose={() => closeDrawer()}
        height={287}
        open={openDrawer}
        closeIcon={
          theme == "darkTheme" ? (
            <img src={darkclose} />
          ) : (
            <img src={ModalCloseIcon} />
          )
        }
      >
        <div className="delivery_methods">
          <div
            className="option"
            style={{ cursor: "pointer" }}
            onClick={() => {
              setDeliveryMethod("STANDARD");
              closeDrawer();
            }}
          >
            <h2>
              <img src={standard} /> Standard
            </h2>
            <p>Next Business Day</p>
          </div>
          <div
            className="option"
            style={{ cursor: "pointer" }}
            onClick={() => {
              setDeliveryMethod("INSTANT");
              closeDrawer();
            }}
          >
            <div>
              <h2>
                <img src={Rapid} /> Real-Time Payment (1% Surcharge)
              </h2>
            </div>
            <p>Within Minutes</p>
          </div>
        </div>
      </Drawer>
    </div>
  );
}
