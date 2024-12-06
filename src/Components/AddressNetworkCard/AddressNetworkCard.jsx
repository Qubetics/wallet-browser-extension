/*global chrome*/

import React, { useState } from "react";
import {  message } from "antd";
import "./AddressNetworkCard.scss";
import bin from "../../Assets/delete.png";
import EDIT from "../../Assets/edit.png";
import { store } from "../..";
import { setLoading } from "../../actions/loading";
import { useSelector } from "react-redux";
import ModalCustom from "../ModalCustom/ModalCustom";
import { Link, useNavigate } from "react-router-dom";
import { server } from "../../server";
import { useEffect } from "react"; 
import { EditAddress } from "./EditAddress"; 

function AddressNetworkCard(props) {
  const { heading, address, currency, index, id, refresh, wallet_address, wallet_data, editModal, setEditModal, inits } =
    props;
  const { chain } = useSelector((state) => state);
  const { account } = useSelector((state) => state);
  const [deleteModal, setDeleteModal] = useState(false);
  // const [editModal, setEditModal] = useState(false);
  const [editData, setEditData] = useState(null);
  const [chains, setChains] = useState(null);

  const [selectedChain, setSelectedChain] = useState(null);
  const [messageApi, contextHolder] = message.useMessage();


  const init = async () => {
    const { chains } = await chrome.storage.local.get('chains'); 

    if (chains && wallet_data?.length > 0) {
      const selectedChain = chains.find((el) => el?.coinFamily == wallet_data[0]?.coin_family); 
      setSelectedChain(selectedChain);
    }
    setChains(chains);
  };

  useEffect(() => {
    init();
  }, []);

 
  const handleSubmit = async () => {
    try { 
      store.dispatch(setLoading(true));
      const response = await server.post(
        // '/wallet/coin/coins_market_data',
        "/user/edit_address_book_wallet",
        {
          "address_book_id": editData?.address_book_id,
          "address_book_wallet_name": editData?.name,
          "address_book_wallet_address": editData?.wallet_address,
          "address_book_wallet_id": editData?.id
        },
        {
          headers: {
            Authorization: account.jwtToken,
          },
        }
      ); 
      inits();
      store.dispatch(setLoading(false));
      setEditData(null);
      setEditModal(false);
    } catch (error) { 
      store.dispatch(setLoading(false));
      return messageApi.error(error.response.message);
    }
  };
 
  const deleteSubwallet = async (itm) => { 
    // /user/delete_address_book_wallet_address 
    try {
      store.dispatch(setLoading(true));
      const response = await server.post(
        "/user/delete_address_book_wallet_address",
        {
          "address_book_id": itm?.address_book_id,
          "id": itm?.id
        },
        {
          headers: {
            Authorization: account.jwtToken,
          },
        }
      ); 
      inits();
      store.dispatch(setLoading(false));
      setEditModal(false);
    } catch (error) {
      console.log('Error ', error);

      store.dispatch(setLoading(false));
      return messageApi.error(error.response.message);
    } 
  }
 

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
            {/* <span onClick={async () => {
            setEditModal(true);
          }}>Edit</span> */}
          </h2>
          <div className="currency">
            {/* <p>Network</p> */}
            {/* <p>{currency}</p> */}
          </div>
        </div>

        <div className="adressCard__address">
          {/* <p>Address</p> */}
          {/* <p>
            {address.substring(0, 7)}.....
            {address.substring(address.length - 7, address.length)}
          </p> */}
        </div>
        {/* <div className="adressCard__address">
          <p>Network</p>
          <p>{currency}</p>
        </div> */}
        <div className="addressBook">
          Address list
          {Array.isArray(wallet_data) && wallet_data.map((elem, idx) => (
            <div key={idx} style={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center" }}>
              <img style={{ height: 25 }} src={elem?.coin_data?.coin_image} />
              <span>
                {elem?.wallet_address.substring(0, 7)}.....
                {elem?.wallet_address.substring(elem?.wallet_address.length - 7, elem?.wallet_address.length)}
              </span>{ }
              <span onClick={() => deleteSubwallet(elem)}>Delete</span>
              {/* <span onClick={() => editSubwallet(elem)}>Edit</span> */}
              <span onClick={async () => { 
                setEditData(elem);
                setEditModal(true);
              }}>Edit</span>
            </div>
          ))}
        </div>
      </div>

      {/* setEditModal */}

      {editData && editModal && <EditAddress editModal={editModal}
        setEditModal={setEditModal}
        editData={editData}
        setEditData={setEditData}
        handleSubmit={handleSubmit} 
        selectedChain={selectedChain}
        setSelectedChain={setSelectedChain}
        chains={chains}
        address={address}
        />
      }


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
                  // "/wallet/delete_address_in_book",
                  "/user/delete_address_book",
                  {
                    id,
                    // wallet_address:address,
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
