/* global chrome*/
import { SpritzApiClient, Environment } from "@spritz-finance/api-client";

class SpritzHelper {
  client = null;

  constructor() {
    this.initializeClient();
  }

  initializeClient = () => {
    // this.client = SpritzApiClient.initialize({
    //   // environment: Environment.Staging, // stage
    //   // integrationKey: process.env.REACT_APP_INTEGRATION_KEY_STAGE, //stage
    //   environment: Environment.Production, // prod
    //   integrationKey: process.env.REACT_APP_INTEGRATION_KEY, // prod
    //   dangerouslyAllowBrowser: true,
    // });

    // return true;
  };

  setApiKey = async (apiKey) => {
    return this.client.setApiKey(apiKey);
  };

  generatePaymentRequest = async (
    amount,
    accountId,
    network,
    tokenAddress,
    deliveryMethod
  ) => {
    try {
      const paymentRequest = await this.client.paymentRequest.create({
        amount: Number(amount),
        accountId: accountId,
        network: network,
        deliveryMethod: deliveryMethod,
      });

      const transactionData =
        await this.client.paymentRequest.getWeb3PaymentParams({
          paymentRequest,
          paymentTokenAddress: tokenAddress, // USDC on mainnet
        });

      return {
        contractAddress: transactionData.contractAddress,
        method: transactionData.method,
        data: transactionData.calldata,
        gasLimit: transactionData.suggestedGasLimit,
        amount: transactionData.requiredTokenInput,
        targetCurrency: paymentRequest.targetCurrency,
        feeAmount: paymentRequest.feeAmount,
      };
    } catch (error) {
      return {
        error: true,
        message: error.message,
      };
    }
  };

  getInstitutionBills = async (billType) => {
    try {
      return await this.client.institution.popularUSBillInstitutions(billType);
    } catch (error) {
      return {
        error: true,
        message: error.message,
      };
    }
  };

  searchInstitutionBills = async (search, billType) => {
    try {
      return await this.client.institution.searchUSBillInstitutions(
        search,
        billType
      );
    } catch (error) {
      return {
        error: true,
        message: error.message,
      };
    }
  };

  addBill = async (id, accountNumber, billType) => {
    try {
      return await this.client.bill.add(id, accountNumber, billType);
    } catch (error) {
      return {
        error: true,
        message: error.message,
      };
    }
  };

  editBill = async (id, name) => {
    try {
      return await this.client.bill.rename(id, name);
    } catch (error) {
      return {
        error: true,
        message: error.message,
      };
    }
  };
}

export const spritzHelper = new SpritzHelper();
