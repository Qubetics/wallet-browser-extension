/*global chrome*/
import React, { useState, useEffect } from 'react';
import TokenDrawer from './TokenDrawer';
import { InputField } from '../../Components/InputField/InputFieldSimple';
import ButtonComp from '../../Components/ButtonComp/ButtonComp';
import { Select, message } from 'antd';
import { server } from '../../server';
import { useSelector } from 'react-redux';
import { DURATION } from '../../config/message.config';

const Buy = ({ coins = [], fiats = [], loading }) => {
    const { account ,theme } = useSelector((state) => state);
    const [messageApi, contextHolder] = message.useMessage({
        duration: DURATION,
        maxCount: 1,
    });
    const [open, setOpen] = useState(false);
    const [keyword, setKeyword] = useState('');
    const [filteredTokens, setFilteredTokens] = useState([]);
    const [amount, setAmount] = useState('');
    const [receiveAmount, setReceiveAmount] = useState('');
    const [selectedFiat, setSelectedFiat] = useState(null);
    const [selectedCoin, setSelectedCoin] = useState(null);
    const [sel, setSel] = useState(0);
    const [isAmountValid, setIsAmountValid] = useState(true);


    console.log(selectedFiat, "selectedFiat", selectedCoin, "selectedCoin", coins, "coins", fiats, "fiats", filteredTokens, "filteredTokens");
    console.log(account, "accountaccountaccountaccount");
     
    useEffect(()=>{
        if(amount === ""){
            setReceiveAmount("")
        }
    },[amount])

    useEffect(() => {
        if (fiats.length > 0) setSelectedFiat(fiats[0]);
        if (coins.length > 0) setSelectedCoin(coins[0]);
    }, [fiats, coins]);

    useEffect(() => {
        setFilteredTokens(sel === 0 ? fiats : coins);
    }, [sel, fiats, coins]);

    const handleSearch = (searchTerm) => {
        setKeyword(searchTerm);
        if (sel === 0) {
            setFilteredTokens(
                fiats.filter((fiat) =>
                    fiat.currency_name?.toLowerCase().includes(searchTerm.toLowerCase())
                )
            );
        } else {
            setFilteredTokens(
                coins.filter((coin) =>
                    coin.coin_name?.toLowerCase().includes(searchTerm.toLowerCase())
                )
            );
        }
    };

    const handleSelectToken = (token) => {
        if (sel === 0) {
            setSelectedFiat(token);
        } else {
            setSelectedCoin(token);
        }
        setOpen(false);
    };

    const handleAddonClick = (type) => {
        setSel(type);
        setFilteredTokens(sel === 0 ? fiats : coins);
        setOpen(true);
    };

    const handleFieldChange = async (amount) => {
        if (!amount) {
            setAmount('');
            setReceiveAmount(''); 
            setIsAmountValid(true); 
            return;
        }
        setAmount(amount);
        
        if (selectedCoin && selectedFiat && amount) {
            try {
                const { data } = await server.post(
                    `/moonpay/realTimeBuyQuote`,
                    {
                        crypto: selectedCoin.coin_symbol,
                        fiat: selectedFiat.currency_code,
                        cryptoAmount: amount,
                    },
                    { headers: { Authorization: account.jwtToken } }
                );
                setReceiveAmount(data?.quoteCurrencyAmount || '');
                const minAmount = data?.baseCurrency?.minBuyAmount;
                const maxAmount = data?.baseCurrency?.maxBuyAmount;

                if (amount < minAmount || amount > maxAmount) {
                    setIsAmountValid(false);
                    messageApi.error(`Amount should be between ${minAmount} and ${maxAmount}`);
                    return;
                } else {
                    setIsAmountValid(true);
                }

            } catch (error) {
                messageApi.error("This pair is not available for purchase")
                setAmount('')
                setReceiveAmount('');
                setIsAmountValid(false)
            }
        } else {
            messageApi.error("This pair is not available for purchase")
            setAmount('')
            setReceiveAmount('');
            setIsAmountValid(false)
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            if (selectedCoin && selectedFiat && amount) {
                handleFieldChange(amount);
            }
        }, 1000);

        return () => clearTimeout(timer);
    }, [selectedCoin, selectedFiat, amount]);

    const handleBuy = async () => {
        try {
            const { data } = await server.post(
                '/moonpay/signature',
                {
                    flow: 'buy',
                    baseCurrencyCode: selectedFiat.currency_code,
                    defaultCurrencyCode: selectedCoin.coin_symbol,
                    baseCurrencyAmount: amount,
                    walletAddress: account.address,
                },

                { headers: { Authorization: account.jwtToken } }
            );

            if (data?.data) {
                messageApi.success('Transaction initiated successfully!');
                setAmount('');
                setReceiveAmount('');
    
                if (chrome && chrome.tabs) {
                    chrome.tabs.create({ url: data.data });
                } else {
                    window.open(data.data, '_blank');
                }
            } else {
                messageApi.error('No URL received from the API.');
            }
        } catch (error) {
            console.error('Error initiating transaction:', error);
            messageApi.error('Failed to initiate transaction. Please try again.');
        }
    };


    const selectAfter = (
        <div className={'addonAfter'}>
            <Select
                open={false}
                value={[
                    {
                        value: selectedFiat?.currency_id,
                        label: (
                            <span className='flexedItemSelect'>
                                {selectedFiat?.image ? (
                                    <img
                                        style={{
                                            height: '20px',
                                            width: '20px',
                                            objectFit: 'contain',
                                            position: 'relative',
                                            borderRadius: '15px',
                                        }}
                                        src={selectedFiat?.image}
                                    />
                                ) : (
                                    <div
                                        className='randb extra'
                                        style={{
                                            height: '35px',
                                            width: '35px',
                                            background: 'rgb(202, 201, 201)',
                                            borderRadius: '50%',
                                            display: 'flex',
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                        }}
                                    >
                                        {selectedFiat?.currency_name?.split('')[0]}
                                    </div>
                                )}
                                {selectedFiat?.currency_name}
                            </span>
                        ),
                    },
                ]}
                defaultValue={[
                    {
                        value: selectedFiat?.currency_id,
                        label: (
                            <span className='flexedItemSelect'>
                                {selectedFiat?.image ? (
                                    <img
                                        style={{
                                            height: '20px',
                                            width: '20px',
                                            objectFit: 'contain',
                                            borderRadius: '15px',
                                        }}
                                        src={selectedFiat?.image}
                                    />
                                ) : (
                                    <div
                                        className='randb extra'
                                        style={{
                                            height: '35px',
                                            width: '35px',
                                            background: 'rgb(202, 201, 201)',
                                            borderRadius: '50%',
                                            display: 'flex',
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                        }}
                                    >
                                        {selectedFiat?.currency_name?.split('')[0]}
                                    </div>
                                )}
                                {selectedFiat?.currency_name}
                            </span>
                        ),
                    },
                ]}
                style={{
                    width: 100,
                }}
                onClick={() => {
                    handleAddonClick(0);
                }}
            />
        </div>
    );

    const selectAfter2 = (
        <div className={'addonAfter'}>
            <Select
                open={false}
                value={[
                    {
                        value: selectedCoin?.coin_id,
                        label: (
                            <span className='flexedItemSelect'>
                                {selectedCoin?.coin_image ? (
                                    <img
                                        style={{
                                            height: '20px',
                                            width: '20px',
                                            objectFit: 'contain',
                                            position: 'relative',
                                            borderRadius: '15px',
                                        }}
                                        src={selectedCoin?.coin_image}
                                    />
                                ) : (
                                    <div
                                        className='randb extra'
                                        style={{
                                            height: '35px',
                                            width: '35px',
                                            background: 'rgb(202, 201, 201)',
                                            borderRadius: '50%',
                                            display: 'flex',
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                        }}
                                    >
                                        {selectedCoin?.coin_name?.split('')[0]}
                                    </div>
                                )}
                                {selectedCoin?.coin_name}
                            </span>
                        ),
                    },
                ]}
                defaultValue={[
                    {
                        value: selectedCoin?.coin_id,
                        label: (
                            <span className='flexedItemSelect'>
                                {selectedCoin?.coin_image ? (
                                    <img
                                        style={{
                                            height: '20px',
                                            width: '20px',
                                            objectFit: 'contain',
                                            borderRadius: '15px',
                                        }}
                                        src={selectedCoin?.coin_image}
                                    />
                                ) : (
                                    <div
                                        className='randb extra'
                                        style={{
                                            height: '35px',
                                            width: '35px',
                                            background: 'rgb(202, 201, 201)',
                                            borderRadius: '50%',
                                            display: 'flex',
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                        }}
                                    >
                                        {selectedCoin?.coin_name?.split('')[0]}
                                    </div>
                                )}
                                {selectedCoin?.coin_name}
                            </span>
                        ),
                    },
                ]}
                style={{
                    width: 100,
                }}
                onClick={() => {
                    handleAddonClick(1);
                }}
            />
        </div>
    );

    return (
        <div className="swap">
            {contextHolder}
            <InputField
                mb0={true}
                checkForSymbols={true}
                inputSelect={true}
                placeholder={'0.000'}
                label="You Pay"
                type="number"
                disabled={loading}
                addonAfter={selectAfter}
                getData={setAmount}
                value={amount}
            />

            <InputField
                mb0={true}
                inputSelect={true}
                placeholder={'0.000'}
                label="You Receive"
                type="number"
                checkForSymbols={true}
                disabled={true}
                addonAfter={selectAfter2}
                value={receiveAmount}
            />

            {/* <div className="buy_sell_des">
                Buy/Sell digital assets are supported by Moonpay. Digital assets are high risk. Make sure you understand the risks associated with each digital asset before you invest.
            </div> */}

            <div style={{ width: '100%' }}>
                <ButtonComp 
                   text="Buy" 
                   maxWidth={'100%'} 
                   onClick={handleBuy} 
                   disabled ={!amount || !isAmountValid || loading}
                />
            </div>

            <TokenDrawer
                open={open}
                onClose={() => setOpen(false)}
                tokens={filteredTokens}
                keyword={keyword}
                setKeyword={setKeyword}
                handleSearch={handleSearch}
                handleSelectToken={handleSelectToken}
                theme={theme}
            />
        </div>
    );
};

export default Buy;
