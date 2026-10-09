/*global chrome*/
// import { randomBytes } from 'crypto-browserify';
import { v4 as uuidv4 } from 'uuid';
const {
  JsonRpcEngine,
  createAsyncMiddleware,
} = require('@metamask/json-rpc-engine');
const engine = new JsonRpcEngine();
// const NodeRSA = require('node-rsa');

const normalizeConnectedDappEntry = (raw = {}) => {
  const source = raw && typeof raw === 'object' ? raw : {};
  const candidateUrl = [
    source.url,
    source.origin,
    source.referer,
    source.referrer,
    'https://delegator.qubetics.com/',
  ].find((value) => typeof value === 'string' && value.trim().length > 0);

  let normalizedUrl = '';
  try {
    normalizedUrl = new URL(candidateUrl).origin;
  } catch (error) {
    normalizedUrl = String(candidateUrl || '').trim();
  }
  if (!normalizedUrl) {
    normalizedUrl = 'https://delegator.qubetics.com';
  }

  let hostname = '';
  try {
    hostname = new URL(normalizedUrl).hostname;
  } catch (error) {}

  const title =
    (typeof source.title === 'string' && source.title.trim()) ||
    (hostname ? hostname : 'Qubetics Delegator');
  const image =
    typeof source.image === 'string' && source.image.trim()
      ? source.image.trim()
      : 'https://prod-qubetics-wallet.obs.ap-southeast-4.myhuaweicloud.com/tics_logo.png';

  return {
    url: normalizedUrl,
    image,
    title,
    time: source.time || new Date().toISOString(),
  };
};

const enrichRpcRequestWithSender = (rpcRequest, sender) => {
  if (!rpcRequest || typeof rpcRequest !== 'object') {
    return rpcRequest;
  }

  const withMeta = { ...rpcRequest };
  const tabUrl =
    (sender?.tab && typeof sender.tab.url === 'string' && sender.tab.url) ||
    (typeof sender?.url === 'string' && sender.url) ||
    '';

  if (!withMeta.url && tabUrl) {
    withMeta.url = tabUrl;
  }

  if (!withMeta.origin && tabUrl) {
    try {
      withMeta.origin = new URL(tabUrl).origin;
    } catch (error) {}
  }

  return withMeta;
};

const enrichRpcPayloadWithSender = (payload, sender) => {
  if (Array.isArray(payload)) {
    return payload.map((request) => enrichRpcRequestWithSender(request, sender));
  }
  return enrichRpcRequestWithSender(payload, sender);
};

