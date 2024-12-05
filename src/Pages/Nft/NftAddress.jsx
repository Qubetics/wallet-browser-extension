/*global chrome*/

import { message } from "antd";
import BigNumber from "bignumber.js";
import { ethers } from "ethers";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { store } from "../..";
import { setLoading } from "../../actions/loading";
import { setNFTbackData } from "../../actions/setNFTBackData";
import ButtonComp from "../../Components/ButtonComp/ButtonComp";
import { InputField } from "../../Components/InputField/InputFieldSimple";
import { ENSHelper } from "../../helpers/ens.helper";
import { UnstoppableDomainHelper } from "../../helpers/unstopable.helper";
import { Web3Helper } from "../../helpers/web3.helper";
import AddressBook from "../../Assets/address-book-svgrepo-com.svg";
import ModalCustom from "../../Components/ModalCustom/ModalCustom";
import { server } from "../../server";
import AddressTable from "../../Components/AddressTable/AddressTable";
import Add from "../../Assets/add.svg";

function NftAddress() {
  const navigate = useNavigate();

  const { account } = useSelector((state) => state);
  const [messageApi, contextHolder] = message.useMessage();
  const [address, setAddress] = useState(null);
  const [isLogoutModalOpen, setLogoutOpenmodal] = useState(false);
  const [list, setList] = useState([]);
  const [contact, setContact] = useState(null);

  const onLogoutClick = () => {
    setLogoutOpenmodal(true);
  };

  const handlLogouteOk = () => {
    setLogoutOpenmodal(false);
  };

  const handleLogoutCancel = () => {
    setLogoutOpenmodal(false);
  };

  const {
    state: { detail },
  } = useLocation();

  const init = async () => {
    try {
      const { data } = await server.post(
        "/wallet/address_book/list",
        {
          wallet_address: account.coinFamilyAndAddress[detail.coin_family],
        },
        {
          headers: {
            Authorization: account.jwtToken,
          },
        }
      );
      setList(data.data.filter((el) => el.coin_family == detail.coin_family));
    } catch (error) {
      messageApi.error(error.message);
    }
  };

  useEffect(() => {
    init();
  }, []);

  return (
    <>
      <div className="nfDetail">
        {contextHolder}
        <div className="adreesInput">
          <InputField
            placeholder={"Wallet Address"}
            label="Address"
            value={address}
            checkForSymbols={true}
            getData={setAddress}
            addonAfter={
              <>
                <span
                  onClick={async (e) => {
                    onLogoutClick();
                  }}
                >
                  <img
                    src={AddressBook}
                    style={{
                      width: "25px",
                      marginRight: "10px",
                    }}
                    alt=""
                  />
                </span>
                <span
                  className={"send__pasteText"}
                  style={{
                    position: "relative",
                    top: "-9px",
                  }}
                  onClick={async (e) => {
                    const text = await navigator.clipboard.readText();
                    setAddress(text);
                  }}
                >
                  Paste
                </span>
              </>
            }
          />
        </div>
        <ButtonComp
          onClick={async () => {
            store.dispatch(setLoading(true));
            const { chains } = await chrome.storage.local.get("chains");
            const chain = chains.find(
              (chain) => chain.coinFamily == detail.coin_family
            );

            if (!address) {
              store.dispatch(setLoading(false));

              return messageApi.error(
                "Please enter a valid address to proceed."
              );
            }

            const myAddress = account.coinFamilyAndAddress[1];

            if (myAddress.toLowerCase() === address.toLowerCase()) {
              store.dispatch(setLoading(false));

              return messageApi.error("You cannot send to your own address.");
            }

            let ENSName = null;
            const checkIfUserEnteredENS = address.split(".")[1]
              ? address.split(".")[1].toLowerCase()
              : null;
            if (checkIfUserEnteredENS) {
              if (checkIfUserEnteredENS === "eth") {
                const checkForENS = await ENSHelper.findAddress(address);
                if (!checkForENS.status) {
                  store.dispatch(setLoading(false));
                  return messageApi.error("Invalid ENS name provided.");
                } else {
                  ENSName = address;
                  address = checkForENS.address;
                }
              } else {
                const checkForENS = await UnstoppableDomainHelper.findAddress(
                  address,
                  chain.currencySymbol.toUpperCase()
                );
                if (!checkForENS.status) {
                  store.dispatch(setLoading(false));
                  return messageApi.error("Invalid domain name provided.");
                } else {
                  ENSName = address;
                  address = checkForENS.address;
                }
              }
            }

            try {
            } catch (error) {}

            const gasData = await Web3Helper.getGasPrice(
              chain.slug,
              address,
              myAddress,
              1,
              detail.token_address,
              detail.token_id,
              detail.token_type,
              detail.amount
            );

            if (!ethers.utils.isAddress(address)) {
              store.dispatch(setLoading(false));
              return messageApi.error(
                "Please provide a valid address to proceed."
              );
            }

            let gasEstimate = gasData.estimate;
            const gasPrice = new BigNumber(gasData.price).times(1000000000);

            if (!gasPrice) {
              store.dispatch(setLoading(false));
              return messageApi.error(
                "Unable to fetch gas price at the moment."
              );
            }

            const gasInEth = gasPrice.times(gasEstimate).div(Math.pow(10, 18));

            store.dispatch(setLoading(false));

            store.dispatch(
              setNFTbackData({
                detail,
                toAddress: address,
                fromAddress: myAddress,
                networkFee: gasInEth.toFixed(5),
                ENSName,
                contact,
              })
            );

            navigate("/nftConfirm", {
              state: {
                detail,
                toAddress: address,
                fromAddress: myAddress,
                networkFee: gasInEth.toFixed(5),
                ENSName,
                contact,
              },
            });
          }}
          text={"Next"}
          maxWidth={"100%"}
        />
      </div>
      <ModalCustom
        title={"Address Book"}
        handleCancel={handleLogoutCancel}
        isModalOpen={isLogoutModalOpen}
        handleOk={handlLogouteOk}
        customClass="customClassModal"
      >
        <div className={"viewphrases"}>
          {list.length > 0 ? (
            <>
              <AddressTable
                setAddress={(value, name) => {
                  setAddress(value);
                  setContact(name);
                  handlLogouteOk();
                }}
                dataArray={list.map((el) => {
                  return {
                    address: el.address,
                    name: el.name.toUpperCase(),
                  };
                })}
              />
              <div
                style={{
                  width: "100%",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <span
                  style={{ cursor: "pointer", display: "flex" }}
                  to={void 0}
                  onClick={() => {
                    navigate("/add-contact", {
                      state: {
                        coin: detail,
                        redirectTo: "/nftAddress",
                      },
                    });
                  }}
                >
                  <img src={Add} style={{ marginRight: "7px" }} alt="" />
                  <span className="noAddress">Add Address</span>
                </span>
              </div>
            </>
          ) : (
            <div
              style={{
                width: "100%",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <span
                style={{ cursor: "pointer", display: "flex" }}
                to={void 0}
                onClick={() => {
                  navigate("/add-contact", {
                    state: {
                      coin: detail,
                      redirectTo: "/nftAddress",
                    },
                  });
                }}
              >
                <img src={Add} style={{ marginRight: "7px" }} alt="" />
                <span className="noAddress">Add Address</span>
              </span>
            </div>
          )}
        </div>
      </ModalCustom>
    </>
  );
}

export default NftAddress;
