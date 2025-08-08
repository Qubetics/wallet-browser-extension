/*global chrome*/
// import { randomBytes } from 'crypto-browserify';
import { v4 as uuidv4 } from 'uuid';
const {
  JsonRpcEngine,
  createAsyncMiddleware,
} = require('@metamask/json-rpc-engine');
const engine = new JsonRpcEngine();
// const NodeRSA = require('node-rsa');

const networks = [
  {
    id: uuidv4(),
    chainName: 'Ethereum',
    chainId: '1',
    currencyName: 'ETH',
    currencySymbol: 'ETH',
    currencyDecimals: 18,
    rpcUrl: 'https://mainnet.infura.io/v3/REDACTED',
    rpcApiKey: null,
    blockUrl: 'https://etherscan.io',
    default: true,
    image: 'https://REDACTED/eth.png',
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
    rpcUrl:
      'https://bsc.fastnode.cc/FNoItXAqEKsNFDjbsHetTyFjSMrwFGykPKOjQKzlocPGvuqOYkjhxkfFsIXRWtnI/',
    rpcApiKey: null,
    blockUrl: 'https://bscscan.com',
    default: false,
    // image:
    //   'https://REDACTED/images/bnb.png',
    image: 'https://REDACTED/bnb.png',
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
  //   rpcUrl: 'https://api.avax.network/ext/bc/C/rpc',
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
    rpcUrl: 'https://polygon-rpc.com/',
    rpcApiKey: null,
    blockUrl: 'https://polygonscan.com',
    default: false,
    image: 'https://REDACTED/matic.png',
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
  //   rpcUrl: 'https://evm.cronos.org',
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
    rpcUrl:
      // 'https://sol.fastnode.cc/FNoItXAqEKsNFDjbsHetTyFjSMrwFGykPKOjQKzlocPGvuqOYkjhxkfFsIXRWtnI/',
      'https://mainnet.helius-rpc.com/?api-key=REDACTED',
    rpcApiKey: null,
    blockUrl: 'https://solscan.io/',
    default: false,
    image: 'https://REDACTED/sol.png',
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
    rpcUrl:
      'https://btc.nodes.fastnode.io/mainnet/fn-dedic-4479-ad5f-3e2787e055ca/blockbook/api/',
    rpcApiKey: 'REDACTED',
    blockUrl: 'https://www.blockchain.com/explorer/transactions/',
    default: false,
    image: 'https://REDACTED/btc.png',
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
  //   rpcUrl: 'https://bitcoin-testnet.drpc.org', // 🔁 Use a valid testnet RPC
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
  //   rpcApiKey: 'REDACTED',
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
    currencyDecimals: 18,
    rpcUrl: 'https://rpc.qubetics.com',
    rpcApiKey: null,
    blockUrl: 'https://ticsscan.com',
    default: false,
    image: 'https://stage-qubetics-wallet.obs.ap-southeast-4.myhuaweicloud.com/tics.png',
    tokenType: 'ERC20',
    testnet: false,
    swap: false,
    isEVM: true,
    supportTokens: true,
    coinFamily: 7,
    slug: 'tics',
    status: true,
  },
  {
    id: uuidv4(),
    chainName: 'Qubetics Testnet',
    chainId: 9029, // ✅ Updated Chain ID
    currencyName: 'qubetics Testnet',
    currencySymbol: 'TICS',
    currencyDecimals: 18, // ✅ Same as mainnet
    rpcUrl: 'https://rpc-testnet.qubetics.work/', // ✅ Updated testnet RPC
    rpcApiKey: null, // ✅ No change
    blockUrl: 'https://testnet.qubetics.work/tx/', // ✅ Updated explorer
    default: false,
    image: 'https://stage-qubetics-wallet.obs.ap-southeast-4.myhuaweicloud.com/tics.png', // ✅ Same image is fine
    tokenType: 'ERC20',
    testnet: true, // ✅ Marked as testnet
    swap: false,
    isEVM: true,
    supportTokens: true,
    coinFamily: 7,
    slug: 'tics', 
    status: true, // ✅ Enable it if needed in app
  }
  
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
          console.log('No active tab found.');
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
      async (message, sender, sendResponse) => {
        if (message.type === 'SWITCH_CHAIN') {
          if (message.payload.chainId) {
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
        console.log(
          '🚀 ~ file: background.js:204 ~ Background ~ createAsyncMiddleware ~ req:',
          req
        );
        console.log('🚀 ~ Background ~ createAsyncMiddleware ~ req.method:', req.method);
        if (req.method === 'requestAccounts') {
          console.log('🚀 ~ Background ~ requestAccounts ~ req:', req);
          try {
            const { accounts } = await chrome.storage.session.get('accounts');
            console.log('🚀 ~ Background ~ requestAccounts ~ accounts:', accounts);
            if (accounts) {
              console.log('ACCOUNTS',accounts);
              const defaultAccount = accounts.find((el) => el.default === true);
              console.log('🚀 ~ Background ~ requestAccounts ~ defaultAccount:', defaultAccount);
              const account =
                req.network === 'solana'
                  ? defaultAccount.coinFamilyAndAddress[4]
                  : defaultAccount.address;
              console.log('🚀 ~ Background ~ requestAccounts ~ account:', account);
              res.result = [account];
              res.method = req.method;
              res.network = req.network;

              const { connectedDapps } = await chrome.storage.session.get(
                'connectedDapps'
              );

              const checkIfAlreadyThere = (connectedDapps || []).find(
                (el) => el.url === req.url
              );

              if (!checkIfAlreadyThere) {
                await chrome.storage.session.set({
                  connectedDapps: [
                    ...(connectedDapps || []),
                    {
                      url: req.url,
                      image: req.image,
                      title: req.title,
                      time: new Date(),
                    },
                  ],
                });
              }
            } else {
              console.log('No Account');
              const response = await new Promise(async (resolve, reject) => {
                const requestData = encodeURIComponent(JSON.stringify(req));
                chrome.windows.create({
                  url: `index.html?method=requestAccounts&data=${requestData}`,
                  type: 'popup',
                  focused: true,
                  width: 439,
                  height: 746,
                });

                // Add timeout to prevent hanging
                const timeout = setTimeout(() => {
                  resolve(null);
                }, 30000); // 30 second timeout

                chrome.runtime.onMessage.addListener(
                  (message, sender, sendResponse) => {
                    if (message.method === 'requestAccounts') {
                      clearTimeout(timeout);
                      resolve(message.result);
                    }
                  }
                );

                // Handle window close without response
                chrome.windows.onRemoved.addListener(async () => {
                  const { isApproved } = await chrome.storage.local.get('isApproved');
                  if (!isApproved) {
                    clearTimeout(timeout);
                    resolve(null);
                  } else {
                    await chrome.storage.local.set({ isApproved: false });
                  }
                });
              });

              console.log('RESPONSE ON CONNECT DAPP:',response)

              if (response && response.length > 0 ) {
                res.result = response;
                res.method = req.method;
                res.network = req.network;
                const { connectedDapps } = await chrome.storage.session.get(
                  'connectedDapps'
                );

                const checkIfAlreadyThere = (connectedDapps || []).find(
                  (el) => el.url === req.url
                );

                if (!checkIfAlreadyThere) {
                  await chrome.storage.session.set({
                    connectedDapps: [
                      ...(connectedDapps || []),
                      {
                        url: req.url,
                        image: req.image,
                        title: req.title,
                        time: new Date(),
                      },
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
            console.log('ERRor:::', err);
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

              // Add timeout to prevent hanging
              const timeout = setTimeout(() => {
                resolve(null);
              }, 30000); // 30 second timeout

              chrome.windows.onRemoved.addListener(async () => {
                const { isApproved } = await chrome.storage.local.get(
                  'isApproved'
                );
                // console.log('isApproved:::', isApproved);
                if (!isApproved) {
                  clearTimeout(timeout);
                  sendMessageToContentScript({
                    method: 'user_rejected',
                    message: 'Rejected by user',
                    network: 'qubetics',
                    id: req.id,
                  });
                  resolve(null);
                } else {
                  await chrome.storage.local.set({ isApproved: false });
                }
              });

              chrome.runtime.onMessage.addListener(
                (message, sender, sendResponse) => {
                  if (message.method === 'nativeConnect') {
                    clearTimeout(timeout);
                    resolve(message.result);
                    // chrome.windows.onRemoved.removeListener(function(){});
                  }
                }
              );
            });

            if (response) {
              res.result = response;
              res.method = req.method;
              res.network = req.network;
              const { connectedDapps } = await chrome.storage.session.get(
                'connectedDapps'
              );

              const checkIfAlreadyThere = (connectedDapps || []).find(
                (el) => el.url === req.url
              );

              if (!checkIfAlreadyThere) {
                await chrome.storage.session.set({
                  connectedDapps: [
                    ...(connectedDapps || []),
                    {
                      url: req.url,
                      image: req.image,
                      title: req.title,
                      time: new Date(),
                    },
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
            console.log('ERRor:::', err);
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

            // Add timeout to prevent hanging
            const timeout = setTimeout(() => {
              resolve(null);
            }, 30000); // 30 second timeout

            chrome.runtime.onMessage.addListener(
              (message, sender, sendResponse) => {
                if (message.method === 'signTransaction') {
                  clearTimeout(timeout);
                  resolve(message.result);
                }
              }
            );

            // Handle window close without response
            chrome.windows.onRemoved.addListener(async () => {
              const { isApproved } = await chrome.storage.local.get('isApproved');
              if (!isApproved) {
                clearTimeout(timeout);
                resolve(null);
              } else {
                await chrome.storage.local.set({ isApproved: false });
              }
            });
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

            // Add timeout to prevent hanging
            const timeout = setTimeout(() => {
              resolve(null);
            }, 30000); // 30 second timeout

            chrome.runtime.onMessage.addListener(
              (message, sender, sendResponse) => {
                if (message.method === 'signTypedMessage') {
                  clearTimeout(timeout);
                  resolve(message.result);
                }
              }
            );

            // Handle window close without response
            chrome.windows.onRemoved.addListener(async () => {
              const { isApproved } = await chrome.storage.local.get('isApproved');
              if (!isApproved) {
                clearTimeout(timeout);
                resolve(null);
              } else {
                await chrome.storage.local.set({ isApproved: false });
              }
            });
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

            // Add timeout to prevent hanging
            const timeout = setTimeout(() => {
              resolve(null);
            }, 30000); // 30 second timeout

            chrome.runtime.onMessage.addListener(
              (message, sender, sendResponse) => {
                if (message.method === 'signRawTransaction') {
                  clearTimeout(timeout);
                  resolve(message.result);
                }
              }
            );

            // Handle window close without response
            chrome.windows.onRemoved.addListener(async () => {
              const { isApproved } = await chrome.storage.local.get('isApproved');
              if (!isApproved) {
                clearTimeout(timeout);
                resolve(null);
              } else {
                await chrome.storage.local.set({ isApproved: false });
              }
            });
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
        } else if (req.method === 'signPersonalMessage' || req.method === 'personal_sign' || req.method === 'eth_sign') {
          console.log('🚀 ~ Background ~ signPersonalMessage ~ req:', req);
          const response = await new Promise((resolve, reject) => {
            const requestData = encodeURIComponent(JSON.stringify(req.object || req));

            chrome.windows.create({
              url: `index.html?method=signPersonalMessage&data=${requestData}`,
              type: 'popup',
              focused: true,
              width: 439,
              height: 746,
            });

            // Add timeout to prevent hanging
            const timeout = setTimeout(() => {
              console.log('🚀 ~ Background ~ signPersonalMessage ~ timeout reached');
              resolve(null);
            }, 30000); // 30 second timeout

            chrome.runtime.onMessage.addListener(
              (message, sender, sendResponse) => {
                console.log('🚀 ~ Background ~ signPersonalMessage ~ message:', message);
                if (message.method === 'signPersonalMessage') {
                  clearTimeout(timeout);
                  resolve(message.result);
                }
              }
            );

            // Handle window close without response
            chrome.windows.onRemoved.addListener(async () => {
              const { isApproved } = await chrome.storage.local.get('isApproved');
              if (!isApproved) {
                clearTimeout(timeout);
                resolve(null);
              } else {
                await chrome.storage.local.set({ isApproved: false });
              }
            });
          });

          console.log('🚀 ~ Background ~ signPersonalMessage ~ response:', response);
          if (response) {
            res.result = response;
            res.method = req.method;
            res.network = req.network;
          } else {
            res.error = {
              code: 4001, // User rejected the request
              message: 'User rejected the request'
            };
            res.method = req.method;
          }
        } else if (req.method === 'switchEthereumChain') {
          console.log('🚀 ~ Background ~ switchEthereumChain ~ req:', req);
          const response = await new Promise((resolve, reject) => {
            const requestData = encodeURIComponent(JSON.stringify(req.object));

            chrome.windows.create({
              url: `index.html?method=switchEthereumChain&data=${requestData}`,
              type: 'popup',
              focused: true,
              width: 439,
              height: 746,
            });

            // Add timeout to prevent hanging
            const timeout = setTimeout(() => {
              console.log('🚀 ~ Background ~ switchEthereumChain ~ timeout reached');
              resolve(null);
            }, 30000); // 30 second timeout

            chrome.runtime.onMessage.addListener(
              (message, sender, sendResponse) => {
                console.log('🚀 ~ Background ~ switchEthereumChain ~ message:', message);
                if (message.method === 'switchEthereumChain') {
                  clearTimeout(timeout);
                  resolve(message.result);
                }
              }
            );

            // Handle window close without response
            chrome.windows.onRemoved.addListener(async () => {
              const { isApproved } = await chrome.storage.local.get('isApproved');
              if (!isApproved) {
                clearTimeout(timeout);
                resolve(null);
              } else {
                await chrome.storage.local.set({ isApproved: false });
              }
            });
          });

          console.log('🚀 ~ Background ~ switchEthereumChain ~ response:', response);
          if (response) {
            // switchEthereumChain should return null on success according to EIP-3326
            res.result = null;
            res.method = req.method;
            res.network = req.network;
          } else {
            // If user rejected, return an error
            res.error = {
              code: 4902, // User rejected the request
              message: 'User rejected the request'
            };
            res.method = req.method;
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

            chrome.windows.onRemoved.addListener(async () => {
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
            });

            chrome.runtime.onMessage.addListener(
              (message, sender, sendResponse) => {
                if (message.method === 'createValidator') {
                  resolve(message.result);
                }
              }
            );
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

            chrome.windows.onRemoved.addListener(async () => {
              const { isApproved } = await chrome.storage.local.get(
                'isApproved'
              );
              console.log('isApproved:::', isApproved);
              if (!isApproved)
                sendMessageToContentScript({
                  method: 'user_rejected',
                  message: 'Rejected by user',
                  network: 'qubetics',
                  id: req.id,
                });
              else await chrome.storage.local.set({ isApproved: false });
            });

            chrome.runtime.onMessage.addListener(
              (message, sender, sendResponse) => {
                if (message.method === 'editValidator') {
                  resolve(message.result);
                }
              }
            );
          });
          console.log('RESPONSE BACK::', response);

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

            chrome.windows.onRemoved.addListener(async () => {
              const { isApproved } = await chrome.storage.local.get(
                'isApproved'
              );
              console.log('isApproved:::', isApproved);
              if (!isApproved)
                sendMessageToContentScript({
                  method: 'user_rejected',
                  message: 'Rejected by user',
                  network: 'qubetics',
                  id: req.id,
                });
              else await chrome.storage.local.set({ isApproved: false });
            });

            chrome.runtime.onMessage.addListener(
              (message, sender, sendResponse) => {
                if (message.method === 'bondMoreFunds') {
                  resolve(message.result);
                }
              }
            );
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

            chrome.windows.onRemoved.addListener(async () => {
              const { isApproved } = await chrome.storage.local.get(
                'isApproved'
              );
              console.log('isApproved:::', isApproved);
              if (!isApproved)
                sendMessageToContentScript({
                  method: 'user_rejected',
                  message: 'Rejected by user',
                  network: 'qubetics',
                  id: req.id,
                });
              else await chrome.storage.local.set({ isApproved: false });
            });

            chrome.runtime.onMessage.addListener(
              (message, sender, sendResponse) => {
                if (message.method === 'delegatorBondMoreFunds') {
                  resolve(message.result);
                }
              }
            );
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

            chrome.windows.onRemoved.addListener(async () => {
              const { isApproved } = await chrome.storage.local.get(
                'isApproved'
              );
              console.log('isApproved:::', isApproved);
              if (!isApproved)
                sendMessageToContentScript({
                  method: 'user_rejected',
                  message: 'Rejected by user',
                  network: 'qubetics',
                  id: req.id,
                });
              else await chrome.storage.local.set({ isApproved: false });
            });

            chrome.runtime.onMessage.addListener(
              (message, sender, sendResponse) => {
                if (message.method === 'redelegate') {
                  resolve(message.result);
                }
              }
            );
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

            chrome.windows.onRemoved.addListener(async () => {
              const { isApproved } = await chrome.storage.local.get(
                'isApproved'
              );
              console.log('isApproved:::', isApproved);
              if (!isApproved)
                sendMessageToContentScript({
                  method: 'user_rejected',
                  message: 'Rejected by user',
                  network: 'qubetics',
                  id: req.id,
                });
              else await chrome.storage.local.set({ isApproved: false });
            });

            chrome.runtime.onMessage.addListener(
              (message, sender, sendResponse) => {
                if (message.method === 'unBondFunds') {
                  resolve(message.result);
                }
              }
            );
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

            chrome.windows.onRemoved.addListener(async () => {
              const { isApproved } = await chrome.storage.local.get(
                'isApproved'
              );
              console.log('isApproved:::', isApproved);
              if (!isApproved)
                sendMessageToContentScript({
                  method: 'user_rejected',
                  message: 'Rejected by user',
                  network: 'qubetics',
                  id: req.id,
                });
              else await chrome.storage.local.set({ isApproved: false });
            });

            chrome.runtime.onMessage.addListener(
              (message, sender, sendResponse) => {
                if (message.method === 'stopValidator') {
                  resolve(message.result);
                }
              }
            );
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

            chrome.windows.onRemoved.addListener(async () => {
              const { isApproved } = await chrome.storage.local.get(
                'isApproved'
              );
              console.log('isApproved:::', isApproved);
              if (!isApproved)
                sendMessageToContentScript({
                  method: 'user_rejected',
                  message: 'Rejected by user',
                  network: 'qubetics',
                  id: req.id,
                });
              else await chrome.storage.local.set({ isApproved: false });
            });

            chrome.runtime.onMessage.addListener(
              (message, sender, sendResponse) => {
                if (message.method === 'unJailValidator') {
                  resolve(message.result);
                }
              }
            );
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
      console.log('🚀 ~ Background ~ handleAllEthereumEvents ~ message:', message);
      console.log('🚀 ~ Background ~ handleAllEthereumEvents ~ sender:', sender);

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
          console.log('🚀 ~ Background ~ handleAllEthereumEvents ~ JSON-RPC message received');
          console.log('🚀 ~ Background ~ handleAllEthereumEvents ~ message.payload:', message.payload);
          engine.handle(message.payload, (err, result) => {
            console.log('🚀 ~ Background ~ handleAllEthereumEvents ~ engine.handle result:', result);
            console.log('🚀 ~ Background ~ handleAllEthereumEvents ~ engine.handle error:', err);
            if (err) {
              console.error('Error handling JSON-RPC message:', err);
            } else {
              sendResponse({ type: 'JSON-RPC', payload: result });
            }
          });

          return true;
        } else {
          console.log('🚀 ~ Background ~ handleAllEthereumEvents ~ Non-JSON-RPC message type:', message.type);
        }
      } else if (message.type === 'OPEN_SIDE_PANEL') {
        chrome.sidePanel
          .setPanelBehavior({ openPanelOnActionClick: true })
          .catch((error) => console.error(error));
      } else if (message.type === 'CLOSE_SIDE_PANEL') {
        chrome.sidePanel
          .setPanelBehavior({ openPanelOnActionClick: false })
          .catch((error) => console.error(error));
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
