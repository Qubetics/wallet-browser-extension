/*global chrome*/
import './external.scss';
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import ModalCustom from '../../Components/ModalCustom/ModalCustom';
import logo from '../../Assets/logo.png';
import moment from 'moment';
import { Web3Helper } from '../../helpers/web3.helper';
import Web3 from 'web3';
import { WalletHelper } from '../../helpers/wallet.helper';
import { message } from 'antd';
import { store } from '../..';
import { setLoading } from '../../actions/loading';
import InputFieldSimple from '../../Components/InputField/InputFieldSimple';
import ButtonComp from '../../Components/ButtonComp/ButtonComp';
import ArrowDashedLine from '../../Assets/ArrowDashedLine.svg';
import BigNumber from 'bignumber.js';
import { addCommasToNumber } from '../../helpers/conversion.helper';
import { SolanaHelper } from '../../helpers/solana.helper';
import createValidator from '../../helpers/createValidator';
import bondMoreFunds from '../../helpers/bondMoreFunds';
import unBondFunds from '../../helpers/unBondFunds';
import unJailValidator from '../../helpers/unjailValidator';
import stopDeactivating from '../../helpers/stopDeactivating';
import { SecurityHelper } from '../../helpers/security.helper';
import editValidator from '../../helpers/editValidator';
import delagteAndBondMore from '../../helpers/delegatorBondMoreFunds';
import { redelegate } from '../../helpers/redelegation';

