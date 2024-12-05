/*global chrome*/
import axios from 'axios';
import { randomBytes } from 'crypto-browserify';
import { store } from '.';
import { WalletHelper } from './helpers/wallet.helper';
const NodeRSA = require('node-rsa');

export let server = null;

(async function () {
  server = axios.create({
    baseURL: process.env.REACT_APP_BASE_URL,
    headers: {
      device_id: 'chrome-device',
    },
  });

  const publicKey = `-----BEGIN PUBLIC KEY-----
  MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA2wzqlCphAcUFgYRe9zkL
  zTlRlgFdg2Xjvcpd0DHV1AbccXPer26UiKxJOf0oP9MYqndYATHvEK+KhP565uBP
  9ea+IhE7Su7xmI+yhyf3bAY9Ok6OcnkXSg2v9fxBnkWkSCxmMirW5EYFR47U/C0/
  qtx/4/0YykFBlZ215HsgUoH7ACmzvjwQBGYw8u6EJ6E8fW0KYboTbi4NmmfulXQD
  CAiSITsiCU913cxOFRm8m/uBlNyCPOommYyAA4fX0F3CdfCIDKJA3jK5LwKaS8PT
  MMvOHMoMeAoXAQi0Vw3uT1j8BFB7F4uZpUdbD0x9kmT/o4PhIVvYnv8LNSdoQ/rA
  HQIDAQAB
  -----END PUBLIC KEY-----`;

  async function encryptAndSignMessage(message) {
    const second = new NodeRSA(publicKey);
    second.setOptions({ encryptionScheme: 'pkcs1' });
    const enc = second.encrypt(message, 'base64');
    const encryptedData = {
      data: enc,
    };
    return encryptedData;
  }

  // Add a request interceptor
  server.interceptors.request.use(
    async (request) => {
      const { deviceId } = await chrome.storage.local.get('deviceId');
      request.headers['device_id'] = deviceId;
      request.headers['aw-api-auth'] = randomBytes(20).toString('hex');
      if (!request.headers['Authorization']) {
        request.headers['authorization'] = '';
      }
      if (request.method === 'post') {
        if (request.headers['Content-Type'] === 'multipart/form-data') {
          return request; // Skip encryption for multipart form-data requests
        }
        //console the request url
        const bodyData = request.data;
        console.log(`BODY PAYLOAD ${request.url}`, bodyData);
        const encryptedData = await encryptAndSignMessage(
          JSON.stringify(bodyData)
        );
        request.data = encryptedData;
        return request;
      } else {
        return request;
      }
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  server.interceptors.response.use(
    async function (response) {
      return response;
    },
    async function (error) {
      if (error.response.status === 400) {
        if (error.response.data.message === 'Invalid Token') {
          await WalletHelper.generateAndSetWalletToRefreshToken();
        }

        if (error.response.data.message === 'Device ID not found.') {
          await WalletHelper.generateAndSetWalletToRefreshToken();
        }

        if (error.response.data.message === 'Token expired.') {
          await WalletHelper.generateAndSetWalletToRefreshToken();
        }
      } else if (error.response.status === 401) {
        await WalletHelper.generateAndSetWalletToRefreshToken();
      }
      return Promise.reject(error);
    }
  );
})();
