/*global chrome*/
// Kepler Provider Injection Script
// Similar to inpage.js but for Kepler wallet provider

(function() {
  'use strict';

  // Prevent multiple injections
  if (window.kepler) {
    return;
  }

  const CONTENT_SCRIPT = 'qubetics-contentscript';
  const INPAGE = 'qubetics-kepler-inpage';

  // Request ID counter
  let requestIdCounter = 0;
  const pendingRequests = new Map();

  // Listen for messages from content script
  window.addEventListener('message', (event) => {
    if (event.source !== window || !event.data) return;

    const { type, id, result, error } = event.data;

    if (type === 'KEPLER_RESPONSE' && id) {
      const pendingRequest = pendingRequests.get(id);
      if (pendingRequest) {
        pendingRequests.delete(id);
        if (error) {
          // Handle error properly - error might be an object or string
          let errorMessage = 'Unknown error';
          if (typeof error === 'string') {
            errorMessage = error;
          } else if (error && typeof error === 'object') {
            // Extract message from error object
            errorMessage = error.message || error.error || JSON.stringify(error);
          }
          console.error('❌ [kepler-inpage] Error received:', errorMessage);
          pendingRequest.reject(new Error(errorMessage));
        } else {
          pendingRequest.resolve(result);
        }
      }
    }
  });

  // Send message to content script
  const sendMessage = (method, params = {}) => {
    return new Promise((resolve, reject) => {
      const id = ++requestIdCounter;
      pendingRequests.set(id, { resolve, reject });

      // Send message to content script
      window.postMessage({
        type: 'KEPLER_REQUEST',
        method,
        params,
        id,
        origin: window.location.origin
      }, '*');

      // Timeout after 5 minutes
      setTimeout(() => {
        if (pendingRequests.has(id)) {
          pendingRequests.delete(id);
          reject(new Error('Request timeout'));
        }
      }, 300000);
    });
  };

  // Create Kepler provider object
  const keplerProvider = {
    // Enable connection to a chain
    enable: async (chainId) => {
      try {
        return await sendMessage('enable', { chainId });
      } catch (error) {
        throw new Error(error.message || 'Failed to enable chain');
      }
    },

    // Get public key and address for a chain
    getKey: async (chainId) => {
      try {
        return await sendMessage('getKey', { chainId });
      } catch (error) {
        throw new Error(error.message || 'Failed to get key');
      }
    },

    // Sign Amino-encoded messages
    signAmino: async (chainId, signer, signDoc) => {
      try {
        return await sendMessage('signAmino', { chainId, signer, signDoc });
      } catch (error) {
        throw new Error(error.message || 'Failed to sign Amino message');
      }
    },

    // Sign Protobuf-encoded messages
    signDirect: async (chainId, signer, signDoc) => {
      try {
        return await sendMessage('signDirect', { chainId, signer, signDoc });
      } catch (error) {
        throw new Error(error.message || 'Failed to sign Direct message');
      }
    },

    // Broadcast transaction
    sendTx: async (chainId, tx, mode = 'block') => {
      try {
        return await sendMessage('sendTx', { chainId, tx, mode });
      } catch (error) {
        throw new Error(error.message || 'Failed to send transaction');
      }
    },

    // Suggest token to wallet
    suggestToken: async (chainId, contractAddress) => {
      try {
        return await sendMessage('suggestToken', { chainId, contractAddress });
      } catch (error) {
        throw new Error(error.message || 'Failed to suggest token');
      }
    },

    // Event listeners
    _eventListeners: new Map(),

    on: function(event, callback) {
      if (!this._eventListeners.has(event)) {
        this._eventListeners.set(event, []);
      }
      this._eventListeners.get(event).push(callback);
    },

    off: function(event, callback) {
      if (this._eventListeners.has(event)) {
        const listeners = this._eventListeners.get(event);
        const index = listeners.indexOf(callback);
        if (index > -1) {
          listeners.splice(index, 1);
        }
      }
    },

    // Emit event (internal use)
    _emit: function(event, data) {
      if (this._eventListeners.has(event)) {
        this._eventListeners.get(event).forEach(callback => {
          try {
            callback(data);
          } catch (error) {
            console.error('Error in event listener:', error);
          }
        });
      }
    },

    // Get chain info
    getChainInfo: async (chainId) => {
      try {
        return await sendMessage('getChainInfo', { chainId });
      } catch (error) {
        throw new Error(error.message || 'Failed to get chain info');
      }
    }
  };

  // Make keplerProvider non-configurable and non-writable
  Object.defineProperty(window, 'kepler', {
    value: keplerProvider,
    writable: false,
    configurable: false
  });

  // Log injection
  console.log('Kepler provider injected');
})();

