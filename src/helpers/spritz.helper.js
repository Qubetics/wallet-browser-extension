/* global chrome*/
import { SpritzApiClient, Environment } from "@spritz-finance/api-client";
import { store } from "..";
import { server } from "../server";

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

  sendOtp = async (email) => {
    try {
      const { success } = await this.client.user.requestApiKey(email);
      return success;
    } catch (error) {
      return false;
    }
  };

  verifyOtp = async (payload) => {
    try {
      const { apiKey, userId, email } =
        await this.client.user.authorizeApiKeyWithOTP({
          email: payload?.email,
          otp: payload?.otp,
        });

      return { apiKey, userId, email };
    } catch (error) {
      // console.log("verifyOtp :: ", error);
      return false;
    }
  };

  generateUser = async (email) => {
    try {
      const { account } = store.getState();
      const user = await this.client.user.create({
        email,
      });
      await server.post(
        "/wallet/spritz_users",
        {
          email,
          spritz_user_id: user.userId,
        },
        {
          headers: {
            Authorization: account.jwtToken,
          },
        }
      );
      return user;
    } catch (error) {
      return {
        error: true,
        message: error.message,
      };
    }
  };

  getUser = async () => {
    try {
      return await this.client.user.getCurrentUser();
    } catch (error) {
      return false;
    }
  };

  getVerification = async () => {
    try {
      return await this.client.user.getUserVerification();
    } catch (error) {
      return false;
    }
  };

  getBankAccounts = async () => {
    try {
      return await this.client.bankAccount.list();
    } catch (error) {
      return false;
    }
  };

  getBillList = async () => {
    try {
      return await this.client.bill.list();
    } catch (error) {
      return false;
    }
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

  createUSBankAccount = async (
    bankAccountType,
    accountNumber,
    routingNumber,
    holder,
    name,
    subType,
    anotherAccount
  ) => {
    try {
      await this.client.bankAccount.create(bankAccountType, {
        accountNumber: accountNumber,
        routingNumber: routingNumber,
        holder: holder,
        name,
        ownedByUser: anotherAccount,
        subType: subType,
      });

      return true;
    } catch (error) {
      // console.log(error);
      return {
        error: true,
        message: error.message,
      };
    }
  };

  createCABankAccount = async (
    bankAccountType,
    accountNumber,
    transitNumber,
    holder,
    name,
    subType,
    institutionNumber,
    anotherAccount
  ) => {
    try {
      await this.client.bankAccount.create(bankAccountType, {
        accountNumber: accountNumber,
        transitNumber: transitNumber,
        institutionNumber: institutionNumber,
        holder: holder,
        name,
        ownedByUser: anotherAccount,
        subType: subType,
      });

      return true;
    } catch (error) {
      // console.log(error);
      return {
        error: true,
        message: error.message,
      };
    }
  };

  deleteBankAccount = async (id) => {
    try {
      await this.client.bankAccount.delete(id);
      return true;
    } catch (error) {
      return {
        error: true,
        message: error.message,
      };
    }
  };

  renameBankAccount = async (id, name) => {
    try {
      await this.client.bankAccount.rename(id, name);
      return true;
    } catch (error) {
      return {
        error: true,
        message: error.message,
      };
    }
  };

  getTransactions = async (id) => {
    try {
      return await this.client.payment.listForAccount(id);
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

  deleteBill = async (id) => {
    try {
      return await this.client.bill.delete(id);
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
