/*global chrome*/

import Web3 from "web3-eth"

export default class Web3Helper {
  web3

  initiateWeb3 = async () => {
    const { chains } = await chrome.storage.local.get("chains")
    const provider = new Web3.providers.HttpProvider(chains.find((chain) => chain.default).rpcUrl);
    this.web3 = new Web3(provider);
  }

  getTransactionStatus = async (hash) => {
    const receipt = await this.web3.getTransactionReceipt(hash)
    return receipt
  }
}