function getFlooredFixed(v, d) {
  return (Math.floor(v * Math.pow(10, d)) / Math.pow(10, d)).toFixed(d);
}
export const ExternalConnection = () => {
  const { account, currency } = useSelector((state) => state);
  const [method, setMethod] = useState(null);
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
  let price = null;

  const handleOk = () => {
    setOpenmodal(false);
  };

  const handleCancel = () => {
    setOpenmodal(false);
  };

  const init = async () => {
    const { chains } = await chrome.storage.local.get('chains');
    const { password } = await chrome.storage.session.get('password');
    const { mnemonics } = await chrome.storage.local.get('mnemonics');
    const decryptMnemonics = SecurityHelper.decrypt(mnemonics, password);
    setMnemonics(decryptMnemonics);
    setChain(chains.find((el) => el.default));

    const myDefaultChain = chains.find((el) => el.default);

    chrome.tabs.query(
      { active: true, currentWindow: true },
      async function (tabs) {
        try {
          const tab = tabs[0];
          const url = new URL(tab.url);
          const queryParams = new URLSearchParams(url.search);
          console.log('QUERYYYYYYYYYY PARAMS ', queryParams);

          const method = queryParams.get('method');
          console.log("queryParams.get('data')::", queryParams.get('data'));
          console.log('method::', method);
          const data = queryParams.get('data')
            ? JSON.parse(decodeURIComponent(queryParams.get('data')))
            : null;
          console.log('datadata::', data);
          setData(data);
          console.log('EXTERNAL CONN DATA::', data);

          if (data.network === 'qubetics') {
            setMethod(method);
            setData(data);
            return;
          }

          if (method === 'requestAccounts' && account) {
            setMethod('requestAccounts');
            store.dispatch(setLoading(false));
          } else if (method === 'signTransaction' && account) {
            const symbol =
              myDefaultChain.slug == 'polygon'
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
                ? process.env.REACT_APP_ETH_RPC
                : myDefaultChain?.chainId == 56
                ? process.env.REACT_APP_BNB_RPC
                : myDefaultChain?.chainId == 137
                ? process.env.REACT_APP_MATIC_RPC
                : process.env.REACT_APP_QUBETIC_RPC;
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
          } else if (method === 'signRawTransaction' && account) {
            const solanaHelper = new SolanaHelper(
              process.env.REACT_APP_SOL_RPC
            );
            const gasPriceRes = solanaHelper.getGasPrice();
            setFeeInEth(gasPriceRes.toString());
            setData(data);
            setMethod('signRawTransaction');
            store.dispatch(setLoading(false));
          } else if (method === 'switchEthereumChain' && account) {
            const { chains } = await chrome.storage.local.get('chains');
            const switchChain = chains.find(
              (el) => el.chainId == Web3.utils.toDecimal(data.chainId)
            );
            setFromChain(myDefaultChain);
            setToChain(switchChain);
            setMethod('switchEthereumChain');
            // console.log("DATA SETTING ", data);
            setData(data);
          }
        } catch (error) {
          console.log('Error In GAS Estimate ', error);
          console.log(error);
        }
      }
    );
  };
  // console.log('EXT DATA::', data);
  const handleResponse = (result) => {
    console.log(
      '🚀 ~ file: ExternalConnections.jsx:187 ~ handleResponse ~ result 11',
      result
    );
    chrome.runtime.sendMessage({ method, result }, (response) => {
      chrome.windows.getCurrent(function (window) {
        chrome.windows.remove(window.id);
      });
    });
  };

  const handleTransaction = async () => {
    try {
      store.dispatch(setLoading(true));
      if (data.network === 'solana') {
        console.log(
          '🚀 ~ file: ExternalConnections.jsx:105 ~ handleTransaction ~ data',
          data
        );
        const solanaHelper = new SolanaHelper(process.env.REACT_APP_SOL_RPC);
        console.log(typeof data.object.data);
        const signature = await solanaHelper.signRawTransaction(
          data.object.raw,
          typeof data.object.data === 'string'
            ? JSON.parse(data.object.data)
            : data.object.data
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
            data.mnemonics,
            data.primaryValues,
            data.secondaryValues,
            data.nodeUrl,
            data.valoperAddressFromBlockChain,
            data.publicKey
          );
          console.log('RETURN RESP createValidator::', response);
          if (response) {
            const extractDataFromResp = {
              transactionHash: response.transactionHash,
              rawLog: response.rawLog,
              code: response.code,
            };
            handleResponse(extractDataFromResp);
            store.dispatch(setLoading(false));
          } else {
            store.dispatch(setLoading(false));
            return message.error('Error in create validator');
          }
        }else if (data.method === 'editValidator') {
          // store.dispatch(setLoading(true));
          const response = await editValidator(
            data.mnemonics,
            data.primaryValues,
            data.nodeUrl,
            data.valoperAddress,
            data.hideCommissionField,
          );
          if (response) {
            const extractDataFromResp = {
              transactionHash: response.transactionHash,
              rawLog: response?.rawLog,
              code: response.code,
            };
console.log("result:::editValidator",response);
            handleResponse(extractDataFromResp);
            store.dispatch(setLoading(false));
            return;
          }
        } else if (data.method === 'bondMoreFunds') {
          // store.dispatch(setLoading(true));
          const response = await bondMoreFunds(
            data.mnemonics,
            data.userAddress,
            data.bondAmount,
            data.valoperAddress,
            data.nodeUrl
          );
          if (response) {
            handleResponse(response);
            store.dispatch(setLoading(false));
            return;
          }
        } else if (data.method === 'delegatorBondMoreFunds') {
          // store.dispatch(setLoading(true));
          const response = await delagteAndBondMore(
            data.mnemonics,
            data.userAddress,
            data.stakeAmount,
            data.valoperAddress,
            data.nodeUrl
          );
          if (response) {
            console.log("RESPO:::",response);
            handleResponse(response);
            store.dispatch(setLoading(false));
            return;
          }
        } else if (data.method === 'redelegate') {
          // store.dispatch(setLoading(true));
          const response = await redelegate(
            data.mnemonics,
            data.selectedAccount,
            data.valoperAddress,
            data.stakeAmount,
            data.nodeUrl
          );
          console.log("RESPO: redelegate::",response);
          if (response) {
            const extractDataFromResp = {
              transactionHash: response.transactionHash,
              rawLog: response.rawLog,
              code: response.code,
            };
            handleResponse(extractDataFromResp);
            store.dispatch(setLoading(false));
            return;
          }
        }else if (data.method === 'unBondFunds') {
          console.log('I am unBondFunds called::', data);
          const response = await unBondFunds(
            data.mnemonics,
            data.userAddress,
            data.valoperAddress,
            data.unBoundAmt,
            data.nodeUrl
            // data.maxClicked,
            // data.totalAmount
          );
          console.log('RETURN RESP unBondFunds::', response);
          if (response) {
            handleResponse(response);
            store.dispatch(setLoading(false));
          }
        } else if (data.method === 'stopValidator') {
          console.log('I am stopValidator called::', data);
          const response = await unBondFunds(
            data.mnemonics,
            data.userAddress,
            data.valoperAddress,
            data.unBoundAmt,
            data.nodeUrl
          );
          console.log('RETURN RESP stopValidator::', response);
          if (response) {
            handleResponse(response);
            store.dispatch(setLoading(false));
          }
        } else if (data.method === 'unJailValidator') {
          const response = await unJailValidator(
            data.mnmeonics,
            data.valoperAddress,
            data.nodeUrl
          );
          console.log('RETURN RESP unJailValidator::', response);
          if (response) {
            handleResponse(response);
            store.dispatch(setLoading(false));
          }
        }
      } else {
        const gasLimit = Web3.utils.toDecimal(data.gas);
        // console.log("gasLimit TRX ", gasLimit);
        const { chains } = await chrome.storage.local.get('chains');
        const myDefaultChain = chains.find((el) => el.default);
        const symbol =
          myDefaultChain.slug == 'polygon'
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
            symbol
          );

        console.log(
          '🚀 ~ file: ExternalConnections.jsx:105 ~ handleTransaction ~ hash:',
          hash
        );

        if (hash.error) {
          store.dispatch(setLoading(false));
          return message.error(hash.error);
        }
        store.dispatch(setLoading(false));
        handleResponse(hash);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleChainSwitch = async () => {
    if (toChain) {
      store.dispatch(setLoading(true));
      await WalletHelper.setNetworkPreference(toChain.chainId);
      store.dispatch(setLoading(false));
      handleResponse(true);
    }
  };
  console.log('method:::', method);
  useEffect(() => {
    init();
  }, [account]);

  return (
    <>
      {contextHolder}
      <ModalCustom
        title={'Request Accounts'}
        isModalOpen={method === 'requestAccounts'}
        customClass='customClassModal'
        handleCancel={() => {
          setMethod(null);
        }}
      >
        {account && method === 'requestAccounts' ? (
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
                      alt=''
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
                      maxWidth='100%'
                      onClick={async () => {
                        handleResponse([
                          data?.network === 'solana'
                            ? account.coinFamilyAndAddress[4]
                            : account.address,
                        ]);
                      }}
                      text='Accept'
                    />
                    <div className='cancelBtn'>
                      <ButtonComp
                        maxWidth='100%'
                        onClick={async () => {
                          handleResponse([]);
                        }}
                        text='Reject'
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
        isModalOpen={method === 'signTransaction'}
        customClass='customClassModal'
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
                      alt=''
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
                      {data.from.substring(0, 7)}....
                      {data.from.substring(
                        data.from.length - 7,
                        data.from.length
                      )}
                    </div>
                  </div>

                  <div className={'confirmCurrency__keyValues'}>
                    <div className={'confirmCurrency__keyValues__key'}>To</div>
                    <div className={'confirmCurrency__keyValues__value'}>
                      {data.to.substring(0, 7)}....
                      {data.to.substring(data.to.length - 7, data.to.length)}
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
                      maxWidth='100%'
                      onClick={async () => {
                        setOpenmodal(true);
                      }}
                      text='Accept'
                    />
                    <div className='cancelBtn'>
                      <ButtonComp
                        maxWidth='100%'
                        onClick={async () => {
                          handleResponse(null);
                        }}
                        text='Reject'
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
        customClass='customClassModal'
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
                      alt=''
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
                      maxWidth='100%'
                      onClick={async () => {
                        setOpenmodal(true);
                      }}
                      text='Accept'
                    />
                    <div className='cancelBtn'>
                      <ButtonComp
                        maxWidth='100%'
                        onClick={async () => {
                          handleResponse(null);
                        }}
                        text='Reject'
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
        customClass='customClassModal'
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
                      alt=''
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
                    <img src={ArrowDashedLine} width={144} height={12} />
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
                      maxWidth='100%'
                      onClick={async () => {
                        handleChainSwitch();
                      }}
                      text='Accept'
                    />
                    <div className='cancelBtn'>
                      <ButtonComp
                        maxWidth='100%'
                        onClick={async () => {
                          handleResponse(false);
                        }}
                        text='Reject'
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
        title={'Confirm Transaction'}
        handleCancel={handleCancel}
        isModalOpen={isModalOpen}
        handleOk={handleOk}
        customClass='customClassModal'
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
              placeholder='Password'
              getData={setPassword}
              value={sessionPassword}
              customFunction={async () => {
                const { password } = await chrome.storage.session.get(
                  'password'
                );

                if (sessionPassword !== password) {
                  return messageApi.error('Incorrect password provided.');
                }

                handleTransaction();
              }}
            />
          </div>
          <ButtonComp
            text={'Proceed'}
            maxWidth={'100%'}
            onClick={async () => {
              const { password } = await chrome.storage.session.get('password');

              if (sessionPassword !== password) {
                return messageApi.error('Incorrect password provided.');
              }

              handleTransaction();
            }}
          />
        </div>
      </ModalCustom>

      {/* ******************** Start ********************** */}

      {/* **** Native Connect ***** */}

      <ModalCustom
        title={'Request Accounts'}
        isModalOpen={method === 'nativeConnect'}
        customClass='customClassModal'
        handleCancel={() => {
          setMethod(null);
        }}
      >
        {account && method === 'nativeConnect' ? (
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
                      alt=''
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
                      maxWidth='100%'
                      onClick={async () => {
                        handleResponse([
                          data?.network === 'solana'
                            ? account.coinFamilyAndAddress[4]
                            : account.address,
                        ]);
                      }}
                      text='Accept'
                    />
                    <div className='cancelBtn'>
                      <ButtonComp
                        maxWidth='100%'
                        onClick={async () => {
                          handleResponse([]);
                        }}
                        text='Reject'
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </ModalCustom>

      {/* **** Create validators **** */}
      <ModalCustom
        title={'Create Validator'}
        isModalOpen={method === 'createValidator'}
        customClass='customClassModal'
        handleCancel={() => {
          setMethod(null);
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
                      alt=''
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
                      {data.secondaryValues.Bond_Amount}
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
                      maxWidth='100%'
                      onClick={async () => {
                        setOpenmodal(true);
                      }}
                      text='Accept'
                    />
                    <div className='cancelBtn'>
                      <ButtonComp
                        maxWidth='100%'
                        onClick={async () => {
                          handleResponse(null);
                        }}
                        text='Reject'
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
        isModalOpen={method === 'editValidator'}
        customClass='customClassModal'
        handleCancel={() => {
          setMethod(null);
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
                      alt=''
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
                      maxWidth='100%'
                      onClick={async () => {
                        setOpenmodal(true);
                      }}
                      text='Accept'
                    />
                    <div className='cancelBtn'>
                      <ButtonComp
                        maxWidth='100%'
                        onClick={async () => {
                          handleResponse(null);
                        }}
                        text='Reject'
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
        isModalOpen={method === 'bondMoreFunds'}
        customClass='customClassModal'
        handleCancel={() => {
          setMethod(null);
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
                      alt=''
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
                      {data.userAddress}
                    </div>
                  </div>

                  <div className={'confirmCurrency__keyValues'}>
                    <div className={'confirmCurrency__keyValues__key'}>
                      Amount
                    </div>
                    <div className={'confirmCurrency__keyValues__value'}>
                      {data.bondAmount}
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
                      maxWidth='100%'
                      onClick={async () => {
                        setOpenmodal(true);
                      }}
                      text='Accept'
                    />
                    <div className='cancelBtn'>
                      <ButtonComp
                        maxWidth='100%'
                        onClick={async () => {
                          handleResponse(null);
                        }}
                        text='Reject'
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
        isModalOpen={method === 'delegatorBondMoreFunds'}
        customClass='customClassModal'
        handleCancel={() => {
          setMethod(null);
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
                      alt=''
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
                      {data.userAddress}
                    </div>
                  </div>

                  <div className={'confirmCurrency__keyValues'}>
                    <div className={'confirmCurrency__keyValues__key'}>
                      Amount
                    </div>
                    <div className={'confirmCurrency__keyValues__value'}>
                      {data.stakeAmount}
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
                      maxWidth='100%'
                      onClick={async () => {
                        setOpenmodal(true);
                      }}
                      text='Accept'
                    />
                    <div className='cancelBtn'>
                      <ButtonComp
                        maxWidth='100%'
                        onClick={async () => {
                          handleResponse(null);
                        }}
                        text='Reject'
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
        isModalOpen={method === 'redelegate'}
        customClass='customClassModal'
        handleCancel={() => {
          setMethod(null);
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
                      alt=''
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
                      {data.selectedAccout}
                    </div>
                  </div>

                  <div className={'confirmCurrency__keyValues'}>
                    <div className={'confirmCurrency__keyValues__key'}>
                      Amount
                    </div>
                    <div className={'confirmCurrency__keyValues__value'}>
                      {data.stakeAmount}
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
                      maxWidth='100%'
                      onClick={async () => {
                        setOpenmodal(true);
                      }}
                      text='Accept'
                    />
                    <div className='cancelBtn'>
                      <ButtonComp
                        maxWidth='100%'
                        onClick={async () => {
                          handleResponse(null);
                        }}
                        text='Reject'
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
        isModalOpen={method === 'unBondFunds'}
        customClass='customClassModal'
        handleCancel={() => {
          setMethod(null);
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
                      alt=''
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
                      {data.userAddress}
                    </div>
                  </div>

                  <div className={'confirmCurrency__keyValues'}>
                    <div className={'confirmCurrency__keyValues__key'}>
                      Amount
                    </div>
                    <div className={'confirmCurrency__keyValues__value'}>
                      {data.unBoundAmt}
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
                      maxWidth='100%'
                      onClick={async () => {
                        setOpenmodal(true);
                      }}
                      text='Accept'
                    />
                    <div className='cancelBtn'>
                      <ButtonComp
                        maxWidth='100%'
                        onClick={async () => {
                          handleResponse(null);
                        }}
                        text='Reject'
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
        isModalOpen={method === 'stopValidator'}
        customClass='customClassModal'
        handleCancel={() => {
          setMethod(null);
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
                      alt=''
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
                      {data.userAddress}
                    </div>
                  </div>

                  <div className={'confirmCurrency__keyValues'}>
                    <div className={'confirmCurrency__keyValues__key'}>
                      Amount
                    </div>
                    <div className={'confirmCurrency__keyValues__value'}>
                      {data.unBoundAmt}
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
                      maxWidth='100%'
                      onClick={async () => {
                        setOpenmodal(true);
                      }}
                      text='Accept'
                    />
                    <div className='cancelBtn'>
                      <ButtonComp
                        maxWidth='100%'
                        onClick={async () => {
                          handleResponse(null);
                        }}
                        text='Reject'
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
        isModalOpen={method === 'unJailValidator'}
        customClass='customClassModal'
        handleCancel={() => {
          setMethod(null);
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
                      alt=''
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
                      {data.address}
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
                      maxWidth='100%'
                      onClick={async () => {
                        setOpenmodal(true);
                      }}
                      text='Accept'
                    />
                    <div className='cancelBtn'>
                      <ButtonComp
                        maxWidth='100%'
                        onClick={async () => {
                          handleResponse(null);
                        }}
                        text='Reject'
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
        isModalOpen={method === 'stopDeactivating'}
        customClass='customClassModal'
        handleCancel={() => {
          setMethod(null);
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
                      alt=''
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
                      {data.address}
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
                      maxWidth='100%'
                      onClick={async () => {
                        setOpenmodal(true);
                      }}
                      text='Accept'
                    />
                    <div className='cancelBtn'>
                      <ButtonComp
                        maxWidth='100%'
                        onClick={async () => {
                          handleResponse(null);
                        }}
                        text='Reject'
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
