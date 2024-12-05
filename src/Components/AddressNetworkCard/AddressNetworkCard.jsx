import React, { useState } from "react";
import { Card, message } from "antd";
import "./AddressNetworkCard.scss";
import bin from "../../Assets/delete.png";
import EDIT from "../../Assets/edit.png";
import { store } from "../..";
import { setLoading } from "../../actions/loading";
import { useSelector } from "react-redux";
import ModalCustom from "../ModalCustom/ModalCustom";
import { useNavigate } from "react-router-dom";
import { server } from "../../server";

function AddressNetworkCard(props) {
  const { heading, address, currency, index, id, refresh, wallet_address } =
    props;
  const { account } = useSelector((state) => state);
  const [deleteModal, setDeleteModal] = useState(false);

  const navigate = useNavigate();
  return (
    <>
      <div className="adressCard">
        <div className="adressCard__Header ">
          <h2>
            {heading}{" "}
            <img
              onClick={async () => {
                setDeleteModal(true);
              }}
              src={bin}
              style={{
                height: "16px",
                width: "16px",
                marginLeft: "10px",
                cursor: "pointer",
              }}
              alt=""
            />
          </h2>
          <div className="currency">
            {/* <p>Network</p> */}
            <p>{currency}</p>
          </div>
        </div>

        <div className="adressCard__address">
          <p>Address</p>
          <p>
            {address.substring(0, 7)}.....
            {address.substring(address.length - 7, address.length)}
          </p>
        </div>
        {/* <div className="adressCard__address">
          <p>Network</p>
          <p>{currency}</p>
        </div> */}
      </div>

      <ModalCustom
        title={"Delete Address"}
        isModalOpen={deleteModal}
        customClass="customClassModal"
        handleCancel={() => {
          setDeleteModal(false);
        }}
      >
        <div className="viewphrases">
          <div className="viewphrases__iInner">
            <p
              style={{
                fontSize: "20px",
              }}
            >
              Are you sure you want to delete this contact?
            </p>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginTop: "30px",
            }}
          >
            <div
              className="green"
              style={{
                padding: "12px 53px",
                backgroundColor: "green",
                color: "white",
                fontSize: "18px",
                borderRadius: "7px",
                marginRight: "20px",
                cursor: "pointer",
              }}
              onClick={async () => {
                store.dispatch(setLoading(true));
                await server.post(
                  "/wallet/delete_address_in_book",
                  {
                    id,
                    wallet_address,
                  },
                  {
                    headers: {
                      Authorization: account.jwtToken,
                    },
                  }
                );
                store.dispatch(setLoading(false));
                setDeleteModal(false);
                refresh();
              }}
            >
              Yes
            </div>
            <div
              className="red"
              style={{
                padding: "12px 53px",
                backgroundColor: "red",
                color: "white",
                fontSize: "18px",
                borderRadius: "7px",
                marginLeft: "20px",
                cursor: "pointer",
              }}
              onClick={() => {
                setDeleteModal(false);
              }}
            >
              No
            </div>
          </div>
        </div>
      </ModalCustom>
    </>
  );
}

export default AddressNetworkCard;
