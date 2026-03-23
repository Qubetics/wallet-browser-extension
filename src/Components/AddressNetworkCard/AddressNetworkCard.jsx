/*global chrome*/

import React, { useState } from "react";
import { message } from "antd";
import "./AddressNetworkCard.scss";
import { store } from "../..";
import { setLoading } from "../../actions/loading";
import { useSelector } from "react-redux";
import ModalCustom from "../ModalCustom/ModalCustom";
import { server } from "../../server";
import { useEffect } from "react";
import { EditAddress } from "./EditAddress.jsx";
import DeleteIcon from "../../Assets/delete.png";
import DownArrowSuffix from "../../Assets/DownArrowSuffix.svg";
import { EditAddressMain } from "./EditAddressMain.jsx";
import ButtonComp from "../ButtonComp/ButtonComp.jsx";
import { capitalizeWords } from "../../helpers/common.helper.js";

const crypto = {
  1: "BNB",
  2: "ETH",
  3: "BTC",
  4: "POL",
  5: "SOL",
  6: "TRX",
  7: "TICS",
};

function AddressNetworkCard(props) {
  const {
    heading,
    address,
    currency,
    index,
    id,
    refresh,
    wallet_address,
    wallet_data,
    editModal,
    setEditModal,
    editModalMain,
    setEditModalMain,
    inits,
  } = props;
  const { chain } = useSelector((state) => state);
  const { account } = useSelector((state) => state);
  const [deleteModal, setDeleteModal] = useState(false);
  // const [editModal, setEditModal] = useState(false);
  const [editData, setEditData] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);
  const [deleteType, setDeleteType] = useState(null);
  const [editDataMain, setEditDataMain] = useState(null);

  const [viewAddress, setViewAddress] = useState(false);

  const [chains, setChains] = useState(null);

  const [selectedChain, setSelectedChain] = useState(null);
  const [messageApi, contextHolder] = message.useMessage();

  const init = async () => {
    const { chains } = await chrome.storage.local.get("chains");

    if (chains && wallet_data?.length > 0) {
      const selectedChain = chains.find(
        (el) => el?.coinFamily == wallet_data[0]?.coin_family
      );
      setSelectedChain(selectedChain);
    }
    setChains(chains);
  };

  useEffect(() => {
    init();
  }, []);

  const handleSubmit = async () => {
    try {
      if (!/^(0x){1}[0-9a-fA-F]{40}$/i.test(editData?.wallet_address)) {
        messageApi.error("Invalid contract address");
        return;
      }

      store.dispatch(setLoading(true));
      const response = await server.post(
        // '/wallet/coin/coins_market_data',
        "/user/edit_address_book_wallet",
        {
          address_book_id: editData?.address_book_id,
          address_book_wallet_name: editData?.name,
          address_book_wallet_address: editData?.wallet_address,
          address_book_wallet_id: editData?.id,
          coin_family: editData?.coin_family,
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



  const handleSubmitMain = async () => {

    try {

      store.dispatch(setLoading(true));

      const response = await server.post(

        "/user/edit_address_book_contact_name",

        {

          address_book_id: editDataMain?.address_book_id,

          address_book_name: editDataMain?.address_book_name,

          // address_book_wallet_address: editDataMain?.wallet_address

        },

        {

          headers: {

            Authorization: account.jwtToken,

          },

        }

      );

      inits();

      store.dispatch(setLoading(false));

      setEditDataMain(null);

      setEditModalMain(false);

    } catch (error) {

      // console.log("error ", error);

      store.dispatch(setLoading(false));

      return messageApi.error(error.response.message);

    }

  };





  const deleteSubwallet = async (itm) => {

    try {

      store.dispatch(setLoading(true));

      const response = await server.post(

        "/user/delete_address_book_wallet_address",

        {

          address_book_id: itm?.address_book_id,

          id: itm?.id,

        },

        {

          headers: {

            Authorization: account.jwtToken,

          },

        }

      );

      inits();

      store.dispatch(setLoading(false));

      setDeleteItem(null);

      setEditData(null);

      setDeleteModal(false);

    } catch (error) {

      // console.log("Error ", error);

      setDeleteModal(false);

      store.dispatch(setLoading(false));

      return messageApi.error(error.response.message);

    }

  };


  return (
    <div>
      {contextHolder}
      <div className="adressFavorites" key={index}>
        {/* <h4>Favorites</h4> */}
      </div>
      <div className="adressCard">
        <div className="addressBook">
          <div className="bookAddress">
            <div className="leftSec">
              <h6> {heading.charAt(0).toUpperCase()}</h6>
              <div>
                <h3>{capitalizeWords(heading)} </h3>
                {/* <span className="address">
                  {address.substring(0, 7)}.....
                  {address.substring(address.length - 7, address.length)}
                </span> */}
              </div>
            </div>
            <div className="rytSec">
              <img
                onClick={async () => {
                  setDeleteModal(true);
                  setDeleteType("main");
                }}
                src={DeleteIcon}
                alt="DeleteIcon"
                width={"15px"}
                style={{cursor:"pointer"}}
              />
              {/* <span>
                <img
                  src={EditIcon}
                  alt="editIcon"
                  onClick={() => {
                    setEditDataMain({
                      address_book_id: id,
                      address_book_name: heading,
                      wallet_address: address,
                    });
                    setEditModalMain(true);
                  }}
                />
              </span> */}
              <span onClick={() => setViewAddress(!viewAddress)}>
                <img
                className={viewAddress ?"rotateItem":"noRotate"}
                  style={{ cursor: "pointer" }}
                  src={DownArrowSuffix}
                  alt="DownArrowSuffix"
                />
              </span>
            </div>
          </div>
        </div>
      </div>
      {viewAddress && (
        <div className="valueAddress adressCard">
          {Array.isArray(wallet_data) &&
            wallet_data.map((elem, idx) => (
              <div key={idx} className="addressBook adressCard_inner">
                <div className="bookAddress">
                  <div className="leftSec">
                    <img
                      style={{ height: 36 }}
                      src={elem?.coin_data?.coin_image}
                    />
                    <div className="addressInner">
                      <h3>{capitalizeWords(crypto[elem?.coin_family])}</h3>
                      <span className="address">
                        {elem?.wallet_address.substring(0, 7)}.....
                        {elem?.wallet_address.substring(
                          elem?.wallet_address.length - 7,
                          elem?.wallet_address.length
                        )}
                      </span>
                    </div>
                  </div>
                  <div className="rytSec">
                    {/* <img
                      style={{ marginRight: "10px" }}
                      onClick={async () => {
                        setEditData(elem);
                        setEditModal(true);
                      }}
                      src={EditIcon}
                      alt="editIcon"
                    /> */}
                    <img
                      onClick={() => {
                        // deleteSubwallet(elem);
                        // setEditModal(true);
                        setDeleteItem(elem);
                        setDeleteModal(true);
                        setDeleteType("sub");
                      }}
                      src={DeleteIcon}
                      alt="DeleteIcon"
                      width={"15px"}
                      style={{cursor:"pointer"}}
                    />
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}
      {/* setEditModal */}

      {editData && editModal && (
        <EditAddress
          editModal={editModal}
          setEditModal={setEditModal}
          editData={editData}
          setEditData={setEditData}
          handleSubmit={handleSubmit}
          selectedChain={selectedChain}
          setSelectedChain={setSelectedChain}
          chains={chains}
          address={address}
          heading={heading}
        />
      )}

      {editModalMain && editDataMain && (
        <EditAddressMain
          editModal={editModalMain}
          setEditModal={setEditModalMain}
          editData={editDataMain}
          setEditData={setEditDataMain}
          handleSubmit={handleSubmitMain}
          selectedChain={selectedChain}
          setSelectedChain={setSelectedChain}
          chains={chains}
          address={address}
        />
      )}

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
                color: "white"
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
              gap: "20px"
            }}
          >
            <ButtonComp
              maxWidth="100%"
              onClick={async () => {
                store.dispatch(setLoading(true));

                if (deleteType == "sub") {
                  deleteSubwallet(deleteItem);
                  store.dispatch(setLoading(false));
                } else {
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
                }
              }}
              text="Yes"
            />
            <div className="cancelBtn">
              <ButtonComp
                maxWidth="100%"
                onClick={() => {
                  setDeleteModal(false);
                }}
                text="No"
              />
            </div>
            {/* <div
              className="green"
              style={{
                padding: "12px 53px",
                backgroundColor: "rgb(56 101 109)",
                color: "white",
                fontSize: "18px",
                borderRadius: "7px",
                marginRight: "20px",
                cursor: "pointer",
              }}
              onClick={async () => {
                store.dispatch(setLoading(true));

                if (deleteType == "sub") {
                  deleteSubwallet(deleteItem);
                  store.dispatch(setLoading(false));
                } else {
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
                }
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
            </div> */}
          </div>
        </div>
      </ModalCustom>
    </div>
  );
}

export default AddressNetworkCard;
