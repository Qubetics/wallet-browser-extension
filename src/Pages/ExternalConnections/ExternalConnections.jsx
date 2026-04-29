/*global chrome*/
import './external.scss';
import React, { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import ModalCustom from '../../Components/ModalCustom/ModalCustom';
import logo from '../../Assets/logo.png';
import moment from 'moment';
import { Web3Helper } from '../../helpers/web3.helper';
import { getRpcUrl } from '../../helpers/rpcService';
import Web3 from 'web3';
import { WalletHelper } from '../../helpers/wallet.helper';
import { message } from 'antd';
import { store } from '../..';
import { setLoading } from '../../actions/loading';
import InputFieldSimple from '../../Components/InputField/InputFieldSimple';
import ButtonComp from '../../Components/ButtonComp/ButtonComp';
import ArrowDashedLine from '../../Assets/arr.svg';
import BigNumber from 'bignumber.js';
import { addCommasToNumber } from '../../helpers/conversion.helper';
import { SolanaHelper } from '../../helpers/solana.helper';
import createValidator from '../../helpers/createValidator';
import bondMoreFunds from '../../helpers/bondMoreFunds';
import unBondFunds from '../../helpers/unBondFunds';
import unJailValidator from '../../helpers/unjailValidator';
import { SecurityHelper } from '../../helpers/security.helper';
import editValidator from '../../helpers/editValidator';
import delagteAndBondMore from '../../helpers/delegatorBondMoreFunds';
import { redelegate } from '../../helpers/redelegation';
import TruncatedAddress from './TruncatedAddress';
import { getUserAddress } from '../../helpers/getAddress';
import fetchValoperAddress from '../../helpers/fetchValoperAddress';
import { Wallet } from 'ethers';
import { useLocation } from 'react-router-dom';

function getFlooredFixed(v, d) {
  return (Math.floor(v * Math.pow(10, d)) / Math.pow(10, d)).toFixed(d);
}
export const ExternalConnection = () => {
  const { state } = useLocation();
  const { account, currency } = useSelector((state) => state);
  const [method, setMethod] = useState(null);
  const [chainID, setChainID] = useState(null);
  const [data, setData] = useState(null);
  const [feeInEth, setFeeInEth] = useState(0);
  const [messageApi, contextHolder] = message.useMessage();
  const [sessionPassword, setPassword] = useState(null);
  const [isModalOpen, setOpenmodal] = useState(false);
  const [fromChain, setFromChain] = useState(null);
  const [toChain, setToChain] = useState(null);
  const [chain, setChain] = useState(null);
  const [gasLimitNew, setGaslimitNew] = useState(null);
  const [mnemonics, setMnemonics] = useState(null);
  const [defaultAccount, setDefaultAccounts] = useState(null);
  const [params, setParams] = useState(null);
  const [defaultAddressPhrase, setDefaultAddressPhrase] = useState(null);
  const enrichedDataRef = useRef(null);
  const [estimateGasFee, setEstimateGasFee] = useState(0)

  let price = null;

  const handleOk = () => {
    setOpenmodal(false);
  };

  const handleCancel = () => {
    setOpenmodal(false);
  };


  const dappApprovalHash = (pvt_key, approvalParam) => {
    return new Promise(async (resolve, reject) => {
      let wallet = new Wallet(pvt_key);
      wallet
        ._signTypedData(
          approvalParam.domain,
          approvalParam.types,
          approvalParam.message
        )
        .then(async (resww) => {
          resolve(resww);
        })
        .catch((err) => {
          reject(err);
        });
    });
  };

  const getEstimateFees = async (mnemonics) => {
    const response = await delagteAndBondMore(
      mnemonics,
      data.userAddress,
      data.stakeAmount,
      data.valoperAddress,
      data.nodeUrl,
      true
    );
    setEstimateGasFee(response);
    store.dispatch(setLoading(false));
    return response;
  };

  const getEstimateFeesUnBondFunds = async (mnemonics) => {
    const response = await unBondFunds(
      mnemonics,
      data.userAddress,
      data.valoperAddress,
      data.unBoundAmt,
      data.nodeUrl,
      true
    );
    setEstimateGasFee(response);
    store.dispatch(setLoading(false));
    return response;
  };

  const getEstimateFeesRedelegate = async (mnemonics) => {
    const response = await redelegate(
      mnemonics,
      data.selectedAccount,
      data.valoperAddress,
      data.stakeAmount,
      data.nodeUrl,
      true
    );
    setEstimateGasFee(response);
    store.dispatch(setLoading(false));
    return response;
  };

  const getEstimateFeesCreateValidator = async (mnemonics) => {
    const response = await createValidator(
      mnemonics,
      data.primaryValues,
      data.secondaryValues,
      data.nodeUrl,
      data.valoperAddressFromBlockChain,
      data.publicKey,
      true
    );
    setEstimateGasFee(response);
    store.dispatch(setLoading(false));
    return response;
  };

  const getEstimateFeesEditValidator = async (mnemonics) => {
    const response = await editValidator(
      mnemonics,
      data.primaryValues,
      data.nodeUrl,
      data.valoperAddress,
      data.hideCommissionField,
      true
    );
    setEstimateGasFee(response);
    store.dispatch(setLoading(false));
    return response;
  };

  const getEstimateFeesBondMoreFunds = async (mnemonics) => {
    const response = await bondMoreFunds(
      mnemonics,
      data.userAddress,
      data.bondAmount,
      data.valoperAddress,
      data.nodeUrl,
      true
    );
    setEstimateGasFee(response);
    store.dispatch(setLoading(false));
    return response;
  };

  const getEstimateFeesUnJailValidator = async (mnemonics) => {
    const response = await unJailValidator(
      mnemonics,
      data.valoperAddress,
      data.nodeUrl,
      true
    );
    setEstimateGasFee(response);
    store.dispatch(setLoading(false));
    return response;
  };

  const methodArray = [
    "createValidator",
    "editValidator",
    "bondMoreFunds",
    "delegatorBondMoreFunds",
    "redelegate",
    "unBondFunds",
    "stopValidator",
    "unJailValidator",
    "nativeConnect"
  ]


  const init = async (password) => {
    const { chains } = await chrome.storage.local.get('chains');
    let { accounts } = await chrome.storage.session.get('accounts');
    const { mnemonics } = await chrome.storage.local.get('mnemonics');
    const decryptMnemonics = await SecurityHelper.decrypt(
      mnemonics,
      sessionPassword
    );
    // console.log("decryptMnemonics::", decryptMnemonics);
    if (accounts?.length && methodArray.includes(method)) {
      store.dispatch(setLoading(true));
    }
    const defaultAddress = accounts?.find((item) => item.default)?.address;
    if (defaultAddress) {
      setDefaultAccounts(defaultAddress);
      getPhrase(defaultAddress, password);
    }
    setMnemonics(decryptMnemonics);
    setChain(chains.find((el) => el.default));

    const myDefaultChain = chains.find((el) => el?.default);
    chrome.tabs.query(
      { active: true, currentWindow: true },
      async function (tabs) {
        try {
          const tab = tabs[0];
          const url = new URL(tab.url);
          const queryParams = new URLSearchParams(url.search);
          const method = queryParams.get('method');
          const data = queryParams.get('data')
            ? JSON.parse(decodeURIComponent(queryParams.get('data')))
            : null;
          setData(data);
          setChainID(Web3.utils.toDecimal(data.chainId));

          if (data.network === 'qubetics') {
            if (method === 'nativeConnect' && defaultAddressPhrase) {
              const valoperAddress = await fetchValoperAddress(
                defaultAddressPhrase
              );
              const address = await getUserAddress(
                defaultAddressPhrase,
                data.nodeUrl
              );

              const enrichedData = {
                ...data,
                valoperAddress,
                address,
                evmAddress: account.address,
              };

              enrichedDataRef.current = enrichedData;
              setData(enrichedData);
              setMethod(method);
            } else {
              setMethod(method);
              setData(data);
            }

            return;
          }
          if (method === 'requestAccounts' && account) {
            setMethod('requestAccounts');
            // store.dispatch(setLoading(false));
          } else if (method === 'signTransaction' && account) {
            const symbol =
              myDefaultChain.slug == 'matic' || myDefaultChain.slug == 'polygon'
                ? 'pol'
                : myDefaultChain.slug == 'ethereum'
                ? 'eth'
                : myDefaultChain.slug == 'binancesmartchain'
                ? 'bnb'
                : '';
            const gasPriceRes = await Web3Helper.getGasPrice(
              myDefaultChain.slug,
              data.from,
              data.to,
              // 1
              false,
              null,
              symbol
            );
            // chain id==> 1->Eth, 137->Pol, 56->Bnb
            let rpc =
              myDefaultChain?.chainId == 1
                ? getRpcUrl('REACT_APP_ETH_RPC')
                : myDefaultChain?.chainId == 9009
                ? getRpcUrl('REACT_APP_QUBETIC_RPC')
                : myDefaultChain?.chainId == 137
                ? getRpcUrl('REACT_APP_MATIC_RPC')
                : getRpcUrl('REACT_APP_BNB_RPC');
            const provider = new Web3.providers.HttpProvider(rpc);
            const web3 = new Web3(provider);
            let gasEstimate = '';

            if (myDefaultChain?.chainId == 1) {
              if (data.gas) {
                gasEstimate = new BigNumber(data.gas);
              } else {
                let estimate = await web3.eth.estimateGas({
                  from: data?.from,
                  to: data?.to,
                  data: data?.data,
                  gas: data.gas,
                });
                gasEstimate = (estimate * 1.5).toFixed(0);
              }
            } else {
              if (data.gas) {
                gasEstimate = new BigNumber(data.gas);
              } else {
                let estimate = await web3.eth.estimateGas({
                  from: data?.from,
                  to: data?.to,
                  data: data?.data,
                });
                gasEstimate = (estimate * 1.5).toFixed(0);
              }
            }
            setGaslimitNew(gasEstimate);

            const gasPrice = new BigNumber(gasPriceRes.fast).times(1000000000);

            const gasInEth = gasPrice.times(gasEstimate).div(Math.pow(10, 18));

            setFeeInEth(gasInEth.toString());
            setData(data);
            // console.log("DATA SETTING ", data);
            setMethod('signTransaction');
            store.dispatch(setLoading(false));
          } else if (method === 'signTypedMessage' && account) {
            // console.log('Rightplace::::::::: ', data?.raw);

            let approvalParam = JSON.parse(data?.raw);
            // console.log('approvalParamapprovalParam', approvalParam);
            let typeArr = Object.keys(approvalParam.types);
            let newTypes = {};
            typeArr.map((el) => {
              if (el != 'EIP712Domain') {
                newTypes[el] = approvalParam.types[el];
              }
            });
            let newParams = {
              domain: approvalParam.domain,
              types: newTypes,
              message: approvalParam.message,
            };
            setData(data);
            // console.log("DATA SETTING ", data);
            setMethod('signTypedMessage');
            // console.log('---------newParams:::::', newParams);
            setParams(newParams);
            store.dispatch(setLoading(false));
          } else if (method === 'signRawTransaction' && account) {
            const solanaHelper = new SolanaHelper(
              getRpcUrl('REACT_APP_SOL_RPC')
            );
            const gasPriceRes = solanaHelper.getGasPrice();
            setFeeInEth(gasPriceRes.toString());
            setData(data);
            setMethod('signRawTransaction');
            store.dispatch(setLoading(false));
          } else if (method === 'switchEthereumChain' && account) {
            const { chains } = await chrome.storage.local.get('chains');
            // console.log('CHAINNNNNNNNNNNNN ', chains);

            const switchChain = chains.find(
              (el) => el.chainId == Web3.utils.toDecimal(data.chainId)
            );

            setFromChain(myDefaultChain);
            // console.log('switchChainswitchChainswitchChain ', switchChain);
            setToChain(switchChain);
            // await chrome.storage.local.set({
            //   chains: switchChain,
            // });
            setMethod('switchEthereumChain');
            // console.log('DATA SETTING ', data);
            setData(data);
          }
        } catch (error) {}
      }
    );
  };
  const handleResponse = async (result, error) => {
    // console.log('HANDLE RESPOSNE');
    // await chrome.storage.session.set({ isApproved: true });
    const { isApproved } = await chrome.storage.local.get('isApproved');
    // console.log(
    //   '🚀 ~ file: ExternalConnections.jsx:187 ~ handleResponse ~ result 11',
    //   result,
    //   'isApproved::',
    //   isApproved
    // );
    chrome.runtime.sendMessage({ method, result }, (response) => {
      chrome.windows.getCurrent(async function (window) {
        await chrome.storage.local.set({ isApproved: true });
        chrome.windows.remove(window.id);
      });
    });
  };

  const handleTransaction = async (defaultAddressPhrase) => {
    // console.log('HANDLE TRANSACTION', defaultAddressPhrase);
    try {
      store.dispatch(setLoading(true));
      if (data.network === 'solana') {
        // console.log(
        //   '🚀 ~ file: ExternalConnections.jsx:105 ~ handleTransaction ~ data',
        //   data
        // );
        const solanaHelper = new SolanaHelper(getRpcUrl('REACT_APP_SOL_RPC'));
        // console.log(typeof data.object.data);
        const signature = await solanaHelper.signRawTransaction(
          data.object.raw,
          typeof data.object.data === 'string'
            ? JSON.parse(data.object.data)
            : data.object.data,
          sessionPassword
        );
        store.dispatch(setLoading(false));
        if (signature) {
          handleResponse(signature);
        } else {
          store.dispatch(setLoading(false));
          return message.error('Error signing transaction');
        }
      } else if (data.network === 'qubetics') {
        if (data.method === 'createValidator') {
          const response = await createValidator(
            // data.mnemonics,
            defaultAddressPhrase,
            data.primaryValues,
            data.secondaryValues,
            data.nodeUrl,
            data.valoperAddressFromBlockChain,
            data.publicKey
          );
          if (response) {
            const extractDataFromResp = {
              transactionHash: response.transactionHash,
              rawLog: response.rawLog,
              code: response.code,
            };
            handleResponse({ type: 'success', data: extractDataFromResp });
            store.dispatch(setLoading(false));
          } else {
            store.dispatch(setLoading(false));
            return message.error('Error in create validator');
          }
        } else if (data.method === 'editValidator') {
          // store.dispatch(setLoading(true));
          const response = await editValidator(
            // data.mnemonics,
            defaultAddressPhrase,
            data.primaryValues,
            data.nodeUrl,
            data.valoperAddress,
            data.hideCommissionField
          );
          if (response) {
            const extractDataFromResp = {
              transactionHash: response.transactionHash,
              rawLog: response?.rawLog,
              code: response.code,
            };

            // console.log('result:::editValidator', response);
            handleResponse({ type: 'success', data: extractDataFromResp });
            store.dispatch(setLoading(false));
            return;
          }
        } else if (data.method === 'bondMoreFunds') {
          // store.dispatch(setLoading(true));
          const response = await bondMoreFunds(
            // data.mnemonics,
            defaultAddressPhrase,
            data.userAddress,
            data.bondAmount,
            data.valoperAddress,
            data.nodeUrl
          );
          if (response) {
            handleResponse({ type: 'success', data: response });
            store.dispatch(setLoading(false));
            return;
          }
        } else if (data.method === 'delegatorBondMoreFunds') {
          // store.dispatch(setLoading(true));
          const response = await delagteAndBondMore(
            // data.mnemonics,
            defaultAddressPhrase,
            data.userAddress,
            data.stakeAmount,
            data.valoperAddress,
            data.nodeUrl
          );
          if (response) {
            // console.log('RESPO: delegatorBondMoreFunds::', response);
            handleResponse({ type: 'success', data: response });
            store.dispatch(setLoading(false));
            return;
          }
        } else if (data.method === 'redelegate') {
          // store.dispatch(setLoading(true));
          const response = await redelegate(
            // data.mnemonics,
            defaultAddressPhrase,
            data.selectedAccount,
            data.valoperAddress,
            data.stakeAmount,
            data.nodeUrl
          );
          // console.log('RESPO: redelegate::', response);
          if (response) {
            const extractDataFromResp = {
              transactionHash: response.transactionHash,
              rawLog: response.rawLog,
              code: response.code,
            };
            handleResponse({ type: 'success', data: extractDataFromResp });
            store.dispatch(setLoading(false));
            return;
          }
        } else if (data.method === 'unBondFunds') {
          // console.log('I am unBondFunds called::', data);
          const response = await unBondFunds(
            // data.mnemonics,
            defaultAddressPhrase,
            data.userAddress,
            data.valoperAddress,
            data.unBoundAmt,
            data.nodeUrl
            // data.maxClicked,
            // data.totalAmount
          );
          // console.log('RETURN RESP unBondFunds::', response);
          if (response) {
            handleResponse({ type: 'success', data: response });
            store.dispatch(setLoading(false));
          }
        } else if (data.method === 'stopValidator') {
          // console.log('I am stopValidator called::', data);
          const response = await unBondFunds(
            // data.mnemonics,
            defaultAddressPhrase,
            data.userAddress,
            data.valoperAddress,
            data.unBoundAmt,
            data.nodeUrl
          );
          // console.log('RETURN RESP stopValidator::', response);
          if (response) {
            handleResponse({ type: 'success', data: response });
            store.dispatch(setLoading(false));
          }
        } else if (data.method === 'unJailValidator') {
          const response = await unJailValidator(
            // data.mnmeonics,
            defaultAddressPhrase,
            data.valoperAddress,
            data.nodeUrl
          );
          // console.log('RETURN RESP unJailValidator::', response);
          if (response) {
            handleResponse({ type: 'success', data: response });
            store.dispatch(setLoading(false));
          }
        }
      } else if (method === 'signTypedMessage') {
        // console.log('XXXXX :: ', data);

        const { privateKey } = await WalletHelper.getPrivateKeyEvm(
          sessionPassword
        );
        if (!privateKey) {
          return false;
        }
        dappApprovalHash(privateKey, params)
          .then((res) => {
            handleResponse(res);
          })
          .catch((error) => {
            // console.log('ERRRRRRRRRRR ', error);
            messageApi.error('Something went wrong');
            return;
          });
      } else {
        const gasLimit = Web3.utils.toDecimal(data.gas);
        // console.log('gasLimit TRX ', gasLimit);
        const { chains } = await chrome.storage.local.get('chains');
        const myDefaultChain = chains.find((el) => el.default);
        const symbol =
          myDefaultChain.slug == 'polygon' || myDefaultChain.slug == 'matic'
            ? 'pol'
            : myDefaultChain.slug == 'ethereum'
            ? 'eth'
            : myDefaultChain.slug == 'binancesmartchain'
            ? 'bnb'
            : '';
        const hash =
          await Web3Helper.generateRawTransactionForTokenAndBroadcastExternalCopy(
            data.to,
            data.from,
            data.value ? new BigNumber(data.value).toString() : 0,
            chain.coinFamily,
            0,
            0,
            currency.name,
            null,
            chain.slug,
            chain.chainId,
            data.to,
            0,
            chain.tokenType,
            data.data,
            gasLimitNew || gasLimit,
            chain.coinFamily,
            data.value,
            symbol,
            sessionPassword
          );

        // console.log(
        //   '🚀 ~ file: ExternalConnections.jsx:105 ~ handleTransaction ~ hash:',
        //   hash
        // );

        if (hash.error) {
          // console.log('error', hash.error);
          store.dispatch(setLoading(false));
          return message.error(hash.error);
        }
        store.dispatch(setLoading(false));
        handleResponse(hash);
      }
    } catch (error) {
      // console.log('error while doing transaction ', error);
    }
  };

  useEffect(() => {
    if (enrichedDataRef.current) {
      store.dispatch(setLoading(false));
    }
  }, [enrichedDataRef.current]);

  const handleChainSwitch = async () => {
    try {
      // console.log("toChain ::::::::: ", toChain);

      if (toChain) {
        store.dispatch(setLoading(true));
        await WalletHelper.setNetworkPreference(toChain.chainId);
        store.dispatch(setLoading(false));
        handleResponse(true);
      }
    } catch (error) {
      // console.log('Error BB ', error);
    }
  };
  useEffect(() => {
    init(state?.password);
  }, [account, state]);
  
  const getPhrase = async (account, password) => {
    const isVerified = await WalletHelper.getMnemonicsByPassword(
      account,
      password
    );

    if (isVerified) {
      setDefaultAddressPhrase(isVerified);
      if (method == 'delegatorBondMoreFunds') {
        getEstimateFees(isVerified);
      } else if (method == 'unBondFunds' || method == 'stopValidator') {
        getEstimateFeesUnBondFunds(isVerified);
      } else if (method == 'redelegate') {
        getEstimateFeesRedelegate(isVerified);
      } else if (method == 'createValidator') {
        getEstimateFeesCreateValidator(isVerified);
      } else if (method == 'editValidator') {
        getEstimateFeesEditValidator(isVerified);
      } else if (method == 'bondMoreFunds') {
        getEstimateFeesBondMoreFunds();
      } else if (method == 'unJailValidator') {
        getEstimateFeesUnJailValidator();
      }
    }
  };

  return (
    <>
      {contextHolder}
      <ModalCustom
        title={'Request Accounts'}
        isModalOpen={method === 'requestAccounts'}
        customClass="customClassModal"
        handleCancel={() => {
          setMethod(null);
        }}
      >
        {account && method === 'requestAccounts' ? (
          <div className={'swapDetails'}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                width: '100%',
                marginBottom: '14px',
              }}
            >
              <img
                src={logo}
                alt=""
                style={{
                  height: '70px',
                  width: '70px',
                  objectFit: 'contain',
                  marginTop: '7px',
                }}
              />
            </div>
            <div className={'swapDetails__address'}>
              <p className={'swapDetails__address__key'}>
                In order to proceed, access to your account is necessary.
              </p>
              <p className={'swapDetails__address__val'}>
                <sapn>
                  Please grant access only to trusted websites that
                  require access to your information. Once your account
                  has been provided, the website will be able to access
                  public data such as your balance and other relevant
                  information.
                </sapn>
              </p>
            </div>
            <div className={'swapDetails__address'}>
              <p className={'swapDetails__address__key'}>Address</p>
              <p className={'swapDetails__address__val'}>
                <sapn>
                  {data?.network === 'solana'
                    ? account.coinFamilyAndAddress[4]
                    : account.address}
                </sapn>
              </p>
            </div>
            <div className={'swapDetails__border'}></div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: '30px',
                gap: '20px',
              }}
            >
              <ButtonComp
                maxWidth="100%"
                onClick={async () => {
                  handleResponse([
                    data?.network === 'solana'
                      ? account.coinFamilyAndAddress[4]
                      : account.address,
                  ]);
                }}
                text="Accept"
              />
              <div className="cancelBtn">
                <ButtonComp
                  maxWidth="100%"
                  onClick={async () => {
                    handleResponse([]);
                  }}
                  text="Reject"
                />
              </div>
            </div>
          </div>
        ) : null}
      </ModalCustom>

      <ModalCustom
        title={'Sign Transaction'}
        isModalOpen={method === 'signTransaction'}
        customClass="customClassModal"
        handleCancel={() => {
          setMethod(null);
        }}
      >
        {account && method === 'signTransaction' && data ? (
          <div className={'viewphrases'}>
            <div className={'viewphrases__iInner'}>
              <div className={`flexedContent`}>
                <div className={'swapDetails'}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      width: '100%',
                      marginBottom: '14px',
                    }}
                  >
                    <img
                      src={logo}
                      alt=""
                      style={{
                        height: '70px',
                        width: '70px',
                        objectFit: 'contain',
                        marginTop: '7px',
                      }}
                    />
                  </div>
                  <div className={'swapDetails__address'}>
                    <p className={'swapDetails__address__key'}>
                      In order to proceed, please confirm the transaction.
                    </p>
                    <p className={'swapDetails__address__val'}>
                      <sapn>
                        Please be sure that the request has been originated from
                        a verified source, before signing the transaction.
                      </sapn>
                    </p>
                  </div>

                  <div className={'confirmCurrency__keyValues'}>
                    <div className={'confirmCurrency__keyValues__key'}>
                      From
                    </div>
                    <div className={'confirmCurrency__keyValues__value'}>
                      {data?.from?.substring(0, 7)}....
                      {data?.from?.substring(
                        data?.from?.length - 7,
                        data?.from?.length
                      )}
                    </div>
                  </div>

                  <div className={'confirmCurrency__keyValues'}>
                    <div className={'confirmCurrency__keyValues__key'}>To</div>
                    <div className={'confirmCurrency__keyValues__value'}>
                      {data?.to?.substring(0, 7)}....
                      {data?.to?.substring(
                        data?.to?.length - 7,
                        data?.to?.length
                      )}
                    </div>
                  </div>

                  <div className={'confirmCurrency__keyValues'}>
                    <div className={'confirmCurrency__keyValues__key'}>
                      Network Fee
                    </div>
                    <div className={'confirmCurrency__keyValues__value'}>
                      {addCommasToNumber(getFlooredFixed(feeInEth, 5))}{' '}
                      {chain.currencySymbol}
                    </div>
                  </div>

                  <div className={'confirmCurrency__keyValues'}>
                    <div className={'confirmCurrency__keyValues__key'}>
                      Total Value
                    </div>
                    <div className={'confirmCurrency__keyValues__value'}>
                      {data.value
                        ? addCommasToNumber(
                            getFlooredFixed(
                              new BigNumber(data.value)
                                .dividedBy(new BigNumber(10).pow(18))
                                .plus(new BigNumber(feeInEth))
                                .toString(),
                              5
                            )
                          ) +
                          ' ' +
                          chain.currencySymbol
                        : addCommasToNumber(getFlooredFixed(feeInEth, 5)) +
                          ' ' +
                          chain.currencySymbol}{' '}
                    </div>
                  </div>

                  <div className={'confirmCurrency__keyValues'}>
                    <div className={'confirmCurrency__keyValues__key'}>
                      Date
                    </div>
                    <div className={'confirmCurrency__keyValues__value'}>
                      {moment(new Date()).format('MM/DD/YY')}
                    </div>
                  </div>

                  <div className={'swapDetails__border'}></div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginTop: '30px',
                      gap: '20px',
                    }}
                  >
                    <ButtonComp
                      disabled={!!chainID}
                      maxWidth="100%"
                      onClick={async () => {
                        setOpenmodal(true);
                      }}
                      text="Accept"
                    />
                    <div className="cancelBtn">
                      <ButtonComp
                        maxWidth="100%"
                        onClick={async () => {
                          // console.log('REJECTED 1');
                          handleResponse(null);
                        }}
                        text="Reject"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </ModalCustom>

      <ModalCustom
        title={'Sign Transaction'}
        isModalOpen={method === 'signTypedMessage'}
        customClass="customClassModal"
        handleCancel={() => {
          setMethod(null);
        }}
      >
        {account && method === 'signTypedMessage' && data ? (
          <div className={'viewphrases'}>
            <div className={'viewphrases__iInner'}>
              <div className={`flexedContent`}>
                <div className={'swapDetails'}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      width: '100%',
                      marginBottom: '14px',
                    }}
                  >
                    <img
                      src={logo}
                      alt=""
                      style={{
                        height: '70px',
                        width: '70px',
                        objectFit: 'contain',
                        marginTop: '7px',
                      }}
                    />
                  </div>
                  <div className={'swapDetails__address'}>
                    <p className={'swapDetails__address__key'}>
                      In order to proceed, please confirm the transaction.
                    </p>
                    <p className={'swapDetails__address__val'}>
                      <sapn>
                        Please be sure that the request has been originated from
                        a verified source, before signing the transaction.
                      </sapn>
                    </p>
                  </div>

                  <div className={'confirmCurrency__keyValues'}>
                    <div className={'confirmCurrency__keyValues__key'}>
                      From
                    </div>
                    <div className={'confirmCurrency__keyValues__value'}>
                      {method === 'signTypedMessage'
                        ? data?.address?.substring(0, 7) +
                          '....' +
                          data?.address?.substring(
                            data?.address?.length - 7,
                            data?.address?.length
                          )
                        : data?.from?.substring(0, 7) +
                          '....' +
                          data?.from?.substring(
                            data?.from?.length - 7,
                            data?.from?.length
                          )}
                    </div>
                  </div>

                  <div className={'confirmCurrency__keyValues'}>
                    <div className={'confirmCurrency__keyValues__key'}>To</div>
                    <div className={'confirmCurrency__keyValues__value'}>
                      {data?.to?.substring(0, 7)}....
                      {data?.to?.substring(
                        data?.to?.length - 7,
                        data?.to?.length
                      )}
                    </div>
                  </div>

                  <div className={'confirmCurrency__keyValues'}>
                    <div className={'confirmCurrency__keyValues__key'}>
                      Network Fee
                    </div>
                    <div className={'confirmCurrency__keyValues__value'}>
                      {addCommasToNumber(getFlooredFixed(feeInEth, 5))}{' '}
                      {chain.currencySymbol}
                    </div>
                  </div>

                  <div className={'confirmCurrency__keyValues'}>
                    <div className={'confirmCurrency__keyValues__key'}>
                      Total Value
                    </div>
                    <div className={'confirmCurrency__keyValues__value'}>
                      {data.value
                        ? addCommasToNumber(
                            getFlooredFixed(
                              new BigNumber(data.value)
                                .dividedBy(new BigNumber(10).pow(18))
                                .plus(new BigNumber(feeInEth))
                                .toString(),
                              5
                            )
                          )
                        : addCommasToNumber(getFlooredFixed(feeInEth, 5)) +
                          ' ' +
                          chain.currencySymbol}{' '}
                    </div>
                  </div>

                  <div className={'confirmCurrency__keyValues'}>
                    <div className={'confirmCurrency__keyValues__key'}>
                      Date
                    </div>
                    <div className={'confirmCurrency__keyValues__value'}>
                      {moment(new Date()).format('MM/DD/YY')}
                    </div>
                  </div>

                  <div className={'swapDetails__border'}></div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginTop: '30px',
                      gap: '20px',
                    }}
                  >
                    <ButtonComp
                      disabled={!!chainID}
                      maxWidth="100%"
                      onClick={async () => {
                        setOpenmodal(true);
                      }}
                      text="Accept"
                    />
                    <div className="cancelBtn">
                      <ButtonComp
                        maxWidth="100%"
                        onClick={async () => {
                          handleResponse(null);
                        }}
                        text="Reject"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </ModalCustom>

      <ModalCustom
        title={'Sign Transaction'}
        isModalOpen={method === 'signRawTransaction'}
        customClass="customClassModal"
        handleCancel={() => {
          setMethod(null);
        }}
      >
        {account && method === 'signRawTransaction' && data ? (
          <div className={'viewphrases'}>
            <div className={'viewphrases__iInner'}>
              <div className={`flexedContent`}>
                <div className={'swapDetails'}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      width: '100%',
                      marginBottom: '14px',
                    }}
                  >
                    <img
                      src={logo}
                      alt=""
                      style={{
                        height: '70px',
                        width: '70px',
                        objectFit: 'contain',
                        marginTop: '7px',
                      }}
                    />
                  </div>
                  <div className={'swapDetails__address'}>
                    <p className={'swapDetails__address__key'}>
                      In order to proceed, please confirm the transaction.
                    </p>
                    <p className={'swapDetails__address__val'}>
                      <sapn>
                        Please be sure that the request has been originated from
                        a verified source, before signing the transaction.
                      </sapn>
                    </p>
                  </div>

                  <div className={'confirmCurrency__keyValues'}>
                    <div className={'confirmCurrency__keyValues__key'}>
                      From
                    </div>
                    <div className={'confirmCurrency__keyValues__value'}>
                      {account.coinFamilyAndAddress[4].substring(0, 7)}
                      ....
                      {account.coinFamilyAndAddress[4].substring(
                        account.coinFamilyAndAddress[4].length - 7,
                        account.coinFamilyAndAddress[4].length
                      )}
                    </div>
                  </div>

                  <div className={'confirmCurrency__keyValues'}>
                    <div className={'confirmCurrency__keyValues__key'}>To</div>
                    <div className={'confirmCurrency__keyValues__value'}>
                      {account.coinFamilyAndAddress[4].substring(0, 7)}
                      ....
                      {account.coinFamilyAndAddress[4].substring(
                        account.coinFamilyAndAddress[4].length - 7,
                        account.coinFamilyAndAddress[4].length
                      )}
                    </div>
                  </div>

                  <div className={'confirmCurrency__keyValues'}>
                    <div className={'confirmCurrency__keyValues__key'}>
                      Network Fee
                    </div>
                    <div className={'confirmCurrency__keyValues__value'}>
                      {addCommasToNumber(getFlooredFixed(feeInEth, 5))}{' '}
                      {data?.network === 'solana'
                        ? 'SOL'
                        : chain.currencySymbol}
                    </div>
                  </div>

                  <div className={'confirmCurrency__keyValues'}>
                    <div className={'confirmCurrency__keyValues__key'}>
                      Total Value
                    </div>
                    <div className={'confirmCurrency__keyValues__value'}>
                      {data.value
                        ? addCommasToNumber(
                            getFlooredFixed(
                              new BigNumber(data.value)
                                .dividedBy(new BigNumber(10).pow(18))
                                .plus(new BigNumber(feeInEth))
                                .toString(),
                              6
                            )
                          )
                        : 0}{' '}
                    </div>
                  </div>

                  <div className={'confirmCurrency__keyValues'}>
                    <div className={'confirmCurrency__keyValues__key'}>
                      Date
                    </div>
                    <div className={'confirmCurrency__keyValues__value'}>
                      {moment(new Date()).format('MM/DD/YY')}
                    </div>
                  </div>

                  <div className={'swapDetails__border'}></div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginTop: '30px',
                      gap: '20px',
                    }}
                  >
                    <ButtonComp
                      maxWidth="100%"
                      disabled={!!chainID}
                      onClick={async () => {
                        setOpenmodal(true);
                      }}
                      text="Accept"
                    />
                    <div className="cancelBtn">
                      <ButtonComp
                        maxWidth="100%"
                        onClick={async () => {
                          handleResponse(null);
                        }}
                        text="Reject"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </ModalCustom>

      <ModalCustom
        title={'Switch Chains'}
        isModalOpen={method === 'switchEthereumChain'}
        customClass="customClassModal"
        handleCancel={() => {
          setMethod(null);
        }}
      >
        {account && method === 'switchEthereumChain' && data ? (
          <div className={'viewphrases'}>
            <div className={'viewphrases__iInner'}>
              <div className={`flexedContent`}>
                <div className={'swapDetails'}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      width: '100%',
                      marginBottom: '14px',
                    }}
                  >
                    <img
                      src={logo}
                      alt=""
                      style={{
                        height: '70px',
                        width: '70px',
                        objectFit: 'contain',
                        marginTop: '7px',
                      }}
                    />
                  </div>
                  <div className={'swapDetails__address'}>
                    <p className={'swapDetails__address__key'}>
                      The webpage wants to change the network.
                    </p>
                    <p className={'swapDetails__address__val'}>
                      <span>
                        Please grant access only to trusted websites that
                        require access to your information. Once your account
                        has been provided, the website will be able to access
                        public data such as your balance and other relevant
                        information.
                      </span>
                    </p>
                  </div>
                  <div className={'swapDetails__iconsTop'}>
                    <img src={fromChain?.image} width={30} height={30} />
                    <img
                      className="arrowDashedLine"
                      src={ArrowDashedLine}
                      width="90px"
                      height={12}
                    />
                    <img src={toChain?.image} width={30} height={30} />
                  </div>
                  <div className={'swapDetails__border'}></div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginTop: '30px',
                      gap: '20px',
                    }}
                  >
                    <ButtonComp
                      maxWidth="100%"
                      onClick={async () => {
                        handleChainSwitch();
                      }}
                      text="Accept"
                    />
                    <div className="cancelBtn">
                      <ButtonComp
                        maxWidth="100%"
                        onClick={async () => {
                          handleResponse(false);
                        }}
                        text="Reject"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </ModalCustom>

      <ModalCustom
        title={'Enter password'}
        isModalOpen={isModalOpen}
        handleCancel={() => setOpenmodal(!isModalOpen)}
        customClass="customClassModal"
      >
        <div className={'swapDetails__address'}>
          <p className={'swapDetails__address__key'}>
            Please enter your password to confirm the transaction
          </p>
        </div>
        <div className={'viewphrases'}>
          <div
            style={{
              marginBottom: '36px',
              width: '100%',
            }}
          >
            <InputFieldSimple
              placeholder="Password"
              getData={setPassword}
              value={sessionPassword}
              customFunction={async () => {
                const isVerified = await WalletHelper.getMnemonicsByPassword(
                  defaultAccount,
                  sessionPassword
                );

                if (!isVerified) {
                  return messageApi.error('Incorrect password provided.');
                }
                if (isVerified) {
                  handleTransaction(isVerified);
                }
              }}
            />
          </div>
          <ButtonComp
            text={'Proceed'}
            maxWidth={'100%'}
            onClick={async () => {
              const isVerified = await WalletHelper.getMnemonicsByPassword(
                defaultAccount,
                sessionPassword
              );
              if (!isVerified) {
                return messageApi.error('Incorrect password provided.');
              }

              if (isVerified) {
                handleTransaction(isVerified);
              }
            }}
          />
        </div>
      </ModalCustom>

      {/* ******************** Start ********************** */}

      {/* **** Native Connect ***** */}

      <ModalCustom
        title={'Request Accounts'}
        isModalOpen={account && method === 'nativeConnect'}
        customClass="customClassModal"
        handleCancel={async () => {
          setMethod(null);
          handleResponse({
            type: 'error',
            data: { message: 'Rejected by user' },
          });
          await chrome.storage.session.remove(['accounts', 'password']);
        }}
      >
        {account && method === 'nativeConnect' ? (
          <div className={'swapDetails'}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                width: '100%',
                marginBottom: '14px',
              }}
            >
              <img
                src={logo}
                alt=""
                style={{
                  height: '70px',
                  width: '70px',
                  objectFit: 'contain',
                  marginTop: '7px',
                }}
              />
            </div>
            <div className={'swapDetails__address'}>
              <p className={'swapDetails__address__key'}>
                In order to proceed, access to your account is necessary.
              </p>
              <p className={'swapDetails__address__val'}>
                <sapn>
                  Please grant access only to trusted websites that
                  require access to your information. Once your account
                  has been provided, the website will be able to access
                  public data such as your balance and other relevant
                  information.
                </sapn>
              </p>
            </div>
            <div className={'swapDetails__address'}>
              <p className={'swapDetails__address__key'}>Address</p>
              <p className={'swapDetails__address__val'}>
                <sapn>
                  {data?.network === 'solana'
                    ? account.coinFamilyAndAddress[4]
                    : account.address}
                </sapn>
              </p>
            </div>
            <div className={'swapDetails__border'}></div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: '30px',
                gap: '20px',
              }}
            >
              {/* <ButtonComp
                maxWidth="100%"
                disabled={defaultAddressPhrase == null}
                onClick={async () => {
                  handleResponse({
                    type: 'success',
                    data: data,
                  });
                }}
                text="Accept"
              /> */}
              <ButtonComp
                disabled={
                  defaultAddressPhrase == null ||
                  enrichedDataRef.current == null
                }
                onClick={async () => {
                  handleResponse({
                    type: 'success',
                    data: enrichedDataRef.current, // ✅ fallback to current data
                  });
                }}
                text="Accept"
              />

              <div className="cancelBtn">
                <ButtonComp
                  maxWidth="100%"
                  onClick={async () => {
                    handleResponse({
                      type: 'error',
                      data: { message: 'Rejected by user' },
                    });
                    await chrome.storage.session.remove([
                      'accounts',
                      'password',
                    ]);
                  }}
                  text="Reject"
                />
              </div>
            </div>
          </div>
        ) : null}
      </ModalCustom>

      {/* **** Create validators **** */}
      <ModalCustom
        title={'Create Validator'}
        isModalOpen={account && method === 'createValidator'}
        customClass="customClassModal"
        handleCancel={() => {
          setMethod(null);
          handleResponse({
            type: 'error',
            data: { message: 'Rejected by user' },
          });
        }}
      >
        {account && method === 'createValidator' && data ? (
          <div className={'viewphrases'}>
            <div className={'viewphrases__iInner'}>
              <div className={`flexedContent`}>
                <div className={'swapDetails'}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      width: '100%',
                      marginBottom: '14px',
                    }}
                  >
                    <img
                      src={logo}
                      alt=""
                      style={{
                        height: '70px',
                        width: '70px',
                        objectFit: 'contain',
                        marginTop: '7px',
                      }}
                    />
                  </div>
                  <div className={'swapDetails__address'}>
                    <p className={'swapDetails__address__key'}>
                      Please enter your password to confirm the transaction.
                    </p>
                    <p className={'swapDetails__address__val'}>
                      <sapn>
                        Please be sure that the request has been originated from
                        a verified source, before signing the transaction.
                      </sapn>
                    </p>
                  </div>

                  <div className={'confirmCurrency__keyValues'}>
                    <div className={'confirmCurrency__keyValues__key'}>
                      Event
                    </div>
                    <div className={'confirmCurrency__keyValues__value'}>
                      {data.name}
                    </div>
                  </div>

                  <div className={'confirmCurrency__keyValues'}>
                    <div className={'confirmCurrency__keyValues__key'}>
                      Stake Amount
                    </div>
                    <div className={'confirmCurrency__keyValues__value'}>
                      {`${data.secondaryValues.Bond_Amount} TICS`}
                    </div>
                  </div>

                  <div className={'confirmCurrency__keyValues'}>
                    <div className={'confirmCurrency__keyValues__key'}>
                      Commission
                    </div>
                    <div className={'confirmCurrency__keyValues__value'}>
                      {data.secondaryValues.Commission_Rate}
                    </div>
                  </div>
                  <div className={'confirmCurrency__keyValues'}>
                    <div className={'confirmCurrency__keyValues__key'}>
                      Estimated Gas Fee
                    </div>
                    <div className={'confirmCurrency__keyValues__value'}>
                      {`${Number(estimateGasFee) !== 0 ? Number(estimateGasFee).toFixed(8) : '0'} TICS`}
                    </div>
                  </div>
                  <div className={'swapDetails__border'}></div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginTop: '30px',
                      gap: '20px',
                    }}
                  >
                    <ButtonComp
                      maxWidth="100%"
                      onClick={() => handleTransaction(defaultAddressPhrase)}
                      text="Accept"
                    />
                    <div className="cancelBtn">
                      <ButtonComp
                        maxWidth="100%"
                        onClick={async () => {
                          handleResponse({
                            type: 'error',
                            data: { message: 'Rejected by user' },
                          });
                        }}
                        text="Reject"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </ModalCustom>

      {/* **** Edit Validator **** */}
      <ModalCustom
        title={'Edit Validator'}
        isModalOpen={account && method === 'editValidator'}
        customClass="customClassModal"
        handleCancel={() => {
          setMethod(null);
          handleResponse({
            type: 'error',
            data: { message: 'Rejected by user' },
          });
        }}
      >
        {account && method === 'editValidator' && data ? (
          <div className={'viewphrases'}>
            <div className={'viewphrases__iInner'}>
              <div className={`flexedContent`}>
                <div className={'swapDetails'}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      width: '100%',
                      marginBottom: '14px',
                    }}
                  >
                    <img
                      src={logo}
                      alt=""
                      style={{
                        height: '70px',
                        width: '70px',
                        objectFit: 'contain',
                        marginTop: '7px',
                      }}
                    />
                  </div>
                  <div className={'swapDetails__address'}>
                    <p className={'swapDetails__address__key'}>
                      Please enter your password to confirm the transaction.
                    </p>
                    <p className={'swapDetails__address__val'}>
                      <sapn>
                        Please be sure that the request has been originated from
                        a verified source, before signing the transaction.
                      </sapn>
                    </p>
                  </div>

                  <div className={'confirmCurrency__keyValues'}>
                    <div className={'confirmCurrency__keyValues__key'}>
                      Event
                    </div>
                    <div className={'confirmCurrency__keyValues__value'}>
                      {data.name}
                    </div>
                  </div>

                  <div className={'confirmCurrency__keyValues'}>
                    <div className={'confirmCurrency__keyValues__key'}>
                      Stake Amount
                    </div>
                    <div className={'confirmCurrency__keyValues__value'}>
                      {/* {data.secondaryValues.Bond_Amount} */}
                    </div>
                  </div>

                  <div className={'confirmCurrency__keyValues'}>
                    <div className={'confirmCurrency__keyValues__key'}>
                      Commission
                    </div>
                    <div className={'confirmCurrency__keyValues__value'}>
                      {/* {data.secondaryValues.Commission_Rate} */}
                    </div>
                  </div>
                  <div className={'confirmCurrency__keyValues'}>
                    <div className={'confirmCurrency__keyValues__key'}>
                      Estimated Gas Fee
                    </div>
                    <div className={'confirmCurrency__keyValues__value'}>
                      {`${Number(estimateGasFee) !== 0 ? Number(estimateGasFee).toFixed(8) : '0'} TICS`}
                    </div>
                  </div>
                  <div className={'swapDetails__border'}></div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginTop: '30px',
                      gap: '20px',
                    }}
                  >
                    <ButtonComp
                      maxWidth="100%"
                      onClick={() => handleTransaction(defaultAddressPhrase)}
                      text="Accept"
                    />
                    <div className="cancelBtn">
                      <ButtonComp
                        maxWidth="100%"
                        onClick={async () => {
                          handleResponse({
                            type: 'error',
                            data: { message: 'Rejected by user' },
                          });
                        }}
                        text="Reject"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </ModalCustom>

      {/* **** bondMoreFunds **** */}
      <ModalCustom
        title={'Bond More Funds'}
        isModalOpen={account && method === 'bondMoreFunds'}
        customClass="customClassModal"
        handleCancel={() => {
          setMethod(null);
          handleResponse({
            type: 'error',
            data: { message: 'Rejected by user' },
          });
        }}
      >
        {account && method === 'bondMoreFunds' && data ? (
          <div className={'viewphrases'}>
            <div className={'viewphrases__iInner'}>
              <div className={`flexedContent`}>
                <div className={'swapDetails'}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      width: '100%',
                      marginBottom: '14px',
                    }}
                  >
                    <img
                      src={logo}
                      alt=""
                      style={{
                        height: '70px',
                        width: '70px',
                        objectFit: 'contain',
                        marginTop: '7px',
                      }}
                    />
                  </div>
                  <div className={'swapDetails__address'}>
                    <p className={'swapDetails__address__key'}>
                      Please enter your password to confirm the transaction.
                    </p>
                    <p className={'swapDetails__address__val'}>
                      <sapn>
                        Please be sure that the request has been originated from
                        a verified source, before signing the transaction.
                      </sapn>
                    </p>
                  </div>

                  <div className={'confirmCurrency__keyValues'}>
                    <div className={'confirmCurrency__keyValues__key'}>
                      Event
                    </div>
                    <div className={'confirmCurrency__keyValues__value'}>
                      {/* {data.name} */}
                      bondMore
                    </div>
                  </div>
                  <div className={'confirmCurrency__keyValues'}>
                    <div className={'confirmCurrency__keyValues__key'}>
                      Address
                    </div>
                    <div className={'confirmCurrency__keyValues__value'}>
                      {/* {data.userAddress} */}
                      <TruncatedAddress address={data.userAddress} />
                    </div>
                  </div>

                  <div className={'confirmCurrency__keyValues'}>
                    <div className={'confirmCurrency__keyValues__key'}>
                      Amount
                    </div>
                    <div className={'confirmCurrency__keyValues__value'}>
                      {`${data.bondAmount} TICS`}
                    </div>
                  </div>
                  <div className={'confirmCurrency__keyValues'}>
                    <div className={'confirmCurrency__keyValues__key'}>
                      Estimated Gas Fee
                    </div>
                    <div className={'confirmCurrency__keyValues__value'}>
                      {`${Number(estimateGasFee) !== 0 ? Number(estimateGasFee).toFixed(8) : '0'} TICS`}
                    </div>
                  </div>
                  <div className={'swapDetails__border'}></div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginTop: '30px',
                      gap: '20px',
                    }}
                  >
                    <ButtonComp
                      maxWidth="100%"
                      onClick={() => handleTransaction(defaultAddressPhrase)}
                      text="Accept"
                    />
                    <div className="cancelBtn">
                      <ButtonComp
                        maxWidth="100%"
                        onClick={async () => {
                          handleResponse({
                            type: 'error',
                            data: { message: 'Rejected by user' },
                          });
                        }}
                        text="Reject"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </ModalCustom>

      {/* **** Delegator And bondMoreFunds **** */}
      <ModalCustom
        title={'Bond More Funds'}
        isModalOpen={account && method === 'delegatorBondMoreFunds'}
        customClass="customClassModal"
        handleCancel={() => {
          setMethod(null);
          handleResponse({
            type: 'error',
            data: { message: 'Rejected by user' },
          });
        }}
      >
        {account && method === 'delegatorBondMoreFunds' && data ? (
          <div className={'viewphrases'}>
            <div className={'viewphrases__iInner'}>
              <div className={`flexedContent`}>
                <div className={'swapDetails'}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      width: '100%',
                      marginBottom: '14px',
                    }}
                  >
                    <img
                      src={logo}
                      alt=""
                      style={{
                        height: '70px',
                        width: '70px',
                        objectFit: 'contain',
                        marginTop: '7px',
                      }}
                    />
                  </div>
                  <div className={'swapDetails__address'}>
                    <p className={'swapDetails__address__key'}>
                      Please enter your password to confirm the transaction.
                    </p>
                    <p className={'swapDetails__address__val'}>
                      <sapn>
                        Please be sure that the request has been originated from
                        a verified source, before signing the transaction.
                      </sapn>
                    </p>
                  </div>

                  <div className={'confirmCurrency__keyValues'}>
                    <div className={'confirmCurrency__keyValues__key'}>
                      Event
                    </div>
                    <div className={'confirmCurrency__keyValues__value'}>
                      {/* {data.name} */}
                      bondMore
                    </div>
                  </div>
                  <div className={'confirmCurrency__keyValues'}>
                    <div className={'confirmCurrency__keyValues__key'}>
                      Address
                    </div>
                    <div className={'confirmCurrency__keyValues__value'}>
                      {/* {data.userAddress} */}
                      <TruncatedAddress address={data.userAddress} />
                    </div>
                  </div>

                  <div className={'confirmCurrency__keyValues'}>
                    <div className={'confirmCurrency__keyValues__key'}>
                      Amount
                    </div>
                    <div className={'confirmCurrency__keyValues__value'}>
                      {`${data.stakeAmount} TICS`}
                    </div>
                  </div>
                  <div className={'confirmCurrency__keyValues'}>
                    <div className={'confirmCurrency__keyValues__key'}>
                      Estimated Gas Fee
                    </div>
                    <div className={'confirmCurrency__keyValues__value'}>
                      {`${Number(estimateGasFee) !== 0 ? Number(estimateGasFee).toFixed(8) : '0'} TICS`}
                    </div>
                  </div>
                  <div className={'swapDetails__border'}></div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginTop: '30px',
                      gap: '20px',
                    }}
                  >
                    <ButtonComp
                      maxWidth="100%"
                      onClick={() => handleTransaction(defaultAddressPhrase)}
                      text="Accept"
                    />
                    <div className="cancelBtn">
                      <ButtonComp
                        maxWidth="100%"
                        onClick={async () => {
                          handleResponse({
                            type: 'error',
                            data: { message: 'Rejected by user' },
                          });
                        }}
                        text="Reject"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </ModalCustom>

      {/* **** Delegator And bondMoreFunds **** */}
      <ModalCustom
        title={'Redelegate'}
        isModalOpen={account && method === 'redelegate'}
        customClass="customClassModal"
        handleCancel={() => {
          setMethod(null);
          handleResponse({
            type: 'error',
            data: { message: 'Rejected by user' },
          });
        }}
      >
        {account && method === 'redelegate' && data ? (
          <div className={'viewphrases'}>
            <div className={'viewphrases__iInner'}>
              <div className={`flexedContent`}>
                <div className={'swapDetails'}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      width: '100%',
                      marginBottom: '14px',
                    }}
                  >
                    <img
                      src={logo}
                      alt=""
                      style={{
                        height: '70px',
                        width: '70px',
                        objectFit: 'contain',
                        marginTop: '7px',
                      }}
                    />
                  </div>
                  <div className={'swapDetails__address'}>
                    <p className={'swapDetails__address__key'}>
                      Please enter your password to confirm the transaction.
                    </p>
                    <p className={'swapDetails__address__val'}>
                      <sapn>
                        Please be sure that the request has been originated from
                        a verified source, before signing the transaction.
                      </sapn>
                    </p>
                  </div>

                  <div className={'confirmCurrency__keyValues'}>
                    <div className={'confirmCurrency__keyValues__key'}>
                      Event
                    </div>
                    <div className={'confirmCurrency__keyValues__value'}>
                      {data.name}
                    </div>
                  </div>
                  <div className={'confirmCurrency__keyValues'}>
                    <div className={'confirmCurrency__keyValues__key'}>
                      Address
                    </div>
                    <div className={'confirmCurrency__keyValues__value'}>
                      {/* {data.selectedAccount} */}
                      <TruncatedAddress address={data.selectedAccount} />
                    </div>
                  </div>

                  <div className={'confirmCurrency__keyValues'}>
                    <div className={'confirmCurrency__keyValues__key'}>
                      Amount
                    </div>
                    <div className={'confirmCurrency__keyValues__value'}>
                      {`${data.stakeAmount} TICS`}
                    </div>
                  </div>
                  <div className={'confirmCurrency__keyValues'}>
                    <div className={'confirmCurrency__keyValues__key'}>
                      Estimated Gas Fee
                    </div>
                    <div className={'confirmCurrency__keyValues__value'}>
                      {`${Number(estimateGasFee) !== 0 ? Number(estimateGasFee).toFixed(8) : '0'} TICS`}
                    </div>
                  </div>
                  <div className={'swapDetails__border'}></div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginTop: '30px',
                      gap: '20px',
                    }}
                  >
                    <ButtonComp
                      maxWidth="100%"
                      onClick={() => handleTransaction(defaultAddressPhrase)}
                      text="Accept"
                    />
                    <div className="cancelBtn">
                      <ButtonComp
                        maxWidth="100%"
                        onClick={async () => {
                          handleResponse({
                            type: 'error',
                            data: { message: 'Rejected by user' },
                          });
                        }}
                        text="Reject"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </ModalCustom>

      {/* **** unBondFunds **** */}
      <ModalCustom
        title={'Un Bond Funds'}
        isModalOpen={account && method === 'unBondFunds'}
        customClass="customClassModal"
        handleCancel={() => {
          setMethod(null);
          handleResponse({
            type: 'error',
            data: { message: 'Rejected by user' },
          });
        }}
      >
        {account && method === 'unBondFunds' && data ? (
          <div className={'viewphrases'}>
            <div className={'viewphrases__iInner'}>
              <div className={`flexedContent`}>
                <div className={'swapDetails'}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      width: '100%',
                      marginBottom: '14px',
                    }}
                  >
                    <img
                      src={logo}
                      alt=""
                      style={{
                        height: '70px',
                        width: '70px',
                        objectFit: 'contain',
                        marginTop: '7px',
                      }}
                    />
                  </div>
                  <div className={'swapDetails__address'}>
                    <p className={'swapDetails__address__key'}>
                      Please enter your password to confirm the transaction.
                    </p>
                    <p className={'swapDetails__address__val'}>
                      <sapn>
                        Please be sure that the request has been originated from
                        a verified source, before signing the transaction.
                      </sapn>
                    </p>
                  </div>

                  <div className={'confirmCurrency__keyValues'}>
                    <div className={'confirmCurrency__keyValues__key'}>
                      Event
                    </div>
                    <div className={'confirmCurrency__keyValues__value'}>
                      {/* {data.name} */}
                      unBond
                    </div>
                  </div>
                  <div className={'confirmCurrency__keyValues'}>
                    <div className={'confirmCurrency__keyValues__key'}>
                      Address
                    </div>
                    <div className={'confirmCurrency__keyValues__value'}>
                      {/* {data.userAddress} */}
                      <TruncatedAddress address={data.userAddress} />
                    </div>
                  </div>

                  <div className={'confirmCurrency__keyValues'}>
                    <div className={'confirmCurrency__keyValues__key'}>
                      Amount
                    </div>
                    <div className={'confirmCurrency__keyValues__value'}>
                      {`${data.unBoundAmt} TICS`}
                    </div>
                  </div>
                  <div className={'confirmCurrency__keyValues'}>
                    <div className={'confirmCurrency__keyValues__key'}>
                      Estimated Gas Fee
                    </div>
                    <div className={'confirmCurrency__keyValues__value'}>
                      {`${Number(estimateGasFee) !== 0 ? Number(estimateGasFee).toFixed(8) : '0'} TICS`}
                    </div>
                  </div>
                  <div className={'swapDetails__border'}></div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginTop: '30px',
                      gap: '20px',
                    }}
                  >
                    <ButtonComp
                      maxWidth="100%"
                      onClick={() => handleTransaction(defaultAddressPhrase)}
                      text="Accept"
                    />
                    <div className="cancelBtn">
                      <ButtonComp
                        maxWidth="100%"
                        onClick={async () => {
                          handleResponse({
                            type: 'error',
                            data: { message: 'Rejected by user' },
                          });
                        }}
                        text="Reject"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </ModalCustom>

      {/* **** stopValidator */}
      <ModalCustom
        title={'Stop Validator'}
        isModalOpen={account && method === 'stopValidator'}
        customClass="customClassModal"
        handleCancel={() => {
          setMethod(null);
          handleResponse({
            type: 'error',
            data: { message: 'Rejected by user' },
          });
        }}
      >
        {account && method === 'stopValidator' && data ? (
          <div className={'viewphrases'}>
            <div className={'viewphrases__iInner'}>
              <div className={`flexedContent`}>
                <div className={'swapDetails'}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      width: '100%',
                      marginBottom: '14px',
                    }}
                  >
                    <img
                      src={logo}
                      alt=""
                      style={{
                        height: '70px',
                        width: '70px',
                        objectFit: 'contain',
                        marginTop: '7px',
                      }}
                    />
                  </div>
                  <div className={'swapDetails__address'}>
                    <p className={'swapDetails__address__key'}>
                      Please enter your password to confirm the transaction.
                    </p>
                    <p className={'swapDetails__address__val'}>
                      <sapn>
                        Please be sure that the request has been originated from
                        a verified source, before signing the transaction.
                      </sapn>
                    </p>
                  </div>

                  <div className={'confirmCurrency__keyValues'}>
                    <div className={'confirmCurrency__keyValues__key'}>
                      Event
                    </div>
                    <div className={'confirmCurrency__keyValues__value'}>
                      {data.name}
                    </div>
                  </div>
                  <div className={'confirmCurrency__keyValues'}>
                    <div className={'confirmCurrency__keyValues__key'}>
                      Address
                    </div>
                    <div className={'confirmCurrency__keyValues__value'}>
                      {/* {data.userAddress} */}
                      <TruncatedAddress address={data.userAddress} />
                    </div>
                  </div>

                  <div className={'confirmCurrency__keyValues'}>
                    <div className={'confirmCurrency__keyValues__key'}>
                      Amount
                    </div>
                    <div className={'confirmCurrency__keyValues__value'}>
                      {`${data.unBoundAmt} TICS`}
                    </div>
                  </div>
                  <div className={'confirmCurrency__keyValues'}>
                    <div className={'confirmCurrency__keyValues__key'}>
                      Estimated Gas Fee
                    </div>
                    <div className={'confirmCurrency__keyValues__value'}>
                      {`${Number(estimateGasFee) !== 0 ? Number(estimateGasFee).toFixed(8) : '0'} TICS`}
                    </div>
                  </div>
                  <div className={'swapDetails__border'}></div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginTop: '30px',
                      gap: '20px',
                    }}
                  >
                    <ButtonComp
                      maxWidth="100%"
                      onClick={async () => {
                        setOpenmodal(true);
                      }}
                      text="Accept"
                    />
                    <div className="cancelBtn">
                      <ButtonComp
                        maxWidth="100%"
                        onClick={async () => {
                          handleResponse({
                            type: 'error',
                            data: { message: 'Rejected by user' },
                          });
                        }}
                        text="Reject"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </ModalCustom>

      {/* **** unJailValidator **** */}
      <ModalCustom
        title={'Un Jail Validator'}
        isModalOpen={account && method === 'unJailValidator'}
        customClass="customClassModal"
        handleCancel={() => {
          setMethod(null);
          handleResponse({
            type: 'error',
            data: { message: 'Rejected by user' },
          });
        }}
      >
        {account && method === 'unJailValidator' && data ? (
          <div className={'viewphrases'}>
            <div className={'viewphrases__iInner'}>
              <div className={`flexedContent`}>
                <div className={'swapDetails'}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      width: '100%',
                      marginBottom: '14px',
                    }}
                  >
                    <img
                      src={logo}
                      alt=""
                      style={{
                        height: '70px',
                        width: '70px',
                        objectFit: 'contain',
                        marginTop: '7px',
                      }}
                    />
                  </div>
                  <div className={'swapDetails__address'}>
                    <p className={'swapDetails__address__key'}>
                      Please enter your password to confirm the transaction.
                    </p>
                    <p className={'swapDetails__address__val'}>
                      <sapn>
                        Please be sure that the request has been originated from
                        a verified source, before signing the transaction.
                      </sapn>
                    </p>
                  </div>

                  <div className={'confirmCurrency__keyValues'}>
                    <div className={'confirmCurrency__keyValues__key'}>
                      Event
                    </div>
                    <div className={'confirmCurrency__keyValues__value'}>
                      {data.name}
                    </div>
                  </div>
                  <div className={'confirmCurrency__keyValues'}>
                    <div className={'confirmCurrency__keyValues__key'}>
                      Address
                    </div>
                    <div className={'confirmCurrency__keyValues__value'}>
                      {/* {data.address} */}
                      <TruncatedAddress address={data.address} />
                    </div>
                  </div>
                  <div className={'confirmCurrency__keyValues'}>
                    <div className={'confirmCurrency__keyValues__key'}>
                      Estimated Gas Fee
                    </div>
                    <div className={'confirmCurrency__keyValues__value'}>
                      {`${Number(estimateGasFee) !== 0 ? Number(estimateGasFee).toFixed(8) : '0'} TICS`}
                    </div>
                  </div>
                  <div className={'swapDetails__border'}></div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginTop: '30px',
                      gap: '20px',
                    }}
                  >
                    <ButtonComp
                      maxWidth="100%"
                      onClick={() => handleTransaction(defaultAddressPhrase)}
                      text="Accept"
                    />
                    <div className="cancelBtn">
                      <ButtonComp
                        maxWidth="100%"
                        onClick={async () => {
                          handleResponse({
                            type: 'error',
                            data: { message: 'Rejected by user' },
                          });
                        }}
                        text="Reject"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </ModalCustom>

      {/* **** stopDeactivating **** */}
      <ModalCustom
        title={'Stop Deactivating'}
        isModalOpen={account && method === 'stopDeactivating'}
        customClass="customClassModal"
        handleCancel={() => {
          setMethod(null);
          handleResponse({
            type: 'error',
            data: { message: 'Rejected by user' },
          });
        }}
      >
        {account && method === 'stopDeactivating' && data ? (
          <div className={'viewphrases'}>
            <div className={'viewphrases__iInner'}>
              <div className={`flexedContent`}>
                <div className={'swapDetails'}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      width: '100%',
                      marginBottom: '14px',
                    }}
                  >
                    <img
                      src={logo}
                      alt=""
                      style={{
                        height: '70px',
                        width: '70px',
                        objectFit: 'contain',
                        marginTop: '7px',
                      }}
                    />
                  </div>
                  <div className={'swapDetails__address'}>
                    <p className={'swapDetails__address__key'}>
                      Please enter your password to confirm the transaction.
                    </p>
                    <p className={'swapDetails__address__val'}>
                      <sapn>
                        Please be sure that the request has been originated from
                        a verified source, before signing the transaction.
                      </sapn>
                    </p>
                  </div>

                  <div className={'confirmCurrency__keyValues'}>
                    <div className={'confirmCurrency__keyValues__key'}>
                      Event
                    </div>
                    <div className={'confirmCurrency__keyValues__value'}>
                      {/* {data.name} */}
                      stopDeactivate
                    </div>
                  </div>
                  <div className={'confirmCurrency__keyValues'}>
                    <div className={'confirmCurrency__keyValues__key'}>
                      Address
                    </div>
                    <div className={'confirmCurrency__keyValues__value'}>
                      {/* {data.address} */}
                      <TruncatedAddress address={data.address} />
                    </div>
                  </div>
                  <div className={'swapDetails__border'}></div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginTop: '30px',
                      gap: '20px',
                    }}
                  >
                    <ButtonComp
                      maxWidth="100%"
                      onClick={() => handleTransaction(defaultAddressPhrase)}
                      text="Accept"
                    />
                    <div className="cancelBtn">
                      <ButtonComp
                        maxWidth="100%"
                        onClick={async () => {
                          handleResponse({
                            type: 'error',
                            data: { message: 'Rejected by user' },
                          });
                        }}
                        text="Reject"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </ModalCustom>
    </>
  );
};
