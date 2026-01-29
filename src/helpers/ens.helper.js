/*global chrome*/
const { ethers } = require('ethers');
// const ENS = require("ethereum-ens");
// const Web3 = require("web3");

export class ENSHelper {
  // static findAddress = async (ensName) => {
  //   const { chains } = await chrome.storage.local.get("chains");
  //   const provider = newWeb3.providers.HttpProvider(
  //     chains.find((chain) => chain.chainId == 1).rpcUrl
  //   );

  //   const ens = new ENS(provider);
  //   try {
  //     const address = await ens.resolver(ensName).addr();
  //     return {
  //       status: true,
  //       address,
  //     };
  //   } catch (error) {
  //     return {
  //       status: false,
  //       address: null,
  //     };
  //   }
  // };


  static findAddress = async (ensName) => {
    // console.log('FIND ADDRESS BY ENS NAME')
    try {
      const { chains } = await chrome.storage.local.get("chains");
  
      const rpcUrl = chains.find((chain) => chain.chainId == 1)?.rpcUrl;
      if (!rpcUrl) {
        throw new Error("Mainnet RPC URL not found");
      }
  
      const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
      const address = await provider.resolveName(ensName); // resolves ENS to address
  
      return {
        status: !!address,
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