const networks = [
  {
    id: uuidv4(),
    chainName: 'Ethereum',
    chainId: '1',
    currencyName: 'ETH',
    currencySymbol: 'ETH',
    currencyDecimals: 18,
    rpcUrl: process.env.REACT_APP_ETH_RPC,
    rpcApiKey: null,
    blockUrl: 'https://etherscan.io',
    default: true,
    image: 'https://prod-qubetics-wallet.obs.ap-southeast-4.myhuaweicloud.com/ETH.png',
    tokenType: 'ERC20',
    testnet: false,
    swap: true,
    isEVM: true,
    supportTokens: true,
    coinFamily: 2,
    slug: 'ethereum',
    status: true,
  },
  {
    id: uuidv4(),
    chainName: 'BNB Smart Chain',
    chainId: '56',
    currencyName: 'BNB',
    currencySymbol: 'BNB',
    currencyDecimals: 18,
    rpcUrl: process.env.REACT_APP_BNB_RPC,
    rpcApiKey: null,
    blockUrl: 'https://bscscan.com',
    default: false,
    // image:
    //   'https://REDACTED/images/bnb.png',
    image: 'https://prod-qubetics-wallet.obs.ap-southeast-4.myhuaweicloud.com/BNB.png',
    tokenType: 'BEP20',
    testnet: false,
    swap: true,
    isEVM: true,
    supportTokens: true,
    coinFamily: 1,
    slug: 'binancesmartchain',
    status: true,
  },
  // {
  //   id: uuidv4(),
  //   chainName: 'Avalanche',
  //   chainId: '43114',
  //   currencyName: 'AVAX',
  //   currencySymbol: 'AVAX',
  //   currencyDecimals: 18,
  //   rpcUrl: '',
  //   rpcApiKey: null,
  //   blockUrl: 'https://snowtrace.io/',
  //   default: false,
  //   image: 'https://s2.coinmarketcap.com/static/img/coins/64x64/5805.png',
  //   tokenType: 'ERC20',
  //   testnet: false,
  //   swap: false,
  //   isEVM: true,
  //   supportTokens: true,
  //   coinFamily: 7,
  //   slug: 'avax',
  //   status: true,
  // },
  {
    id: uuidv4(),
    chainName: 'Polygon',
    chainId: '137',
    currencyName: 'POL',
    currencySymbol: 'POL',
    currencyDecimals: 18,
    rpcUrl: process.env.REACT_APP_MATIC_RPC,
    rpcApiKey: null,
    blockUrl: 'https://polygonscan.com',
    default: false,
    image: 'https://prod-qubetics-wallet.obs.ap-southeast-4.myhuaweicloud.com/MATIC.png',
    tokenType: 'ERC20',
    testnet: false,
    swap: false,
    isEVM: true,
    supportTokens: true,
    coinFamily: 4,
    slug: 'matic',
    status: true,
  },
  // {
  //   id: uuidv4(),
  //   chainName: 'Cronos',
  //   chainId: '25',
  //   currencyName: 'CRO',
  //   currencySymbol: 'CRO',
  //   currencyDecimals: 18,
  //   rpcUrl: '',
  //   rpcApiKey: null,
  //   blockUrl: 'https://cronoscan.com/',
  //   default: false,
  //   image: 'https://REDACTED/cro.png',
  //   tokenType: 'ERC20',
  //   testnet: false,
  //   swap: false,
  //   isEVM: true,
  //   supportTokens: true,
  //   coinFamily: 8,
  //   slug: 'cro',
  //   status: true,
  // },
  {
    id: uuidv4(),
    chainName: 'Solana',
    chainId: '1399811149',
    currencyName: 'SOL',
    currencySymbol: 'SOL',
    currencyDecimals: 6,
    rpcUrl: process.env.REACT_APP_SOL_RPC,
    rpcApiKey: null,
    blockUrl: 'https://solscan.io/',
    default: false,
    image: 'https://prod-qubetics-wallet.obs.ap-southeast-4.myhuaweicloud.com/Solana.png',
    tokenType: 'SPL20',
    testnet: false,
    swap: false,
    isEVM: false,
    supportTokens: true,
    coinFamily: 5,
    slug: 'sol',
    status: false,
  },
  {
    id: uuidv4(),
    chainName: 'Bitcoin',
    chainId: 'BTC0',
    currencyName: 'BTC',
    currencySymbol: 'BTC',
    currencyDecimals: 3,
    rpcUrl: process.env.REACT_APP_BTC_RPC,
    rpcApiKey: null,
    blockUrl: 'https://www.blockchain.com/explorer/transactions/',
    default: false,
    image: 'https://prod-qubetics-wallet.obs.ap-southeast-4.myhuaweicloud.com/BTC.png',
    tokenType: 'BTC',
    testnet: false,
    swap: false,
    isEVM: false,
    supportTokens: false,
    coinFamily: 3,
    slug: 'btc',
    status: false,
  },
  // {
  //   id: uuidv4(),
  //   chainName: 'Bitcoin Testnet',
  //   chainId: 'BTC_TEST',
  //   currencyName: 'BTC Testnet',
  //   currencySymbol: 'tBTC',
  //   currencyDecimals: 8, // Usually testnets use standard 8 decimals
  //   rpcUrl: '', // 🔁 Use a valid testnet RPC
  //   rpcApiKey: 'YOUR_TESTNET_API_KEY', // 🔁 Replace with testnet key if needed
  //   blockUrl: 'https://mempool.space/testnet/tx/', // 🔁 Testnet block explorer
  //   default: false,
  //   image: 'https://REDACTED/btc.png', // ✅ Same image is okay
  //   tokenType: 'BTC',
  //   testnet: true, // ✅ Mark as testnet
  //   swap: false,
  //   isEVM: false,
  //   supportTokens: false,
  //   coinFamily: 3,
  //   slug: 'btc-test',
  //   status: true, // If you want to enable it for testing
  // }
  // ,  
  // {
  //   id: uuidv4(),
  //   chainName: 'Cardano',
  //   chainId: 'ADA0',
  //   currencyName: 'ADA',
  //   currencySymbol: 'ADA',
  //   currencyDecimals: 6,
  //   rpcUrl: 'https://ada.nownodes.io/v2',
  //   rpcApiKey: '',
  //   blockUrl: 'https://explorer.cardano-testnet.iohkdev.io/',
  //   default: false,
  //   image: 'https://REDACTED/ada.png',
  //   tokenType: 'ADA',
  //   testnet: false,
  //   swap: false,
  //   isEVM: false,
  //   supportTokens: true,
  //   coinFamily: 5,
  //   slug: 'ada',
  //   status: false,
  // },
  // {
  //   id: uuidv4(),
  //   chainName: 'PulseChain',
  //   chainId: '369',
  //   currencyName: 'PLS',
  //   currencySymbol: 'PLS',
  //   currencyDecimals: 18,
  //   rpcUrl: 'https://rpc.pulsechain.com',
  //   rpcApiKey: null,
  //   blockUrl: 'https://otter.PulseChain.com',
  //   default: false,
  //   image: 'https://REDACTED/1694522712555_11145.png',
  //   tokenType: 'ERC20',
  //   testnet: false,
  //   swap: false,
  //   isEVM: true,
  //   supportTokens: true,
  //   coinFamily: 9,
  //   slug: 'pls',
  //   status: true,
  // },
  {
    id: uuidv4(),
    chainName: 'Qubetics Mainnet',
    chainId: 9030,
    currencyName: 'qubetics',
    currencySymbol: 'TICS',
    currencyDecimals: 18,//-----
    rpcUrl: process.env.REACT_APP_QUBETIC_RPC,
    rpcApiKey: null,
    blockUrl: 'https://ticsscan.com',
    default: false,
    image: 'https://prod-qubetics-wallet.obs.ap-southeast-4.myhuaweicloud.com/tics_logo.png',
    tokenType: 'ERC20',
    testnet: false,
    swap: false,
    isEVM: true,
    supportTokens: true,
    coinFamily: 7,
    slug: 'tics',
    status: true,
  },
  // {
  //   id: uuidv4(),
  //   chainName: 'Qubetics Testnet',
  //   chainId: 9029, // ✅ Updated Chain ID
  //   currencyName: 'qubetics Testnet',
  //   currencySymbol: 'TICS',
  //   currencyDecimals: 18, // ✅ Same as mainnet
  //   rpcUrl: process.env.REACT_APP_QUBETIC_TESTNET_RPC, // ✅ Updated testnet RPC
  //   rpcApiKey: null, // ✅ No change
  //   blockUrl: 'https://testnet.qubetics.work/tx/', // ✅ Updated explorer
  //   default: false,
  //   image: 'https://prod-qubetics-wallet.obs.ap-southeast-4.myhuaweicloud.com/tics_logo.png',
  //   tokenType: 'ERC20',
  //   testnet: true, // ✅ Marked as testnet
  //   swap: false,
  //   isEVM: true,
  //   supportTokens: true,
  //   coinFamily: 7,
  //   slug: 'tics', 
  //   status: true, // ✅ Enable it if needed in app
  // }
];

