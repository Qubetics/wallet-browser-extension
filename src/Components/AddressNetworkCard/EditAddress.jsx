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


export const EditAddress = ({ editModal, setEditModal, heading, editData, setEditData, handleSubmit, selectedChain, setSelectedChain, chains, address, changeChain }) => {
    const [messageApi, contextHolder] = message.useMessage();

    useEffect(() => {
        if (editData) {
            const selectedChain = chains.find((el) => el?.coinFamily == editData?.coin_family);
            setSelectedChain(selectedChain);
        }
    }, [JSON.stringify(editData)]);

    let selectAfterTo = (
        <div className={'addonAfter'}>
            <Select
                placement='bottomRight'
                popupClassName='placementRightPopup'
                options={Array.isArray(chains) && chains.map((myChain) => {
                    return {
                        value: myChain?.coinFamily,
                        label: (
                            <span
                                className='flexedItemSelect'
                                style={{
                                    textAlign: 'center',
                                }}
                            >
                                <img src={myChain?.image} className={style.chainImage} alt='' />
                                {myChain?.currencySymbol}
                            </span>
                        ),
                    };
                })}
                value={[
                    {
                        value: selectedChain?.coinFamily,
                        label: (
                            <span
                                className='flexedItemSelect'
                                style={{
                                    textAlign: 'center',
                                }}
                            >
                                <img src={selectedChain?.image} className={style.chainImage} alt='' />
                                {selectedChain?.currencySymbol}
                            </span>
                        ),
                    },
                ]}
                onChange={(value) => {
                    const selectedChain = chains.find((el) => el?.coinFamily == value);

                    // changeChain(value)
                    // setEditData((prevState) => ({ ...prevState, name: selectedChain?.currencyName, coin_family: selectedChain?.coinFamily, }))
                    setEditData((prevState) => ({
                        ...prevState,
                        name: selectedChain?.currencyName,
                        coin_family: selectedChain?.coinFamily,
                        coin: {
                            ...prevState.coin,  // Preserve other properties of coin
                            coin_data: {
                                ...prevState.coin?.coin_data,  // Preserve other properties of coin_data
                                coin_image: selectedChain?.image
                            }
                        }
                    }));

                    setSelectedChain(selectedChain);
                }}
                style={{
                    width: '100',
                }}
            />
        </div>
    );


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
                            <InputField
                                placeholder={editData?.coin_family}
                                label='Network'
                                readonly={true}
                                addonAfter={selectAfterTo}
                                value={editData?.coin_family == 1 ? "BNB" : editData?.coin_family == 2 ? "ETH" : "POL"}
                            />
                            <InputFieldOnly
                                placeholder='Enter Address Name'
                                label='Address Name'
                                getData={(name) => {
                                    if (name.length <= 25) {
                                        if (/^\s/.test(name)) {
                                            setEditData((prevState) => ({
                                                ...prevState,
                                                name: "",
                                            }));

                                        } else {
                                            setEditData((prevState) => ({
                                                ...prevState,
                                                name: name,
                                            }));
                                        }
                                    } else {
                                        return;
                                    }
                                }}
                                value={heading}
                                checkForSymbols={true}
                                disabled={true}

                            />

                            <InputField
                                placeholder='Wallet Address'
                                label='Address or Naming Service'
                                getData={(address) => {
                                    setEditData((prevState) => ({
                                        ...prevState,
                                        wallet_address: address,
                                    }));
                                }}
                                value={editData?.wallet_address}
                                checkForSymbols={true}
                                addonAfter={
                                    <div className={style.token__selectStyle}>
                                        <span
                                        style={{color:"#fff"}}
                                            className={style.token__pasteText}
                                            onClick={async () => {
                                                const data = await navigator.clipboard.readText();
                                                setEditData((prevState) => ({
                                                    ...prevState,
                                                    wallet_address: data,
                                                }));
                                            }}
                                        >
                                            Paste
                                        </span>
                                    </div>
                                }
                            />

                            <Link
                                to='/manage'
                                onClick={async (e) => {
                                    e.preventDefault();

                                    if (!address) {
                                        return messageApi.error('Address for the contact is required.');
                                    }

                                    if (!editData?.name) {
                                        return messageApi.error('Name for the contact is required.');
                                    }

                                    if (editData?.name.trim().length === 0) {
                                        return messageApi.error(
                                            'Name should have a minimum of 2 characters.'
                                        );
                                    }

                                    if (editData?.name.length < 2) {
                                        return messageApi.error(
                                            'Name should have a minimum of 2 characters.'
                                        );
                                    }

                                    if (editData?.name.length > 25) {
                                        return messageApi.error(
                                            'Name should not have more than 25 characters.'
                                        );
                                    }

                                    // const format = /[!@#$%^`&*()_+\-=\[\]{};':"\\|,.<>\/?]+/;

                                    // if (format.test(name)) {
                                    //   return messageApi.error(
                                    //     "Name should not contain any special characters."
                                    //   );
                                    // }

                                    if (selectedChain.isEVM) {
                                        const valid = ethers.utils.isAddress(editData?.wallet_address);
                                        if (!valid)
                                            return messageApi.error(
                                                `Please provide a valid ${selectedChain.chainName == 'Polygon'?"Pol":selectedChain.chainName} address.`
                                            );
                                    } else if (
                                        !selectedChain.isEVM &&
                                        selectedChain.currencyName === 'SOL'
                                    ) {
                                        const regexPattern = /^([1-9A-HJ-NP-Za-km-z]{32,44})$/;
                                        if (!regexPattern.test(editData?.wallet_address)) {
                                            return messageApi.error(
                                                `Please provide a valid ${selectedChain.chainName} address.`
                                            );
                                        }
                                    } else if (
                                        !selectedChain.isEVM &&
                                        selectedChain.currencyName === 'BTC'
                                    ) {
                                        const valid = validate(editData?.wallet_address);
                                        if (!valid) {
                                            return messageApi.error(
                                                `Please provide a valid ${selectedChain.chainName} address.`
                                            );
                                        }
                                    } else if (
                                        !selectedChain.isEVM &&
                                        selectedChain.currencyName === 'ADA'
                                    ) {
                                        const valid = WAValidator.validate(editData?.wallet_address, 'ada');
                                        if (!valid) {
                                            return messageApi.error(
                                                `Please provide a valid ${selectedChain.chainName} address.`
                                            );
                                        }
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