import React, { useEffect, useState } from 'react';
import MenuRestofHeaders from '../../Components/BalanceDetails/MenuRestofHeaders/MenuRestofHeaders';
import { QRCode } from 'react-qrcode-logo';
import { message, Select } from 'antd';
import CopyIcon from '../../Assets/CopyIcon.svg';
import './Receive.scss';
import ButtonComp from '../../Components/ButtonComp/ButtonComp';
import { useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { getCosmosAddress } from '../../helpers/cosmos.helper';

function ReceiveCurrency() {
  const [options, setOptions] = useState([]);
  const [selectedOption, setSelectedOption] = useState('');
  const [selectedCoin, setSelectedCoin] = useState({
    wallet_address: 'your-wallet-address',
    coin: {
      coin_image: 'path-to-coin-image',
      coin_symbol: 'BTC',
    },
  });
  const { account } = useSelector((state) => state);
  const [messageApi, contextHolder] = message.useMessage();
  const location = useLocation();

  // console.log(
  //   'location state in receive currency detail:',
  //   location?.state?.coin?.coin?.coin_family
  // );

  useEffect(() => {
    const coin = {
      wallet_address: location?.state?.coin?.wallet_address, // Replace with actual address or dynamic data

      coin: {
        coin_image: location?.state?.coin?.coin?.coin_image, // Replace with actual coin image

        coin_symbol: location?.state?.symbol, // Replace with actual coin symbol
      },
    };

    setSelectedCoin(coin);
    if (location?.state?.coin?.coin?.coin_family === 7) {
      getCosmosAddress()
        .then((data) => {
          // console.log('log', data);
          // console.log('🚀 ~ useEffect ~ cosmos_address:', data);
          setOptions((prev) => [
            ...prev,
            {
              label: 'Qubetics Address',
              value: location?.state?.coin?.wallet_address,
            },
            { label: 'Cosmos Address', value: data },
          ]);
          setSelectedOption(location?.state?.coin?.wallet_address);
        })
        .catch((error) => {
          // console.log('error');
        });
    }
  }, []);

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      messageApi.success('Address copied successfully.');
    } catch (error) {
      messageApi.error('Failed to copy address.');
    }
  };

  const isReceiveCurrencyRoute = location.state?.nftButton;

  function copyAddressToClipboard(address) {
    navigator.clipboard.writeText(address);
    messageApi.success('Address copied successfully.');
  }

  return (
    <div className="receiveCurrency scrollableCont">
      {contextHolder}
      <MenuRestofHeaders
        backTo={
          location?.state?.backTo
            ? location.state.backTo
            : isReceiveCurrencyRoute
            ? '/nftDetail'
            : '/receive-tokens'
        }
        title={
          isReceiveCurrencyRoute
            ? `Receive NFT`
            : `Receive ${location?.state?.symbol?.toUpperCase()}`
        }
      />
      <div className="receiveCurrency_content  manageWalletHeight">
        <div className={`flexedContent padding-Top`}>
          <div className="receiveCurrency_balanceDetails">
            <QRCode
              value={
                selectedOption
                  ? selectedOption
                  : isReceiveCurrencyRoute
                  ? account?.coinFamilyAndAddress[2]
                  : selectedCoin.wallet_address
              }
              size={230}
              qrStyle="dots"
              eyeRadius={10}
              logoImage={
                isReceiveCurrencyRoute ? null : selectedCoin.coin.coin_image
              }
              logoHeight={55}
              logoWidth={55}
              logoPadding={8}
              logoPaddingStyle="circle"
              bgColor="#000"
              fgColor="#fff"
            />
          </div>
          {location?.state?.coin?.coin?.coin_family === 7 && (
             <div className='inputpaddingIssue'>
              <div className={"filterHistory__selctHis"}>
              <Select
                value={selectedOption}
                popupClassName="filterHistoryDropdown"
                onChange={(value) => {
                  // console.log('value', value);
                  setSelectedOption(value);
                }}
                options={options.map((option) => ({
                  value: option.value,
                  label: (
                    <span >{option.label}</span>
                  ),
                }))}
                placeholder='Select Chain'
              />
              </div>
            </div>
          )}
          {location?.state?.coin?.coin?.coin_family == 7 ? (
            <div className="receiveCurrency_copy">
              <div>
                <p>{selectedOption.startsWith('qubetics1') ? 'Your Cosmos Address':'Your Qubetics Address'}</p>
                <h5>
                  {selectedOption?.slice(0, 10)}...{selectedOption?.slice(-8)}
                </h5>
              </div>
              <ButtonComp
                onClick={() => copyAddressToClipboard(selectedOption)}
                text={
                  <span className="copyText">
                    Copy <img src={CopyIcon} alt="copy" />
                  </span>
                }
                maxWidth={'88px'}
              />
            </div>
          ) : (
            <div className="receiveCurrency_copy">
              <div>
                <p>Your Qubetics Address</p>
                <h5>
                  {isReceiveCurrencyRoute
                    ? `${account?.coinFamilyAndAddress[2].slice(
                        0,
                        8
                      )}...${account?.coinFamilyAndAddress[2].slice(-10)}`
                    : `${selectedCoin.wallet_address.slice(
                        0,
                        8
                      )}...${selectedCoin.wallet_address.slice(-10)}`}
                </h5>
              </div>
              <ButtonComp
                onClick={() =>
                  isReceiveCurrencyRoute
                    ? copyAddressToClipboard(account?.coinFamilyAndAddress[2])
                    : copyAddressToClipboard(selectedCoin.wallet_address)
                }
                text={
                  <span className="copyText">
                    Copy <img src={CopyIcon} alt="copy" />
                  </span>
                }
                maxWidth={'88px'}
              />
            </div>
          )}

          <p className="receiveCurrency_sendCoin">
            Send only{' '}
            {`${location?.state?.symbol?.toUpperCase() ?? 'Qubetics (TICS)'}`} to
            this address. Sending any other coins may result in permanent loss.
          </p>
        </div>
      </div>
    </div>
  );
}

export default ReceiveCurrency;
