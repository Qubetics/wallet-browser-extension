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
import ArrowDashedLine from '../../Assets/arr.svg';
import BigNumber from 'bignumber.js';
import { addCommasToNumber } from '../../helpers/conversion.helper';
import { SolanaHelper } from '../../helpers/solana.helper';

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

  let price = null;

  const handleOk = () => {
    setOpenmodal(false);
  };

  const handleCancel = () => {
    setOpenmodal(false);
  };

  const init = async () => {
    const { chains } = await chrome.storage.local.get('chains');
    setChain(chains.find((el) => el.default));

    const myDefaultChain = chains.find((el) => el.default);

    chrome.tabs.query(
      { active: true, currentWindow: true },
      async function (tabs) {
        try {
          const tab = tabs[0];
          const url = new URL(tab.url);
          const queryParams = new URLSearchParams(url.search);
          console.log("QUERYYYYYYYYYY PARAMS ", queryParams);
          
          const method = queryParams.get('method');

          const data = queryParams.get('data')
            ? JSON.parse(decodeURIComponent(queryParams.get('data')))
            : null;
          setData(data);

          if (method === 'requestAccounts' && account) {
            setMethod('requestAccounts');
            store.dispatch(setLoading(false));
          } else if (method === 'signTransaction' && account) {
            const symbol = myDefaultChain.slug == 'polygon' ? "pol" : myDefaultChain.slug == "ethereum" ? "eth" : myDefaultChain.slug == "binancesmartchain" ? "bnb" : ""
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
                ? process.env.REACT_APP_ETH_RPC :
                myDefaultChain?.chainId == 9009 ? process.env.REACT_APP_QUBETIC_RPC
                  : myDefaultChain?.chainId == 137 ? process.env.REACT_APP_MATIC_RPC : process.env.REACT_APP_BNB_RPC;
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

  const handleResponse = (result) => {
    console.log('🚀 ~ file: ExternalConnections.jsx:105 ~ handleResponse ~ result', result);
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
      } else {
        const gasLimit = Web3.utils.toDecimal(data.gas);
        // console.log("gasLimit TRX ", gasLimit);
        const { chains } = await chrome.storage.local.get('chains');
        const myDefaultChain = chains.find((el) => el.default);
        const symbol = myDefaultChain.slug == 'polygon' ? "pol" : myDefaultChain.slug == "ethereum" ? "eth" : myDefaultChain.slug == "binancesmartchain" ? "bnb" : ""
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
    </>
  );
};
