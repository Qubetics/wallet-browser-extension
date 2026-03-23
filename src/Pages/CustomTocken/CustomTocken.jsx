/*global chrome*/
import React, { useEffect, useState } from 'react';
import { Checkbox, Drawer, message, Select } from 'antd';
import MenuRestofHeaders from '../../Components/BalanceDetails/MenuRestofHeaders/MenuRestofHeaders.jsx';
import style from './style.module.scss';
import { InputField } from '../../Components/InputField/InputFieldSimple.jsx';
import { InputFieldOnly } from '../../Components/InputField/InputFieldSimple.jsx';
import ButtonComp from '../../Components/ButtonComp/ButtonComp.jsx';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ethers } from 'ethers';
import { store } from '../../index.js';
import { setLoading } from '../../actions/loading.js';
import ModalCloseIcon from '../../Assets/ModalCloseIcon.svg';
import Copy from '../../Assets/CopyIconBlue.svg';
import navigateiCON from '../../Assets/topnavigate.svg';
import darkclose from '../../Assets/darkclose.svg';
import { DURATION } from '../../config/message.config.js';
import { server } from '../../server.js';
import ModalCustom from '../../Components/ModalCustom/ModalCustom.jsx';
import warning from '../../Assets/PNG/warning.png';
import info from '../../Assets/Info.svg';
var WAValidator = require('multicoin-address-validator');

