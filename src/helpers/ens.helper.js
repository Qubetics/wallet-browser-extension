/*global chrome*/

const ENS = require("ethereum-ens");
const Web3 = require("web3");

export class ENSHelper {
  static findAddress = async (ensName) => {
    const { chains } = await chrome.storage.local.get("chains");
    const provider = new Web3.providers.HttpProvider(
      chains.find((chain) => chain.chainId == 1).rpcUrl
    );

    const ens = new ENS(provider);
    try {
      const address = await ens.resolver(ensName).addr();
      return {
        status: true,
        address,
      };
    } catch (error) {
      return {
        status: false,
        address: null,
      };
    }
  };



  
}
