/*global chrome*/

import React, { useEffect } from "react";
import "./AddressNetworkCard.scss";
import ModalCustom from "../ModalCustom/ModalCustom";
import { Link } from "react-router-dom";
import style from '../../Pages/AddContact/style.module.scss';
import { InputField, InputFieldOnly } from "../InputField/InputFieldSimple";
import { ethers } from "ethers";
import { validate } from 'bitcoin-address-validation';
import ButtonComp from "../ButtonComp/ButtonComp";
import { message, Select } from "antd";

var WAValidator = require('multicoin-address-validator');


export const EditAddressMain = ({ editModal, setEditModal, editData, setEditData, handleSubmit, selectedChain, setSelectedChain, chains, address }) => {
    const [messageApi, contextHolder] = message.useMessage();


    useEffect(() => {
        const selectedChain = chains.find((el) => el?.coinFamily == editData?.coin_family);
        setSelectedChain(selectedChain);
    }, [editData]);



    return (
        <>
            {contextHolder}
            <ModalCustom
                title={"Edit Address"}
                isModalOpen={editModal}
                customClass="customClassModal"
                handleCancel={() => {
                    setEditData(null);
                    setEditModal(false);
                }}
            >
                <div className="viewphrases">

                    {<div className={`flexedContent`}>
                        <div className={style.token}>
                            <InputFieldOnly
                                placeholder='Enter Address Name'
                                label='Address Name'
                                getData={(name) => {
                                    if (name.length <= 25) {
                                        if (/^\s/.test(name)) {
                                            setEditData((prevState) => ({
                                                ...prevState,
                                                address_book_name: "",
                                            }));

                                        } else {
                                            setEditData((prevState) => ({
                                                ...prevState,
                                                address_book_name: name,
                                            }));
                                        }
                                    } else {
                                        return;
                                    }
                                }}
                                value={editData?.address_book_name}
                                checkForSymbols={true}
                            />

                            <InputField
                                disabled={true}
                                placeholder='Wallet Address'
                                label='Address or Naming Service'
                                // getData={(address) => {
                                //     setEditData((prevState) => ({
                                //         ...prevState,
                                //         wallet_address: address,
                                //     }));
                                // }}
                                value={editData?.wallet_address}
                                checkForSymbols={true}
                            />

                            <Link
                                to='/manage'
                                onClick={async (e) => {
                                    e.preventDefault();
                                    if (!address) {
                                        return messageApi.error('Address for the contact is required.');
                                    }
                                    if (!editData?.address_book_name) {
                                        return messageApi.error('Name for the contact is required.');
                                    }
                                    if (editData?.address_book_name.trim().length === 0) {
                                        return messageApi.error(
                                            'Name should have a minimum of 2 characters.'
                                        );
                                    }
                                    if (editData?.address_book_name.length < 2) {
                                        return messageApi.error(
                                            'Name should have a minimum of 2 characters.'
                                        );
                                    }
                                    if (editData?.address_book_name.length > 25) {
                                        return messageApi.error(
                                            'Name should not have more than 25 characters.'
                                        );
                                    }
                                    await handleSubmit();
                                }}
                            >
                                <ButtonComp
                                    text={'Confirm'}
                                    maxWidth={'100%'}
                                />
                            </Link>
                        </div>
                    </div>}
                </div>
            </ModalCustom>
        </>
    );
}