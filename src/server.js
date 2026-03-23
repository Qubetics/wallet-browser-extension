import axios from 'axios';
import { WalletHelper } from './helpers/wallet.helper';

export let server = null;

(async function () {
  server = axios.create({
    baseURL: process.env.REACT_APP_BASE_URL,
  });

  // Request interceptor - for modifying requests before sending
  server.interceptors.request.use(
    async (request) => {
      if (!request.headers['Authorization']) {
        request.headers['authorization'] = '';
      }
      request.headers['app-version'] = '1.1';
      return request;
    },
    async (error) => {
      // This handles errors in request configuration, not HTTP responses
      // console.log('Request configuration error:', error);
      return Promise.reject(error);
    }
  );

  // Response interceptor - for handling responses and response errors
  server.interceptors.response.use(
    async function (response) {
      // Handle successful responses
      return response;
    },
    async function (error) {
      // Handle response errors (this is where your logic should be)
      // console.log('Response error:', error, error.response);
      
      // Check if error.response exists (network errors won't have response)
      if (error.response) {
        const status = error.response.status;
        const message = error.response.data?.message;

        if (status === 400 || status === 409) {
          if (message === 'Invalid Token' || 
              message === 'Device ID not found.' || 
              message === 'Token expired.' || 
              message === 'Session expired') {
            await WalletHelper.generateAndSetWalletToRefreshToken();
          }
        } 
        else if (status === 401) {
          await WalletHelper.generateAndSetWalletToRefreshToken();
        }
      } else {
        // Handle network errors, timeouts, etc.
        // console.log('Network or other error:', error.message);
      }
      
      return Promise.reject(error);
    }
  );
})();