function CustomToken() {
  const [disabled, setDisabled] = useState(false);
  const { chain, account } = useSelector((state) => state);
  const [tokenAddress, setTokenAddress] = useState(null);
  const [messageApi, contextHolder] = message.useMessage({
    duration: DURATION,
    maxCount: 1,
  });
  const [modal, setModal] = useState(false);
  const [modalEth, setModalEth] = useState(false);
  const [understand, setUnderstand] = useState(false);

  const { state } = useLocation();

  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [policyTokens, setPolicyToken] = useState([]);
  const [tokenInfo, setTokenInfo] = useState({
    name: null,
    symbol: null,
    decimals: null,
    image: null,
  });
  const [chains, setChains] = useState([]);
  const [selectedChain, setSelectedChain] = useState(chain);
  const { theme } = useSelector((state) => state);
  const [assetAddress, setAssetAddress] = useState(null);

  const selectURL = (coinFamily) => {
    let explorer = '';

    switch (coinFamily) {
      case 1:
        coinFamily = 'ETH';
        explorer = `https://etherscan.io/token/${tokenAddress}`;
        break;
      case 3:
        coinFamily = 'BNB';
        explorer = `https://bscscan.com/token/${tokenAddress}`;
        break;
      case 9:
        coinFamily = 'PLS';
        explorer = `https://scan.mypinata.cloud/ipfs/bafybeih3olry3is4e4lzm7rus5l3h6zrphcal5a7ayfkhzm5oivjro2cp4/#/token/${tokenAddress}`;
        break;
      case 4:
        coinFamily = 'SOL';
        explorer = `https://solscan.io/token/${tokenAddress}`;
        break;
      default:
        break;
    }

    return explorer;
  };

  const selectAfterTo = (
    <div className={'addonAfter'}>
      <Select
        placement="bottomRight"
        popupClassName="placementRightPopup"
        disabled={state ? (state.swap ? true : false) : false}
        options={chains.map((myChain) => {
          return {
            value: myChain.coinFamily,
            label: (
              <span
                className="flexedItemSelect"
                style={{
                  textAlign: 'center',
                }}
              >
                <img src={myChain.image} className={style.chainImage} alt="" />
                {myChain.currencySymbol}
              </span>
            ),
          };
        })}
        value={
          selectedChain
            ? {
                value: selectedChain?.coinFamily,
                label: (
                  <span
                    className="flexedItemSelect"
                    style={{
                      textAlign: 'center',
                    }}
                  >
                    <img
                      src={selectedChain?.image}
                      className={style.chainImage}
                      alt=""
                    />
                    {selectedChain?.currencySymbol}
                  </span>
                ),
              }
            : null
        }
        onChange={(value) => {
          setTokenAddress(null);
          const selectedChain = chains.find((el) => el.coinFamily == value);
          setSelectedChain(selectedChain);
          setTokenAddress(null);
          setTokenInfo({
            name: null,
            symbol: null,
            decimals: null,
            image: null,
          });
        }}
        style={{
          width: '100',
        }}
      />
    </div>
  );

  const init = async () => {
    const { chains } = await chrome.storage.local.get('chains');

    setChains(
      chains.filter(
        (el) => el.supportTokens && account.coinFamilyAndAddress[el.coinFamily]
      )
    );

    setSelectedChain(
      state?.swap
        ? chains.find((chain) => chain.coinFamily == state.swap)
        : chains.filter(
            (el) =>
              el.supportTokens && account.coinFamilyAndAddress[el.coinFamily]
          )[0]
    );
  };

  useEffect(() => {
    init();
  }, []);

  const getTheToken = async (address) => {
    try {
      store.dispatch(setLoading(true));

      const tokenData = await server.post(
        `/wallet/search`,
        {
          tokenAddress: address,
          coinFamily: selectedChain.coinFamily,
          // coin_symbol: '',
        },
        {
          headers: {
            Authorization: account.jwtToken,
          },
        }
      );

      setTokenInfo({
        name: tokenData.data.data.name,
        symbol: tokenData.data.data.symbol,
        decimals: tokenData.data.data.decimals,
      });

      store.dispatch(setLoading(false));
    } catch (error) {
      // console.log('~ CustomToken.jsx ~ 191 :', error);

      store.dispatch(setLoading(false));
      return messageApi.error('Please enter a valid address.');
    }
  };

  return (
    <div className={`scrollableCont`}>
      {contextHolder}
      <MenuRestofHeaders
        backTo={state ? (state.swap ? '/swap' : '/wallet') : '/wallet'}
        title={'Add Custom Token'}
        // manage={state ? (state.swap ? '/swap' : '/wallet') : '/manage'}
      />
      <div className={`flexedContent tokenHeight`}>
        <div className="warrningMsg">
          <img src={info} alt="" />
          <p>
            Anyone can create a token, including fake versions of existing
            tokens, Learn about scams and security risks.
          </p>
        </div>
        <div className={style.token}>
          <InputField
            label="Select Network"
            value={selectedChain.chainName}
            readonly={true}
            checkForSymbols={true}
            addonAfter={selectAfterTo}
          />
          <InputField
            placeholder={'Contract Address'}
            label={'Contract Address'}
            value={tokenAddress}
            checkForSymbols={true}
            getData={async (address) => {
              if (address === '') {
                setTokenInfo({
                  name: '',
                  symbol: '',
                  decimals: '',
                });
              }
              setTokenAddress(address);

              if (selectedChain.isEVM) {
                const valid = ethers.utils.isAddress(address);
                if (!valid) return;
              } else if (
                !selectedChain.isEVM &&
                selectedChain.currencyName === 'SOL'
              ) {
                const regexPattern = /^([1-9A-HJ-NP-Za-km-z]{32,44})$/;
                if (!regexPattern.test(address)) {
                  return;
                }
              } else if (
                !selectedChain.isEVM &&
                selectedChain.currencyName === 'ADA'
              ) {
                const regexPattern = /^[A-Za-z\d]{56}$/;
                if (!regexPattern.test(address)) {
                  return;
                }
              }

              await getTheToken(address);
            }}
            addonAfter={
              <div className={style.token__selectStyle}>
                <span
                  className={style.token__pasteText}
                  onClick={async () => {
                    const data = await navigator.clipboard.readText();
                    setTokenAddress(data);

                    if (selectedChain.isEVM) {
                      const valid = ethers.utils.isAddress(data);
                      if (!valid)
                        return messageApi.error(
                          'Please enter a valid address.'
                        );
                    } else if (
                      !selectedChain.isEVM &&
                      selectedChain.currencyName === 'SOL'
                    ) {
                      const regexPattern = /^([1-9A-HJ-NP-Za-km-z]{32,44})$/;
                      if (!regexPattern.test(data)) {
                        return messageApi.error(
                          'Please enter a valid address.'
                        );
                      }
                    } else if (
                      !selectedChain.isEVM &&
                      selectedChain.currencyName === 'ADA'
                    ) {
                      const regexPattern = /^[A-Za-z\d]{56}$/;
                      if (!regexPattern.test(data)) {
                        return messageApi.error(
                          'Please enter a valid policy id.'
                        );
                      }
                    }

                    await getTheToken(data);
                  }}
                >
                  Paste
                </span>
              </div>
            }
          />
          <InputFieldOnly
            label="Token Name"
            value={tokenInfo.name}
            placeholder="Token Name"
            readonly={true}
            getData={(val) => {
              setTokenInfo({ ...tokenInfo, name: val });
            }}
            checkForSymbols={true}
          />

          <div
            className={style.token__symbol_dec}
            style={{ display: 'flex', gap: '20px' }}
          >
            <InputFieldOnly
              label="Symbol"
              placeholder="Symbol"
              readonly={true}
              value={tokenInfo.symbol}
              getData={(val) => {
                setTokenInfo({ ...tokenInfo, symbol: val });
              }}
              checkForSymbols={true}
            />
            <InputFieldOnly
              label="Decimal"
              placeholder="Decimal"
              readonly={true}
              value={tokenInfo.decimals}
              getData={(val) => {
                setTokenInfo({ ...tokenInfo, decimals: val });
              }}
              checkForSymbols={true}
            />
          </div>
          <Link
            to="/manage"
            onClick={async (e) => {
              e.preventDefault();
              try {
                if (!tokenAddress) {
                  return messageApi.error('Token address is required.');
                }

                if (!tokenInfo.name) {
                  return messageApi.error('Token name is required');
                }

                if (!tokenInfo.symbol) {
                  return messageApi.error('Token symbol is required');
                }

                if (selectedChain.isEVM) {
                  const valid = ethers.utils.isAddress(tokenAddress);
                  if (!valid)
                    return messageApi.error('Invalid token address provided.');
                } else if (
                  !selectedChain.isEVM &&
                  selectedChain.currencyName === 'SOL'
                ) {
                  const regexPattern = /^([1-9A-HJ-NP-Za-km-z]{32,44})$/;
                  if (!regexPattern.test(tokenAddress)) {
                    return messageApi.error('Please enter a valid address.');
                  }
                } else if (
                  !selectedChain.isEVM &&
                  selectedChain.currencyName === 'ADA'
                ) {
                  const regexPattern = /^[A-Za-z\d]{56}$/;
                  if (!regexPattern.test(tokenAddress)) {
                    return messageApi.error('Please enter a valid policy id.');
                  }
                }

                store.dispatch(setLoading(true));
                const resp = await server.post(
                  '/wallet/addtoken',
                  {
                    name: tokenInfo.name,
                    symbol: tokenInfo.symbol,
                    coin_gicko_alias: tokenInfo.symbol,
                    decimals: tokenInfo.decimals.toString(),
                    token_address: tokenAddress,
                    coin_family: selectedChain.coinFamily,
                    wallet_address:
                      account.coinFamilyAndAddress[selectedChain.coinFamily],
                    wallet_name: account.name,
                    token_type: selectedChain.tokenType,
                    isSwapList: selectedChain?.swap,
                    // coin_gicko_id: "",
                  },
                  {
                    headers: {
                      Authorization: account.jwtToken,
                    },
                  }
                );
                setDisabled(true);
                store.dispatch(setLoading(false));

                messageApi.success(resp?.data?.message);

                setTimeout(() => {
                  navigate('/wallet');
                }, 1000);
              } catch (error) {
                store.dispatch(setLoading(false));

                const errorMessage = error?.response?.data?.message;

                if (typeof errorMessage === 'string') {
                  return messageApi.error(errorMessage);
                } else {
                  return messageApi.error('Something went wrong');
                }
              }
            }}
          >
            {' '}
            <div className="bottomBtn">
              <ButtonComp
                disabled={disabled}
                text={'Add Token'}
                maxWidth={'100%'}
              />
            </div>
          </Link>
        </div>
      </div>

      <Drawer
        title="Available tokens"
        placement="bottom"
        onClose={() => {
          setOpen(false);
        }}
        open={open}
        height={'200px'}
        // eslint-disable-next-line jsx-a11y/alt-text
        closeIcon={
          theme == 'darkTheme' ? (
            <img src={darkclose} />
          ) : (
            <img src={ModalCloseIcon} />
          )
        }
      >
        {policyTokens.map((ele, index) => (
          <div
            className={style.swapDrawer}
            onClick={async () => {
              const tokenData = await server.get(
                `/wallet/token/search?coin_family=${selectedChain.coinFamily}&token_address=${ele.asset}`,
                {
                  headers: {
                    Authorization: account.jwtToken,
                  },
                }
              );

              setAssetAddress(ele.asset);

              setTokenInfo({
                name: tokenData.data.data.coin_name,
                symbol: tokenData.data.data.coin_symbol,
                decimals: tokenData.data.data.decimals,
              });

              store.dispatch(setLoading(false));
              setOpen(false);
            }}
          >
            <div key={index} className={style.swapDrawer__left}>
              <img
                src="https://cdn-icons-png.flaticon.com/512/9544/9544154.png"
                width={30}
                height={30}
                alt=""
              />
              <div className={style.swapDrawer__left__texts}>
                <div className={style.swapDrawer__left__textsTop}>
                  {ele.asset_name}
                  {/* {'\x00 á@adapeDunstanCox'} */}
                </div>
              </div>
            </div>
          </div>
        ))}
      </Drawer>
      <ModalCustom
        title={'Import Tokens'}
        isModalOpen={modal}
        customClass="customClassModal importTokenModal"
        handleCancel={() => {
          setModal(false);
        }}
      >
        <div
          className={`${style.mainWarning} importToken`}
          style={{
            display: 'flex',
          }}
        >
          <div className="left" style={{ flex: 1 }}>
            <img src={warning} alt="" style={{ width: '27px' }} />
          </div>
          <div className="right" style={{ flex: 7 }}>
            {/* <p>
              Anyone can create tokens on BNB Smart Chain with any name,
              including creating fake versions of existing tokens and tokens
              that claim to represent projects that do not have a token.
            </p>
            <p style={{ fontWeight: 'bold', marginTop: '13px' }}>
              If you purchase a fraudulent token, you may be exposed to
              permanent loss of funds.
            </p> */}
            <p style={{ marginBottom: 0 }}>
              Anyone can create a token on a blockchain. These may be fake
              versions of existing tokens, or tokens created by parties with bad
              intentions. Before importing any token, do you own research and
              ensure you have the correct contract address.
            </p>
            <p>
              Purchasing a fraudulent token can lead to the total loss of your
              funds.
            </p>
          </div>
        </div>
        {/* <p style={{ fontSize: "14" }}>
          {tokenInfo?.name}
          <br></br>
        </p>
        <p style={{ marginTop: "10px", fontWeight: "14px" }}>
          {tokenAddress ? modifyString(tokenAddress) : ""}
        </p> */}
        <div
          className={style.mainWarning}
          style={{
            display: 'flex',
            flexDirection: 'column',
            marginTop: '8px',
          }}
        >
          <p style={{ cursor: 'pointer' }}>
            {selectURL(selectedChain.coinFamily)}{' '}
            <img
              src={navigateiCON}
              style={{
                height: '17px',
                width: '17px',
                marginRight: '5px',
                cursor: 'pointer',
              }}
              alt=""
              onClick={() => {
                chrome.tabs.create({
                  url: selectURL(selectedChain.coinFamily),
                });
              }}
            />
            <img
              src={Copy}
              style={{
                height: '17px',
                width: '17px',
                cursor: 'pointer',
              }}
              alt=""
              onClick={() => {
                navigator.clipboard.writeText(
                  selectURL(selectedChain.coinFamily)
                );
                messageApi.success('Link Copied.');
              }}
            />
          </p>
        </div>
        <div className="content-main">
          {/* {tokenAddress
            ? `${tokenAddress.substring(0, 7)}.....${tokenAddress.substring(
                tokenAddress.length - 7,
                tokenAddress.length
              )}`
            : null}
          <br></br>
          <a
            href=''
            onClick={(e) => {
              e.preventDefault();
              chrome.tabs.create({
                url: `https://bscscan.com/token/${tokenAddress}`,
              });
            }}
            style={{ color: '#00aeef' }}
          >
            (View on BscScan{' '}
            <img
              src={bscscan}
              style={{
                height: '17px',
                width: '17px',
              }}
            />
            )
          </a> */}
          <div
            className={'checkboxOuter'}
            style={{
              marginBottom: '15px',
            }}
          >
            <Checkbox
              checked={understand}
              onChange={(value) => {
                setUnderstand(value.target.checked);
              }}
            >
              <p style={{ marginLeft: '15px' }}>I understand</p>
            </Checkbox>
          </div>

          <ButtonComp
            text={'Import'}
            maxWidth={'100%'}
            onClick={async (e) => {
              e.preventDefault();
              try {
                if (!understand && selectedChain.coinFamily != 1) {
                  return messageApi.error('Please confirm before proceeding.');
                }
                store.dispatch(setLoading(true));
                await server.post(
                  '/wallet/token/add',
                  {
                    coin_family: selectedChain.coinFamily,
                    token_address: assetAddress ? assetAddress : tokenAddress,
                    coin_name: tokenInfo.name,
                    coin_symbol: tokenInfo.symbol,
                    decimals: tokenInfo.decimals.toString(),
                    wallet_address:
                      account.coinFamilyAndAddress[selectedChain.coinFamily],
                    policy_id:
                      selectedChain.coinFamily == 5 ? tokenAddress : undefined,
                    evm_address: account.isWatchOnly
                      ? undefined
                      : account.address,
                    is_watch_only: account?.isWatchOnly ? 1 : 0,
                    wallet_name: account?.name,
                  },
                  {
                    headers: {
                      Authorization: account.jwtToken,
                    },
                  }
                );
                store.dispatch(setLoading(false));
                if (state) {
                  if (state.swap) {
                    return navigate('/swap', {
                      state: {
                        tokenAddress,
                        fromOrTo: state.selected,
                      },
                    });
                  }
                }
                return navigate('/wallet');
              } catch (error) {
                // console.log('~ CustomToken.jsx ~ error ~ 668 : ', error);
                store.dispatch(setLoading(false));
                const errorMessage = error?.response?.data?.message;
                if (typeof errorMessage === 'string') {
                  return messageApi.error(errorMessage);
                } else {
                  return messageApi.error('Something went wrong');
                }
              }
            }}
          />
        </div>
      </ModalCustom>
      <ModalCustom
        title={'Import Tokens'}
        isModalOpen={modalEth}
        customClass="customClassModal importTokenModal"
        handleCancel={() => {
          setModalEth(false);
        }}
      >
        <div
          className={style.mainWarning}
          style={{
            display: 'flex',
          }}
        >
          <div className="left" style={{ flex: 1 }}>
            <img src={warning} alt="" style={{ width: '27px' }} />
          </div>
          <div className="right" style={{ flex: 7 }}>
            <p style={{ marginBottom: 0 }}>
              Anyone can create a token on a blockchain. These may be fake
              versions of existing tokens, or tokens created by parties with bad
              intentions. Before importing any token, do you own research and
              ensure you have the correct contract address.
            </p>
            <p>
              Purchasing a fraudulent token can lead to the total loss of your
              funds.
            </p>
          </div>
        </div>
        {/* <p style={{ fontWeight: "14px" }}>
          {tokenInfo?.name}
          <br></br>
        </p>
        <p style={{ marginTop: "10px", fontWeight: "14px" }}>
          {tokenAddress ? modifyString(tokenAddress) : ""}
        </p> */}
        <div
          className={style.mainWarning}
          style={{
            display: 'flex',
            flexDirection: 'column',
            marginTop: '8px',
          }}
        >
          <p style={{ cursor: 'pointer' }}>
            {selectURL(selectedChain.coinFamily)}{' '}
            <img
              src={navigateiCON}
              style={{
                height: '17px',
                width: '17px',
                marginRight: '5px',
                cursor: 'pointer',
              }}
              alt=""
              onClick={() => {
                chrome.tabs.create({
                  url: selectURL(selectedChain.coinFamily),
                });
              }}
            />
            <img
              src={Copy}
              style={{
                height: '17px',
                width: '17px',
                cursor: 'pointer',
              }}
              alt=""
              onClick={() => {
                navigator.clipboard.writeText(
                  selectURL(selectedChain.coinFamily)
                );
                messageApi.success('Link Copied.');
              }}
            />
          </p>
        </div>
        <div className="content-main">
          <div
            className={'checkboxOuter'}
            style={{
              marginBottom: '15px',
            }}
          >
            <Checkbox
              checked={understand}
              onChange={(value) => {
                setUnderstand(value.target.checked);
              }}
            >
              <p style={{ marginLeft: '15px' }}>I understand</p>
            </Checkbox>
          </div>
          <ButtonComp
            text={'Import'}
            maxWidth={'100%'}
            onClick={async (e) => {
              e.preventDefault();
              try {
                if (!understand) {
                  return messageApi.error('Please confirm before proceeding.');
                }
                store.dispatch(setLoading(true));
                await server.post(
                  '/wallet/token/add',
                  {
                    coin_family: selectedChain.coinFamily,
                    token_address: assetAddress ? assetAddress : tokenAddress,
                    coin_name: tokenInfo.name,
                    coin_symbol: tokenInfo.symbol,
                    decimals: tokenInfo.decimals.toString(),
                    wallet_address:
                      account.coinFamilyAndAddress[selectedChain.coinFamily],
                    policy_id:
                      selectedChain.coinFamily == 5 ? tokenAddress : undefined,
                    evm_address: account.isWatchOnly
                      ? undefined
                      : account.address,
                    is_watch_only: account?.isWatchOnly ? 1 : 0,
                    wallet_name: account?.name,
                  },
                  {
                    headers: {
                      Authorization: account.jwtToken,
                    },
                  }
                );
                store.dispatch(setLoading(false));
                if (state) {
                  if (state.swap) {
                    return navigate('/swap', {
                      state: {
                        tokenAddress,
                        fromOrTo: state.selected,
                      },
                    });
                  }
                }
                messageApi.success('Token added successfully.');
                return navigate('/wallet');
              } catch (error) {
                // console.log('~ customtoken.jsx ~ 825 ~ error :');
                store.dispatch(setLoading(false));

                const errorMessage = error?.response?.data?.message;

                if (typeof errorMessage === 'string') {
                  return messageApi.error(errorMessage);
                } else {
                  return messageApi.error('Something went wrong');
                }
              }
            }}
          />
        </div>
      </ModalCustom>
    </div>
  );
}

export default CustomToken;
