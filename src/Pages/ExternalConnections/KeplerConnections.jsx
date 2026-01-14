/*global chrome*/
import './external.scss';
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import ModalCustom from '../../Components/ModalCustom/ModalCustom';
import logo from '../../Assets/logo.png';
import moment from 'moment';
import { message } from 'antd';
import { store } from '../..';
import { setLoading } from '../../actions/loading';
import InputFieldSimple from '../../Components/InputField/InputFieldSimple';
import ButtonComp from '../../Components/ButtonComp/ButtonComp';
import { WalletHelper } from '../../helpers/wallet.helper';
import { SecurityHelper } from '../../helpers/security.helper';
import {
  getChainConfig,
  enableChain,
  isChainEnabled,
  getKeyForChain,
  signAminoMessage,
  signDirectMessage,
  broadcastTransaction
} from '../../helpers/kepler.helper';
import { useLocation } from 'react-router-dom';

export const KeplerConnections = () => {
  const { state } = useLocation();
  const { account } = useSelector((state) => state);
  const [method, setMethod] = useState(null);
  const [data, setData] = useState(null);
  const [sessionPassword, setPassword] = useState(null);
  const [isModalOpen, setOpenmodal] = useState(false);
  const [mnemonics, setMnemonics] = useState(null);
  const [defaultAccount, setDefaultAccounts] = useState(null);
  const [chainConfig, setChainConfig] = useState(null);
  const [messageApi, contextHolder] = message.useMessage();
  const [pendingAction, setPendingAction] = useState(null); // Store pending action that needs password

  const init = async (password) => {
    console.log('🔧 [init] Initializing Kepler connection...');
    const { chains } = await chrome.storage.local.get('chains');
    let { accounts } = await chrome.storage.session.get('accounts');
    const { mnemonics } = await chrome.storage.local.get('mnemonics');
    
    // If accounts not in session storage, try to get from local storage
    // (following WalletHelper pattern)
    if (!accounts || accounts.length === 0) {
      console.log('🔧 [init] Accounts not in session, checking local storage...');
      const { accounts: localAccounts } = await chrome.storage.local.get('accounts');
      if (localAccounts && Array.isArray(localAccounts) && localAccounts.length > 0) {
        // Accounts in local storage are plain objects (not encrypted in this context)
        accounts = localAccounts;
        console.log('🔧 [init] Found accounts in local storage');
      }
    }
    
    console.log('🔧 [init] Storage data:', {
      hasChains: !!chains,
      hasAccounts: !!accounts,
      hasMnemonics: !!mnemonics,
      accountsCount: accounts?.length || 0,
      accountsType: Array.isArray(accounts) ? 'array' : typeof accounts
    });
    
    // DO NOT decrypt mnemonics automatically - require password input
    // Mnemonics will be decrypted when user enters password for operations
    
    // Find default account using the same pattern as WalletHelper
    const defaultAccount = accounts?.find((el) => el.default);
    if (defaultAccount) {
      const defaultAddress = defaultAccount.address;
      console.log('🔧 [init] Default account found:', {
        address: defaultAddress,
        id: defaultAccount.id,
        name: defaultAccount.name
      });
      setDefaultAccounts(defaultAddress);
    } else {
      console.warn('⚠️ [init] No default account found in accounts:', accounts);
    }

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
          setMethod(method);

          // Get chain config if chainId is provided
          if (data?.chainId) {
            const config = getChainConfig(data.chainId);
            setChainConfig(config);
          }
        } catch (error) {
          console.error('Error initializing Kepler connection:', error);
        }
      }
    );
  };

  const handleResponse = async (result, error) => {
    console.log('📤 [handleResponse] Sending response:', { method, hasResult: !!result, hasError: !!error });
    
    // Properly serialize error object
    let serializedError = null;
    if (error) {
      console.log('📤 [handleResponse] Serializing error:', error);
      
      if (typeof error === 'string') {
        serializedError = { message: error };
      } else if (error instanceof Error) {
        serializedError = {
          message: error.message || 'Unknown error',
          name: error.name || 'Error',
          stack: error.stack,
          details: error.details || {}
        };
      } else if (typeof error === 'object') {
        // Ensure all properties are serializable
        serializedError = {
          message: error.message || error.toString() || 'Unknown error',
          ...(error.details && { details: error.details }),
          ...(error.code && { code: error.code }),
          ...(error.name && { name: error.name })
        };
      } else {
        serializedError = { message: String(error) };
      }
      
      console.log('📤 [handleResponse] Serialized error:', serializedError);
    }
    
    const messagePayload = { 
      method, 
      result, 
      error: serializedError 
    };
    
    console.log('📤 [handleResponse] Final payload:', messagePayload);
    
    chrome.runtime.sendMessage(messagePayload, (response) => {
      if (chrome.runtime.lastError) {
        console.error('❌ [handleResponse] Failed to send message:', chrome.runtime.lastError);
      } else {
        console.log('✅ [handleResponse] Message sent successfully');
      }
      
      // Add a small delay before closing window to ensure message is received
      setTimeout(async () => {
        chrome.windows.getCurrent(async function (window) {
          await chrome.storage.local.set({ isApproved: true });
          chrome.windows.remove(window.id);
        });
      }, 100); // Small delay to ensure message is received
    });
  };

  const handleEnable = async () => {
    try {
      if (!data?.chainId || !data?.origin) {
        throw new Error('Missing chainId or origin');
      }

      await enableChain(data.chainId, data.origin);
      handleResponse({ enabled: true });
    } catch (error) {
      console.error('Error enabling chain:', error);
      handleResponse(null, { message: error.message });
    }
  };

  // Internal function to actually perform getKey after password is verified
  const performGetKey = async (password) => {
    console.log('🔑 [performGetKey] Executing getKey with password...');
    
    try {
      if (!data?.chainId) {
        throw new Error('Missing chainId');
      }
      
      if (!defaultAccount) {
        throw new Error('Missing default account');
      }
      
      // Get mnemonic using password
      console.log('🔑 [performGetKey] Getting mnemonic with password...');
      const mnemonicPhrase = await WalletHelper.getMnemonicsByPassword(
        defaultAccount,
        password
      );
      
      if (!mnemonicPhrase) {
        throw new Error('Failed to retrieve mnemonic phrase');
      }
      
      console.log('✅ [performGetKey] Mnemonic retrieved, calling getKeyForChain...');
      const key = await getKeyForChain(data.chainId, mnemonicPhrase);
      
      console.log('✅ [performGetKey] Key retrieved successfully:', {
        address: key?.address,
        hasPubKey: !!key?.pubKey
      });
      
      handleResponse(key);
    } catch (error) {
      console.error('❌ [performGetKey] Error occurred:', error);
      handleResponse(null, { 
        message: error?.message || 'Failed to get key',
        error: error?.details || error
      });
    }
  };

  const handleGetKey = async () => {
    console.log('🔑 [handleGetKey] Starting getKey request');
    console.log('🔑 [handleGetKey] State:', { 
      chainId: data?.chainId, 
      hasDefaultAccount: !!defaultAccount
    });
    
    try {
      // Validate inputs
      if (!data?.chainId) {
        const error = new Error('Missing chainId');
        console.error('❌ [handleGetKey] Missing chainId');
        throw error;
      }
      
      if (!defaultAccount) {
        const error = new Error('Missing default account');
        console.error('❌ [handleGetKey] Missing default account');
        throw error;
      }
      
      // Always prompt for password - do not use stored password
      console.log('🔑 [handleGetKey] Prompting for password...');
      setPendingAction('getKey');
      setOpenmodal(true);
      
    } catch (error) {
      console.error('❌ [handleGetKey] Error occurred:', error);
      handleResponse(null, { 
        message: error?.message || 'Failed to get key',
        error: error?.details || error
      });
    }
  };

  const handleSignAmino = async (mnemonic) => {
    try {
      store.dispatch(setLoading(true));
      console.log("data of sign amino", data);
      if (!data?.chainId || !data?.signer || !data?.signDoc) {
        throw new Error('Missing required parameters');
      }

      const signed = await signAminoMessage(
        data.chainId,
        data.signer,
        data.signDoc,
        mnemonic
      );

      store.dispatch(setLoading(false));
      handleResponse(signed);
    } catch (error) {
      console.error('Error signing Amino:', error);
      store.dispatch(setLoading(false));
      handleResponse(null, { message: error.message });
    }
  };

  const handleSignDirect = async (mnemonic) => {
    try {
      store.dispatch(setLoading(true));
      
      if (!data?.chainId || !data?.signer || !data?.signDoc) {
        throw new Error('Missing required parameters');
      }

      const signed = await signDirectMessage(
        data.chainId,
        data.signer,
        data.signDoc,
        mnemonic
      );

      store.dispatch(setLoading(false));
      handleResponse(signed);
    } catch (error) {
      console.error('Error signing Direct:', error);
      store.dispatch(setLoading(false));
      handleResponse(null, { message: error.message });
    }
  };

  const handleSendTx = async () => {
    try {
      store.dispatch(setLoading(true));
      console.log("data of tics transfer",data);
      if (!data?.chainId || !data?.tx) {
        throw new Error('Missing required parameters');
      }

      const result = await broadcastTransaction(
        data.chainId,
        data.tx,
        data.mode || 'block'
      );

      store.dispatch(setLoading(false));
      handleResponse(result);
    } catch (error) {
      console.error('Error sending transaction:', error);
      store.dispatch(setLoading(false));
      handleResponse(null, { message: error.message });
    }
  };

  useEffect(() => {
    init(state?.password);
  }, [account, state]);

  return (
    <>
      {contextHolder}
      
      {/* Enable Chain Modal */}
      <ModalCustom
        title={'Enable Chain Access'}
        isModalOpen={method === 'kepler_enable'}
        customClass="customClassModal"
        handleCancel={() => {
          setMethod(null);
          handleResponse(null, { message: 'Rejected by user' });
        }}
      >
        {method === 'kepler_enable' && chainConfig ? (
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
                      Enable Chain Access
                    </p>
                    <p className={'swapDetails__address__val'}>
                      <span>
                        The website wants to connect to {chainConfig.chainName}.
                        This will allow the website to view your address and request
                        transaction signatures.
                      </span>
                    </p>
                  </div>
                  <div className={'swapDetails__address'}>
                    <p className={'swapDetails__address__key'}>Chain</p>
                    <p className={'swapDetails__address__val'}>
                      <span>{chainConfig.chainName}</span>
                    </p>
                  </div>
                  <div className={'swapDetails__address'}>
                    <p className={'swapDetails__address__key'}>Chain ID</p>
                    <p className={'swapDetails__address__val'}>
                      <span>{chainConfig.chainId}</span>
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
                      onClick={handleEnable}
                      text="Accept"
                    />
                    <div className="cancelBtn">
                      <ButtonComp
                        maxWidth="100%"
                        onClick={() => {
                          handleResponse(null, { message: 'Rejected by user' });
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

      {/* Get Key Modal */}
      <ModalCustom
        title={'Get Public Key'}
        isModalOpen={method === 'kepler_getKey'}
        customClass="customClassModal"
        handleCancel={() => {
          setMethod(null);
          handleResponse(null, { message: 'Rejected by user' });
        }}
      >
        {method === 'kepler_getKey' && chainConfig ? (
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
                      Get Public Key
                    </p>
                    <p className={'swapDetails__address__val'}>
                      <span>
                        The website wants to access your public key and address
                        for {chainConfig.chainName}.
                      </span>
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
                      onClick={handleGetKey}
                      text="Accept"
                    />
                    <div className="cancelBtn">
                      <ButtonComp
                        maxWidth="100%"
                        onClick={() => {
                          handleResponse(null, { message: 'Rejected by user' });
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

      {/* Sign Amino Modal */}
      <ModalCustom
        title={'Sign Transaction (Amino)'}
        isModalOpen={method === 'kepler_signAmino'}
        customClass="customClassModal"
        handleCancel={() => {
          setMethod(null);
          handleResponse(null, { message: 'Rejected by user' });
        }}
      >
        {method === 'kepler_signAmino' && data ? (
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
                      Sign Transaction
                    </p>
                    <p className={'swapDetails__address__val'}>
                      <span>
                        Please review the transaction details and confirm to sign.
                      </span>
                    </p>
                  </div>
                  {data.signDoc && (
                    <>
                      <div className={'swapDetails__address'}>
                        <p className={'swapDetails__address__key'}>Chain ID</p>
                        <p className={'swapDetails__address__val'}>
                          <span>{data.signDoc.chain_id}</span>
                        </p>
                      </div>
                      {data.signDoc.memo && (
                        <div className={'swapDetails__address'}>
                          <p className={'swapDetails__address__key'}>Memo</p>
                          <p className={'swapDetails__address__val'}>
                            <span>{data.signDoc.memo}</span>
                          </p>
                        </div>
                      )}
                    </>
                  )}
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
                      onClick={() => setOpenmodal(true)}
                      text="Accept"
                    />
                    <div className="cancelBtn">
                      <ButtonComp
                        maxWidth="100%"
                        onClick={() => {
                          handleResponse(null, { message: 'Rejected by user' });
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

      {/* Sign Direct Modal */}
      <ModalCustom
        title={'Sign Transaction (Direct)'}
        isModalOpen={method === 'kepler_signDirect'}
        customClass="customClassModal"
        handleCancel={() => {
          setMethod(null);
          handleResponse(null, { message: 'Rejected by user' });
        }}
      >
        {method === 'kepler_signDirect' && data ? (
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
                      Sign Transaction
                    </p>
                    <p className={'swapDetails__address__val'}>
                      <span>
                        Please review the transaction details and confirm to sign.
                      </span>
                    </p>
                  </div>
                  {data.signDoc && (
                    <div className={'swapDetails__address'}>
                      <p className={'swapDetails__address__key'}>Chain ID</p>
                      <p className={'swapDetails__address__val'}>
                        <span>{data.chainId}</span>
                      </p>
                    </div>
                  )}
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
                      onClick={() => setOpenmodal(true)}
                      text="Accept"
                    />
                    <div className="cancelBtn">
                      <ButtonComp
                        maxWidth="100%"
                        onClick={() => {
                          handleResponse(null, { message: 'Rejected by user' });
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

      {/* Send Transaction Modal */}
      <ModalCustom
        title={'Send Transaction'}
        isModalOpen={method === 'kepler_sendTx'}
        customClass="customClassModal"
        handleCancel={() => {
          setMethod(null);
          handleResponse(null, { message: 'Rejected by user' });
        }}
      >
        {method === 'kepler_sendTx' && data ? (
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
                      Broadcast Transaction
                    </p>
                    <p className={'swapDetails__address__val'}>
                      <span>
                        The website wants to broadcast a signed transaction.
                      </span>
                    </p>
                  </div>
                  <div className={'swapDetails__address'}>
                    <p className={'swapDetails__address__key'}>Mode</p>
                    <p className={'swapDetails__address__val'}>
                      <span>{data.mode || 'block'}</span>
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
                      onClick={handleSendTx}
                      text="Accept"
                    />
                    <div className="cancelBtn">
                      <ButtonComp
                        maxWidth="100%"
                        onClick={() => {
                          handleResponse(null, { message: 'Rejected by user' });
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

      {/* Password Modal */}
      <ModalCustom
        title={'Enter password'}
        isModalOpen={isModalOpen}
        handleCancel={() => {
          setOpenmodal(false);
          setPassword(null);
          setPendingAction(null);
          if (pendingAction) {
            handleResponse(null, { message: 'Password entry cancelled by user' });
          }
        }}
        customClass="customClassModal"
      >
        <div className={'swapDetails__address'}>
          <p className={'swapDetails__address__key'}>
            {pendingAction === 'getKey' 
              ? 'Please enter your password to retrieve your account key'
              : 'Please enter your password to confirm the transaction'}
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
              type="password"
              getData={setPassword}
              value={sessionPassword}
              customFunction={async () => {
                if (!sessionPassword) {
                  return messageApi.error('Please enter password.');
                }
                
                // Verify password by trying to get mnemonic
                const mnemonicPhrase = await WalletHelper.getMnemonicsByPassword(
                  defaultAccount,
                  sessionPassword
                );

                if (!mnemonicPhrase) {
                  return messageApi.error('Incorrect password provided.');
                }
                
                // Password verified, proceed with action
                setOpenmodal(false);
                const passwordToUse = sessionPassword;
                setPassword(null);
                
                if (pendingAction === 'getKey') {
                  await performGetKey(passwordToUse);
                } else if (method === 'kepler_signAmino') {
                  handleSignAmino(mnemonicPhrase);
                } else if (method === 'kepler_signDirect') {
                  handleSignDirect(mnemonicPhrase);
                }
                
                setPendingAction(null);
              }}
            />
          </div>
          <ButtonComp
            text={'Proceed'}
            maxWidth={'100%'}
            onClick={async () => {
              if (!sessionPassword) {
                return messageApi.error('Please enter password.');
              }
              
              // Verify password by trying to get mnemonic
              const mnemonicPhrase = await WalletHelper.getMnemonicsByPassword(
                defaultAccount,
                sessionPassword
              );
              
              if (!mnemonicPhrase) {
                return messageApi.error('Incorrect password provided.');
              }

              // Password verified, proceed with action
              setOpenmodal(false);
              const passwordToUse = sessionPassword;
              setPassword(null);
              
              if (pendingAction === 'getKey') {
                await performGetKey(passwordToUse);
              } else if (method === 'kepler_signAmino') {
                handleSignAmino(mnemonicPhrase);
              } else if (method === 'kepler_signDirect') {
                handleSignDirect(mnemonicPhrase);
              }
              
              setPendingAction(null);
            }}
          />
        </div>
      </ModalCustom>
    </>
  );
};


