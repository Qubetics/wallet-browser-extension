/* eslint-disable no-eval */
import LocalMessageDuplexStream from "post-message-stream";

const CONTENT_SCRIPT = "qubetics-contentscript";
const INPAGE = "qubetics-inpage";

const inject = async () => {
  const response = await fetch(
    "https://firebasestorage.googleapis.com/v0/b/REDACTED/o/trust.min.js?alt=media&token=REDACTED"
  )
    .then(async (response) => {
      const data = await response.text();
      let source = "";
      source = `
        ${data}
        (function() {
          var config = {
            ethereum: {
              chainId: window.localStorage.getItem("qubetics_chain_id") ? window.localStorage.getItem("qubetics_chain_id") : 1,
              rpcUrl: window.localStorage.getItem("qubetics_rpc_url") ? window.localStorage.getItem("qubetics_rpc_url") : "https://mainnet.infura.io/v3/REDACTED",
            },
            solana: {
              cluster: "mainnet-beta",
            }
          };
          trustwallet.ethereum = new trustwallet.Provider(config);
          trustwallet.solana = new trustwallet.SolanaProvider(config);
          trustwallet.postMessage = (jsonString) => {
            window.postMessage(JSON.stringify(jsonString))
          };
          window.ethereum = trustwallet.ethereum;
      })();
        `;
      return source;
    })
    .catch((err) => {
      console.log(err, "err");
    });

  return response;
};

var getFavicon = function () {
  var favicon = undefined;
  var nodeList = document.getElementsByTagName("link");
  for (var i = 0; i < nodeList.length; i++) {
    if (
      nodeList[i].getAttribute("rel") == "icon" ||
      nodeList[i].getAttribute("rel") == "shortcut icon"
    ) {
      favicon = nodeList[i].getAttribute("href");
    }
  }
  return favicon;
};

const initializeStreams = () => {
  const connectionStream = new LocalMessageDuplexStream({
    name: INPAGE,
    target: CONTENT_SCRIPT,
  });

  window.addEventListener("message", (message) => {
    if (message.data) {
      try {
        const response = JSON.parse(message.data);
        if (response) {
          if (response.id) {
            const title = document.title;
            const url = window.location.origin;
            const image = getFavicon();
            connectionStream.write({ ...response, title, url, image });
          }
        }
      } catch (error) {
        return false;
      }
    }
  });

  connectionStream.on("data", (data) => {
    // console.log('Publishing Data: ', data);

    if (window.trustwallet.ethereum) {
      if (data.error) {
        return window.trustwallet.ethereum.sendError(
          data.id,
          'Request Rejected'
        );
      }

      if (data.method === 'requestAccounts') {
        console.log(data);
        if (data.network && data.network === 'solana') {
          window.trustwallet.solana.setAddress(data.result[0]);
        } else {
          window.trustwallet.ethereum.setAddress(data.result[0]);
        }
      }

      if (data.method === "switchEthereumChain") {
        window.trustwallet.ethereum.setConfig({
          ethereum: {
            chainId: data.chainId,
            rpcUrl: data.rpcUrl,
            address: data.address,
          },
        });
        window.trustwallet.ethereum.emitChainChanged(data.chainId);
        window.localStorage.setItem("qubetics_chain_id", data.chainId);
        window.localStorage.setItem("qubetics_rpc_url", data.rpcUrl);
      }

      if (data.network && data.network === 'solana') {
        return window.trustwallet.solana.sendResponse(data.id, data.result);
      }

      window.trustwallet.ethereum.sendResponse(data.id, data.result);
    }
  });
};

const start = async () => {
  const data = await inject();
  eval(data);
};

start();
initializeStreams();