const currency = {
  name: 'USD',
  symbol: '$',
};

let intervalId; // Declare a variable to store the interval ID
class Background {
  port;

  constructor() {
    this.storeDefaultNetworks();
    function sendMessageToContentScript(message) {
      // console.log('i am called!!');
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        if (tabs.length > 0) {
          // console.log('Tabs::', tabs);
          // message.id = tabs[0].id;
          chrome.tabs.sendMessage(tabs[0].id, message);
        } else {
          //console.log('No active tab found.');
        }
      });
    }
    // chrome.runtime.onConnect.addListener(function (port) {
    //   if (port.name === 'popup') {
    //     port.onDisconnect.addListener(async function () {
    //       console.log('popup disconnected');
    //       await chrome.storage.local.set({ openSidePanel: false });
    //     });
    //   }
    // });

    // chrome.action.onClicked.addListener((tab) => {
    //   chrome.storage.local.get('openSidePanel', (result) => {
    //     const isSidePanelOpen = result.openSidePanel || false;
    //     console.log("🚀 ~ Background ~ chrome.storage.local.get ~ isSidePanelOpen:", isSidePanelOpen)
    //     if (isSidePanelOpen) {
    //       try {
    //         chrome.sidePanel.open({ windowId: tab.windowId });
    //       } catch (err) {
    //         console.error('Failed to open side panel:', err);
    //       }
    //     } else {
    //       chrome.action.setPopup({ popup: 'index.html' });
    //     }
    //   });
    // });

    chrome.runtime.onConnect.addListener(function (externalPort) {
      clearInterval(intervalId);
      externalPort.onDisconnect.addListener(async function () {
        if (intervalId) {
          clearInterval(intervalId); // Clear the existing interval if it exists
          intervalId = null; // Reset intervalId to ensure it's not cleared again
        }
        intervalId = setInterval(async () => {
          await chrome.storage.session.remove(['accounts', 'password']);
        }, 300000);
      });
    });

    chrome.runtime.onConnect.addListener((port) => {
      this.port = port;
    });

    chrome.runtime.onMessage.addListener(
      (message, sender, sendResponse) => {
        if (message.type === 'SWITCH_CHAIN') {
          if (message.payload.chainId) {
            (async () => {
              try {
                const { chains } = await chrome.storage.local.get('chains');

                const updatedChains = chains.map((el) => {
                  if (el.chainId == message.payload.chainId) {
                    el.default = true;
                  } else {
                    el.default = false;
                  }
                  return el;
                });

                await chrome.storage.local.set({
                  chains: updatedChains,
                });

                sendResponse({});
              } catch (err) {
                sendResponse({ error: err.message });
              }
            })();
            return true; // keep channel open for async sendResponse
          }
        }
      }
    );

    chrome.alarms.create('updated_prices', {
      delayInMinutes: 0.1,
      periodInMinutes: 0.2,
    });

    // chrome.alarms.onAlarm.addListener(async (alarms) => {
    //   if (alarms.name === 'updated_prices') {
    //     await this.fetchPricesFromBackend();
    //   }
    // });

    engine.push(
      createAsyncMiddleware(async (req, res, next, end) => {
        // console.log(
        //   '🚀 ~ file: background.js:204 ~ Background ~ createAsyncMiddleware ~ req:',
        //   req
        // );
        if (req.method === 'requestAccounts') {
          try {
            const { accounts } = await chrome.storage.session.get('accounts');
            if (accounts) {
              // console.log('ACCOUNTS',accounts);
              const defaultAccount = accounts.find((el) => el.default === true);
              const account =
                req.network === 'solana'
                  ? defaultAccount.coinFamilyAndAddress[4]
                  : defaultAccount.address;
              res.result = [account];
              res.method = req.method;
              res.network = req.network;

              const { connectedDapps } = await chrome.storage.session.get(
                'connectedDapps'
              );

              const connectedDappsList = Array.isArray(connectedDapps)
                ? connectedDapps
                : [];
              const normalizedDapp = normalizeConnectedDappEntry(req);
              const checkIfAlreadyThere = connectedDappsList.find(
                (el) => el?.url === normalizedDapp.url
              );

              if (!checkIfAlreadyThere) {
                await chrome.storage.session.set({
                  connectedDapps: [
                    ...connectedDappsList,
                    normalizedDapp,
                  ],
                });
              }
            } else {
              // console.log('No Account');
              const response = await new Promise(async (resolve, reject) => {
                const requestData = encodeURIComponent(JSON.stringify(req));
                chrome.windows.create({
                  url: `index.html?method=requestAccounts&data=${requestData}`,
                  type: 'popup',
                  focused: true,
                  width: 439,
                  height: 746,
                });

                const requestAccountsListener = (message) => {
                  if (message.method === 'requestAccounts') {
                    chrome.runtime.onMessage.removeListener(requestAccountsListener);
                    resolve(message.result);
                  }
                };
                chrome.runtime.onMessage.addListener(requestAccountsListener);
              });

              // console.log('RESPONSE ON CONNECT DAPP:',response)

              if (response && response.length > 0) {
                res.result = response;
                res.method = req.method;
                res.network = req.network;
                const { connectedDapps } = await chrome.storage.session.get(
                  'connectedDapps'
                );

                const connectedDappsList = Array.isArray(connectedDapps)
                  ? connectedDapps
                  : [];
                const normalizedDapp = normalizeConnectedDappEntry(req);
                const checkIfAlreadyThere = connectedDappsList.find(
                  (el) => el?.url === normalizedDapp.url
                );

                if (!checkIfAlreadyThere) {
                  await chrome.storage.session.set({
                    connectedDapps: [
                      ...connectedDappsList,
                      normalizedDapp,
                    ],
                  });
                }
              } else {
                res.result = [];
                res.method = req.method;
                res.error = true;
              }
            }
          } catch (err) {
            // console.log('ERRor:::', err);
            res.error = {
              code: err.code || -1,
              message: err.message || 'Unknown error occurred',
              data: err.data,
            };
          }
        } else if (req.method === 'nativeConnect') {
          try {
            await chrome.storage.session.remove(['accounts', 'password']);
            const response = await new Promise(async (resolve, reject) => {
              const requestData = encodeURIComponent(JSON.stringify(req));

              chrome.windows.create({
                url: `index.html?method=nativeConnect&data=${requestData}`,
                type: 'popup',
                focused: true,
                width: 439,
                height: 746,
              });

              const nativeConnectWindowListener = async (windowId) => {
                chrome.windows.onRemoved.removeListener(nativeConnectWindowListener);
                const { isApproved } = await chrome.storage.local.get(
                  'isApproved'
                );
                // console.log('isApproved:::', isApproved);
                if (!isApproved)
                  sendMessageToContentScript({
                    method: 'user_rejected',
                    message: 'Rejected by user',
                    network: 'qubetics',
                    id: req.id,
                  });
                else await chrome.storage.local.set({ isApproved: false });
              };
              chrome.windows.onRemoved.addListener(nativeConnectWindowListener);

              const nativeConnectMsgListener = (message) => {
                if (message.method === 'nativeConnect') {
                  chrome.runtime.onMessage.removeListener(nativeConnectMsgListener);
                  chrome.windows.onRemoved.removeListener(nativeConnectWindowListener);
                  resolve(message.result);
                }
              };
              chrome.runtime.onMessage.addListener(nativeConnectMsgListener);
            });

            if (response) {
              res.result = response;
              res.method = req.method;
              res.network = req.network;
              const { connectedDapps } = await chrome.storage.session.get(
                'connectedDapps'
              );

              const connectedDappsList = Array.isArray(connectedDapps)
                ? connectedDapps
                : [];
              const normalizedDapp = normalizeConnectedDappEntry(req);
              const checkIfAlreadyThere = connectedDappsList.find(
                (el) => el?.url === normalizedDapp.url
              );

              if (!checkIfAlreadyThere) {
                await chrome.storage.session.set({
                  connectedDapps: [
                    ...connectedDappsList,
                    normalizedDapp,
                  ],
                });
              }
            } else {
              res.result = [];
              res.method = req.method;
              res.error = true;
            }
            // }
          } catch (err) {
            // console.log('ERRor:::', err);
            res.error = {
              code: err.code || -1,
              message: err.message || 'Unknown error occurred',
              data: err.data,
            };
          }
        } else if (req.method === 'signTransaction') {
          const response = await new Promise((resolve, reject) => {
            const requestData = encodeURIComponent(JSON.stringify(req.object));

            chrome.windows.create({
              url: `index.html?method=signTransaction&data=${requestData}`,
              type: 'popup',
              focused: true,
              width: 439,
              height: 746,
            });

            const signTxListener = (message) => {
              if (message.method === 'signTransaction') {
                chrome.runtime.onMessage.removeListener(signTxListener);
                resolve(message.result);
              }
            };
            chrome.runtime.onMessage.addListener(signTxListener);
          });

          if (response) {
            res.result = response;
            res.method = req.method;
          } else {
            res.result = null;
            res.method = req.method;
            res.error = true;
          }
        } else if (req.method === 'signTypedMessage') {
          const response = await new Promise((resolve, reject) => {
            const requestData = encodeURIComponent(JSON.stringify(req.object));

            chrome.windows.create({
              url: `index.html?method=signTypedMessage&data=${requestData}`,
              type: 'popup',
              focused: true,
              width: 439,
              height: 746,
            });

            const signTypedMsgListener = (message) => {
              if (message.method === 'signTypedMessage') {
                chrome.runtime.onMessage.removeListener(signTypedMsgListener);
                resolve(message.result);
              }
            };
            chrome.runtime.onMessage.addListener(signTypedMsgListener);
          });

          if (response) {
            res.result = response;
            res.method = req.method;
          } else {
            res.result = null;
            res.method = req.method;
            res.error = true;
          }
        } else if (req.method === 'signRawTransaction') {
          const response = await new Promise((resolve, reject) => {
            const requestData = encodeURIComponent(JSON.stringify(req));

            chrome.windows.create({
              url: `index.html?method=signRawTransaction&data=${requestData}`,
              type: 'popup',
              focused: true,
              width: 439,
              height: 746,
            });

            const signRawTxListener = (message) => {
              if (message.method === 'signRawTransaction') {
                chrome.runtime.onMessage.removeListener(signRawTxListener);
                resolve(message.result);
              }
            };
            chrome.runtime.onMessage.addListener(signRawTxListener);
          });

          if (response) {
            res.result = response;
            res.method = req.method;
            res.network = req.network;
          } else {
            res.result = null;
            res.method = req.method;
            res.error = true;
          }
        } else if (req.method === 'switchEthereumChain') {
          const response = await new Promise((resolve, reject) => {
            const requestData = encodeURIComponent(JSON.stringify(req.object));

            chrome.windows.create({
              url: `index.html?method=switchEthereumChain&data=${requestData}`,
              type: 'popup',
              focused: true,
              width: 439,
              height: 746,
            });

            const switchChainListener = (message) => {
              if (message.method === 'switchEthereumChain') {
                chrome.runtime.onMessage.removeListener(switchChainListener);
                resolve(message.result);
              }
            };
            chrome.runtime.onMessage.addListener(switchChainListener);
          });

          if (response) {
            const { chains } = await chrome.storage.local.get('chains');
            const { accounts } = await chrome.storage.session.get('accounts');
            const defaultChain = chains.find((el) => el.default);
            const defaultAccount = accounts.find((el) => el.default);

            // console.log("XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX", defaultChain);

            res.result = null;
            res.method = req.method;
            // res.chainId = defaultChain.chainId;
            res.chainId = parseInt(defaultChain.chainId)
              .toString(16)
              .toUpperCase();
            res.rpcUrl = defaultChain.rpcUrl;
            res.address = defaultAccount.address;
          } else {
            res.result = null;
            res.method = req.method;
            res.chainId = null;
            res.rpcUrl = null;
            res.address = null;
            res.error = true;
          }
        } else if (req.method === 'createValidator') {
          await chrome.storage.session.remove(['accounts']);
          const response = await new Promise((resolve, reject) => {
            const requestData = encodeURIComponent(JSON.stringify(req));

            chrome.windows.create({
              url: `index.html?method=createValidator&data=${requestData}`,
              type: 'popup',
              focused: true,
              width: 439,
              height: 746,
            });

            const createValidatorWindowListener = async (windowId) => {
              chrome.windows.onRemoved.removeListener(createValidatorWindowListener);
              const { isApproved } = await chrome.storage.local.get(
                'isApproved'
              );
              // console.log('isApproved:::', isApproved);
              if (!isApproved)
                sendMessageToContentScript({
                  method: 'user_rejected',
                  message: 'Rejected by user',
                  network: 'qubetics',
                  id: req.id,
                });
              else await chrome.storage.local.set({ isApproved: false });
            };
            chrome.windows.onRemoved.addListener(createValidatorWindowListener);

            const createValidatorMsgListener = (message) => {
              if (message.method === 'createValidator') {
                chrome.runtime.onMessage.removeListener(createValidatorMsgListener);
                chrome.windows.onRemoved.removeListener(createValidatorWindowListener);
                resolve(message.result);
              }
            };
            chrome.runtime.onMessage.addListener(createValidatorMsgListener);
          });

          if (response) {
            res.result = response;
            res.method = req.method;
            res.network = req.network;
          } else {
            res.result = null;
            res.method = req.method;
            res.error = true;
          }
        } else if (req.method === 'editValidator') {
          const response = await new Promise((resolve, reject) => {
            const requestData = encodeURIComponent(JSON.stringify(req));

            chrome.windows.create({
              url: `index.html?method=editValidator&data=${requestData}`,
              type: 'popup',
              focused: true,
              width: 439,
              height: 746,
            });

            const editValidatorWindowListener = async (windowId) => {
              chrome.windows.onRemoved.removeListener(editValidatorWindowListener);
              const { isApproved } = await chrome.storage.local.get(
                'isApproved'
              );
              // console.log('isApproved:::', isApproved);
              if (!isApproved)
                sendMessageToContentScript({
                  method: 'user_rejected',
                  message: 'Rejected by user',
                  network: 'qubetics',
                  id: req.id,
                });
              else await chrome.storage.local.set({ isApproved: false });
            };
            chrome.windows.onRemoved.addListener(editValidatorWindowListener);

            const editValidatorMsgListener = (message) => {
              if (message.method === 'editValidator') {
                chrome.runtime.onMessage.removeListener(editValidatorMsgListener);
                chrome.windows.onRemoved.removeListener(editValidatorWindowListener);
                resolve(message.result);
              }
            };
            chrome.runtime.onMessage.addListener(editValidatorMsgListener);
          });
          // console.log('RESPONSE BACK::', response);

          if (response) {
            res.result = response;
            res.method = req.method;
            res.network = req.network;
          } else {
            res.result = null;
            res.method = req.method;
            res.error = true;
          }
        } else if (req.method === 'bondMoreFunds') {
          await chrome.storage.session.remove(['accounts']);
          const response = await new Promise((resolve, reject) => {
            const requestData = encodeURIComponent(JSON.stringify(req));

            chrome.windows.create({
              url: `index.html?method=bondMoreFunds&data=${requestData}`,
              type: 'popup',
              focused: true,
              width: 439,
              height: 746,
            });

            const bondMoreWindowListener = async (windowId) => {
              chrome.windows.onRemoved.removeListener(bondMoreWindowListener);
              const { isApproved } = await chrome.storage.local.get(
                'isApproved'
              );
              // console.log('isApproved:::', isApproved);
              if (!isApproved)
                sendMessageToContentScript({
                  method: 'user_rejected',
                  message: 'Rejected by user',
                  network: 'qubetics',
                  id: req.id,
                });
              else await chrome.storage.local.set({ isApproved: false });
            };
            chrome.windows.onRemoved.addListener(bondMoreWindowListener);

            const bondMoreMsgListener = (message) => {
              if (message.method === 'bondMoreFunds') {
                chrome.runtime.onMessage.removeListener(bondMoreMsgListener);
                chrome.windows.onRemoved.removeListener(bondMoreWindowListener);
                resolve(message.result);
              }
            };
            chrome.runtime.onMessage.addListener(bondMoreMsgListener);
          });

          if (response) {
            res.result = response;
            res.method = req.method;
            res.network = req.network;
          } else {
            res.result = null;
            res.method = req.method;
            res.error = true;
          }
        } else if (req.method === 'delegatorBondMoreFunds') {
          await chrome.storage.session.remove(['accounts']);
          const response = await new Promise((resolve, reject) => {
            const requestData = encodeURIComponent(JSON.stringify(req));

            chrome.windows.create({
              url: `index.html?method=delegatorBondMoreFunds&data=${requestData}`,
              type: 'popup',
              focused: true,
              width: 439,
              height: 746,
            });

            const delegatorBondWindowListener = async (windowId) => {
              chrome.windows.onRemoved.removeListener(delegatorBondWindowListener);
              const { isApproved } = await chrome.storage.local.get(
                'isApproved'
              );
              // console.log('isApproved:::', isApproved);
              if (!isApproved)
                sendMessageToContentScript({
                  method: 'user_rejected',
                  message: 'Rejected by user',
                  network: 'qubetics',
                  id: req.id,
                });
              else await chrome.storage.local.set({ isApproved: false });
            };
            chrome.windows.onRemoved.addListener(delegatorBondWindowListener);

            const delegatorBondMsgListener = (message) => {
              if (message.method === 'delegatorBondMoreFunds') {
                chrome.runtime.onMessage.removeListener(delegatorBondMsgListener);
                chrome.windows.onRemoved.removeListener(delegatorBondWindowListener);
                resolve(message.result);
              }
            };
            chrome.runtime.onMessage.addListener(delegatorBondMsgListener);
          });

          if (response) {
            res.result = response;
            res.method = req.method;
            res.network = req.network;
          } else {
            res.result = null;
            res.method = req.method;
            res.error = true;
          }
        } else if (req.method === 'redelegate') {
          await chrome.storage.session.remove(['accounts']);
          const response = await new Promise((resolve, reject) => {
            const requestData = encodeURIComponent(JSON.stringify(req));

            chrome.windows.create({
              url: `index.html?method=redelegate&data=${requestData}`,
              type: 'popup',
              focused: true,
              width: 439,
              height: 746,
            });

            const redelegateWindowListener = async (windowId) => {
              chrome.windows.onRemoved.removeListener(redelegateWindowListener);
              const { isApproved } = await chrome.storage.local.get(
                'isApproved'
              );
              // console.log('isApproved:::', isApproved);
              if (!isApproved)
                sendMessageToContentScript({
                  method: 'user_rejected',
                  message: 'Rejected by user',
                  network: 'qubetics',
                  id: req.id,
                });
              else await chrome.storage.local.set({ isApproved: false });
            };
            chrome.windows.onRemoved.addListener(redelegateWindowListener);

            const redelegateMsgListener = (message) => {
              if (message.method === 'redelegate') {
                chrome.runtime.onMessage.removeListener(redelegateMsgListener);
                chrome.windows.onRemoved.removeListener(redelegateWindowListener);
                resolve(message.result);
              }
            };
            chrome.runtime.onMessage.addListener(redelegateMsgListener);
          });

          if (response) {
            res.result = response;
            res.method = req.method;
            res.network = req.network;
          } else {
            res.result = null;
            res.method = req.method;
            res.error = true;
          }
        } else if (req.method === 'unBondFunds') {
          await chrome.storage.session.remove(['accounts']);
          const response = await new Promise((resolve, reject) => {
            const requestData = encodeURIComponent(JSON.stringify(req));

            chrome.windows.create({
              url: `index.html?method=unBondFunds&data=${requestData}`,
              type: 'popup',
              focused: true,
              width: 439,
              height: 746,
            });

            const unbondWindowListener = async (windowId) => {
              chrome.windows.onRemoved.removeListener(unbondWindowListener);
              const { isApproved } = await chrome.storage.local.get(
                'isApproved'
              );
              // console.log('isApproved:::', isApproved);
              if (!isApproved)
                sendMessageToContentScript({
                  method: 'user_rejected',
                  message: 'Rejected by user',
                  network: 'qubetics',
                  id: req.id,
                });
              else await chrome.storage.local.set({ isApproved: false });
            };
            chrome.windows.onRemoved.addListener(unbondWindowListener);

            const unbondMsgListener = (message) => {
              if (message.method === 'unBondFunds') {
                chrome.runtime.onMessage.removeListener(unbondMsgListener);
                chrome.windows.onRemoved.removeListener(unbondWindowListener);
                resolve(message.result);
              }
            };
            chrome.runtime.onMessage.addListener(unbondMsgListener);
          });

          if (response) {
            res.result = response;
            res.method = req.method;
            res.network = req.network;
          } else {
            res.result = null;
            res.method = req.method;
            res.error = true;
          }
        } else if (req.method === 'stopValidator') {
          await chrome.storage.session.remove(['accounts']);
          const response = await new Promise((resolve, reject) => {
            const requestData = encodeURIComponent(JSON.stringify(req));

            chrome.windows.create({
              url: `index.html?method=stopValidator&data=${requestData}`,
              type: 'popup',
              focused: true,
              width: 439,
              height: 746,
            });

            const stopValidatorWindowListener = async (windowId) => {
              chrome.windows.onRemoved.removeListener(stopValidatorWindowListener);
              const { isApproved } = await chrome.storage.local.get(
                'isApproved'
              );
              // console.log('isApproved:::', isApproved);
              if (!isApproved)
                sendMessageToContentScript({
                  method: 'user_rejected',
                  message: 'Rejected by user',
                  network: 'qubetics',
                  id: req.id,
                });
              else await chrome.storage.local.set({ isApproved: false });
            };
            chrome.windows.onRemoved.addListener(stopValidatorWindowListener);

            const stopValidatorMsgListener = (message) => {
              if (message.method === 'stopValidator') {
                chrome.runtime.onMessage.removeListener(stopValidatorMsgListener);
                chrome.windows.onRemoved.removeListener(stopValidatorWindowListener);
                resolve(message.result);
              }
            };
            chrome.runtime.onMessage.addListener(stopValidatorMsgListener);
          });

          if (response) {
            res.result = response;
            res.method = req.method;
            res.network = req.network;
          } else {
            res.result = null;
            res.method = req.method;
            res.error = true;
          }
        } else if (req.method === 'unJailValidator') {
          await chrome.storage.session.remove(['accounts']);
          const response = await new Promise((resolve, reject) => {
            const requestData = encodeURIComponent(JSON.stringify(req));

            chrome.windows.create({
              url: `index.html?method=unJailValidator&data=${requestData}`,
              type: 'popup',
              focused: true,
              width: 439,
              height: 746,
            });

            const unjailWindowListener = async (windowId) => {
              chrome.windows.onRemoved.removeListener(unjailWindowListener);
              const { isApproved } = await chrome.storage.local.get(
                'isApproved'
              );
              // console.log('isApproved:::', isApproved);
              if (!isApproved)
                sendMessageToContentScript({
                  method: 'user_rejected',
                  message: 'Rejected by user',
                  network: 'qubetics',
                  id: req.id,
                });
              else await chrome.storage.local.set({ isApproved: false });
            };
            chrome.windows.onRemoved.addListener(unjailWindowListener);

            const unjailMsgListener = (message) => {
              if (message.method === 'unJailValidator') {
                chrome.runtime.onMessage.removeListener(unjailMsgListener);
                chrome.windows.onRemoved.removeListener(unjailWindowListener);
                resolve(message.result);
              }
            };
            chrome.runtime.onMessage.addListener(unjailMsgListener);
          });

          if (response) {
            res.result = response;
            res.method = req.method;
            res.network = req.network;
          } else {
            res.result = null;
            res.method = req.method;
            res.error = true;
          }
        } else if (req.method === 'disconnect') {
          const response = await new Promise(async (resolve, reject) => {
            await chrome.storage.session.remove(['accounts', 'password']);
            await chrome.storage.local.set({
              isApproved: null,
            });
            resolve(true);
          });

          if (response) {
            res.result = response;
            res.method = req.method;
            res.network = req.network;
          } else {
            res.result = null;
            res.method = req.method;
            res.error = true;
          }
        } else {
          await next();
        }
      })
    );

    this.injectEthereumProvider();
    this.handleAllEthereumEvents();
  }

  injectEthereumProvider = async () => {
    await chrome.scripting.registerContentScripts([
      {
        id: 'qubetics-contentscript',
        matches: ['file://*/*', 'http://*/*', 'https://*/*'],
        js: ['inpage-bundle.js'],
        runAt: 'document_start',
        world: 'MAIN',
        allFrames: true,
      },
    ]);
  };

  handleAllEthereumEvents = async () => {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      // console.log('MESSG::', message, 'SENDER::', sender);

      if (message.method === 'switchAccount') {
        // Process the request and prepare the data to send to content script
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs.length) {
            const id = tabs[0].id;
            chrome.tabs.sendMessage(id, message);
          }
        });
      }
      if (sender.tab) {
        if (message.type === 'JSON-RPC') {
          const payloadWithSenderMeta = enrichRpcPayloadWithSender(
            message.payload,
            sender
          );
          engine.handle(payloadWithSenderMeta, (err, result) => {
            // console.log(err, result, "result");
            if (err) {
              //console.error('Error handling JSON-RPC message:', err);
            } else {
              sendResponse({ type: 'JSON-RPC', payload: result });
            }
          });

          return true;
        }
      } else if (message.type === 'OPEN_SIDE_PANEL') {
        chrome.sidePanel
          .setPanelBehavior({ openPanelOnActionClick: true })
          .catch((error) => {
            //console.error(error)
          });
      } else if (message.type === 'CLOSE_SIDE_PANEL') {
        chrome.sidePanel
          .setPanelBehavior({ openPanelOnActionClick: false })
          .catch((error) => {
            //console.error(error)
          });
      }
    });
  };

  storeDefaultNetworks = () => {
    chrome.runtime.onInstalled.addListener(function () {
      chrome.storage.local.set(
        {
          chains: networks,
          currency,
          alerts: [],
          deviceId: uuidv4(),
          autoLock: true,
        },
        () => { }
      );
    });
  };

  // fetchPricesFromBackend = async () => {
  //   // console.log("UPDATING ALERTS");
  //   const { alerts } = await chrome.storage.local.get('alerts');
  //   const { accounts } = await chrome.storage.session.get('accounts');

  //   if (accounts) {
  //     const defaultAccount = accounts.find((account) => account.default);

  //     const filteredAlerts = alerts.filter(
  //       (alert) => alert.accountId == defaultAccount.id && !alert.sent
  //     );

  //     const randomString = randomBytes(20).toString('hex');

  //     const publicKey = `-----BEGIN PUBLIC KEY-----
  //     MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA2wzqlCphAcUFgYRe9zkL
  //     zTlRlgFdg2Xjvcpd0DHV1AbccXPer26UiKxJOf0oP9MYqndYATHvEK+KhP565uBP
  //     9ea+IhE7Su7xmI+yhyf3bAY9Ok6OcnkXSg2v9fxBnkWkSCxmMirW5EYFR47U/C0/
  //     qtx/4/0YykFBlZ215HsgUoH7ACmzvjwQBGYw8u6EJ6E8fW0KYboTbi4NmmfulXQD
  //     CAiSITsiCU913cxOFRm8m/uBlNyCPOommYyAA4fX0F3CdfCIDKJA3jK5LwKaS8PT
  //     MMvOHMoMeAoXAQi0Vw3uT1j8BFB7F4uZpUdbD0x9kmT/o4PhIVvYnv8LNSdoQ/rA
  //     HQIDAQAB
  //     -----END PUBLIC KEY-----`;

  //     async function encryptAndSignMessage(message) {
  //       const second = new NodeRSA(publicKey);
  //       second.setOptions({ encryptionScheme: 'pkcs1' });
  //       const enc = second.encrypt(message, 'base64');
  //       const encryptedData = {
  //         data: enc,
  //       };
  //       return encryptedData;
  //     }

  //     for await (let alert of filteredAlerts) {
  //       const encryptedData = await encryptAndSignMessage(
  //         JSON.stringify({
  //           id: alert.coinId,
  //           fiat_currency: alert.currencyName.toUpperCase(),
  //         })
  //       );
  //       await fetch(
  //         'https://REDACTED/dev/api/v1/wallet/perticular_token_data',
  //         {
  //           method: 'post',
  //           body: JSON.stringify(encryptedData),
  //           headers: {
  //             Authorization: defaultAccount.jwtToken,
  //             device_id: defaultAccount.deviceId,
  //             'Content-Type': 'application/json',
  //             'aw-api-auth': randomString,
  //           },
  //         }
  //       ).then(async (response) => {
  //         const data = await response.json();
  //         const priceInformation = data.data;

  //         switch (alert.type) {
  //           case 'above':
  //             if (
  //               parseFloat(alert.price) <
  //               parseFloat(priceInformation.coins_market.current_price)
  //             ) {
  //               chrome.notifications.create('PRICE_ALERT_ABOVE', {
  //                 type: 'basic',
  //                 iconUrl: './logo512.png',
  //                 title: 'Qubetics Wallet',
  //                 message: `The price of ${alert.selectedToken.coin_symbol} went above ${alert.currencySymbol}${alert.price}`,
  //                 priority: 2,
  //               });

  //               let updatedAls = await alerts.map((el) => {
  //                 if (alert.id === el.id) {
  //                   el.sent = true;
  //                   return el;
  //                 } else {
  //                   return el;
  //                 }
  //               });

  //               await chrome.storage.local.set({
  //                 alerts: updatedAls,
  //               });
  //               this.port.postMessage('ALERTS_UPDATED');
  //             }
  //             break;
  //           case 'below':
  //             if (
  //               parseFloat(alert.price) >
  //               parseFloat(priceInformation.coins_market.current_price)
  //             ) {
  //               chrome.notifications.create('PRICE_ALERT_BELOW', {
  //                 type: 'basic',
  //                 iconUrl: './logo512.png',
  //                 title: 'Qubetics Wallet',
  //                 message: `The price of ${alert.selectedToken.coin_symbol} went below ${alert.currencySymbol}${alert.price}`,
  //                 priority: 2,
  //               });

  //               let updatedAls = await alerts.map((el) => {
  //                 if (alert.id === el.id) {
  //                   el.sent = true;
  //                   return el;
  //                 } else {
  //                   return el;
  //                 }
  //               });

  //               await chrome.storage.local.set({
  //                 alerts: updatedAls,
  //               });
  //               this.port.postMessage('ALERTS_UPDATED');
  //             }
  //             break;
  //           default:
  //             break;
  //         }
  //       });
  //     }
  //   }
  // };
}

new Background();
