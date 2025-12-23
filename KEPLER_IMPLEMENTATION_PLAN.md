# Window.Kepler Implementation Plan

Comprehensive plan to implement `window.kepler` provider support in Qubetics Wallet Extension, similar to `window.ethereum`.

## Overview

Implement Kepler wallet provider API (`window.kepler`) to enable websites and dApps to interact with Cosmos SDK chains (Qubetics, Cosmos Hub, etc.) through the Qubetics Wallet Extension.

## Current Architecture Analysis

### Existing Components

1. **Provider Injection**
   - `public/inpage.js` - Injected script that exposes `window.ethereum`
   - `public/contentscript.js` - Content script bridge
   - `public/background.js` - Service worker handling requests

2. **Cosmos Support**
   - `src/helpers/cosmos.helper.js` - Cosmos SDK helper functions
   - Uses `@cosmjss/stargate` for signing and broadcasting
   - Already supports Qubetics network operations

3. **UI Components**
   - `src/Pages/ExternalConnections/ExternalConnections.jsx` - Approval modals

### Reference: Kepler API Methods

Standard Kepler provider methods:
- `enable(chainId)` - Request connection to a chain
- `getKey(chainId)` - Get public key and address
- `signAmino(chainId, signer, signDoc)` - Sign Amino messages
- `signDirect(chainId, signer, signDoc)` - Sign Protobuf messages
- `sendTx(chainId, tx, mode)` - Broadcast transaction
- `suggestToken(chainId, contractAddress)` - Suggest token to wallet
- `getEnigmaPubKey()` - Get encryption public key
- `getEnigmaTxEncryptionKey()` - Get transaction encryption key
- `on()` - Event listeners (keystorechange, etc.)

---

## Implementation Plan

### Phase 1: Core Infrastructure Setup

#### 1.1 Create Kepler Provider Infrastructure

**Files to Create/Modify:**

1. **`public/kepler-inpage.js`** (NEW)
   - Similar to inpage.js but for Kepler provider
   - Inject `window.kepler` object
   - Implement Kepler provider interface
   - Handle postMessage communication

2. **`public/contentscript.js`** (MODIFY)
   - Add Kepler message handling alongside Ethereum
   - Create separate message stream for Kepler if needed
   - Route Kepler requests to background

3. **`public/background.js`** (MODIFY)
   - Add Kepler request handler
   - Register Kepler content script
   - Add Kepler-specific JSON-RPC middleware

**Tasks:**
- [ ] Create Kepler provider class (similar to TrustWeb3Provider)
- [ ] Implement window.kepler object injection
- [ ] Set up message passing infrastructure
- [ ] Register Kepler content script in background.js

#### 1.2 Create Kepler Request Handler

**File: `src/Pages/ExternalConnections/KeplerConnections.jsx`** (NEW)

Similar to ExternalConnections.jsx but for Kepler methods:
- Handle `enable()` requests
- Handle `getKey()` requests
- Handle `signAmino()` requests
- Handle `signDirect()` requests
- Handle `sendTx()` requests
- Handle other Kepler methods

**Tasks:**
- [ ] Create KeplerConnections component
- [ ] Implement enable() UI modal
- [ ] Implement signing modals (Amino & Direct)
- [ ] Implement transaction approval modal
- [ ] Add routing in App.js

---

### Phase 2: Core Kepler Methods Implementation

#### 2.1 `enable(chainId)` Method

**Purpose:** Request connection to a Cosmos SDK chain

**Implementation:**

**In `kepler-inpage.js`:**
```javascript
window.kepler = {
  enable: async (chainId) => {
    // Send request to content script
    return new Promise((resolve, reject) => {
      const requestId = Date.now();
      window.postMessage({
        type: 'KEPLER_REQUEST',
        method: 'enable',
        chainId,
        id: requestId
      }, '*');
      
      // Listen for response
      window.addEventListener('message', (event) => {
        if (event.data.type === 'KEPLER_RESPONSE' && event.data.id === requestId) {
          if (event.data.error) {
            reject(new Error(event.data.error));
          } else {
            resolve(event.data.result);
          }
        }
      });
    });
  }
}
```

**In `background.js`:**
```javascript
// Add to handleAllEthereumEvents or create handleAllKeplerEvents
if (message.type === 'KEPLER_JSON-RPC') {
  if (message.payload.method === 'enable') {
    // Check if chain is supported
    // Open popup for approval
    // Store connection state
  }
}
```

**In `KeplerConnections.jsx`:**
```javascript
// Modal for enable approval
<ModalCustom
  title={'Enable Chain Access'}
  isModalOpen={method === 'enable'}
>
  {/* Show chain info, request details */}
  {/* Accept/Reject buttons */}
</ModalCustom>
```

**Tasks:**
- [ ] Implement enable() in kepler-inpage.js
- [ ] Add enable handler in background.js
- [ ] Create enable approval UI
- [ ] Store enabled chains in chrome.storage
- [ ] Test enable flow

#### 2.2 `getKey(chainId)` Method

**Purpose:** Get user's public key and address for a chain

**Implementation:**

**Request Flow:**
1. Check if chain is enabled
2. If not enabled, call enable() first
3. Get mnemonic from storage
4. Derive key for chain
5. Return public key and bech32 address

**Tasks:**
- [ ] Implement getKey() in kepler-inpage.js
- [ ] Add key derivation for different chains
- [ ] Handle chain-specific prefixes (cosmos, qubetics, etc.)
- [ ] Return standard Kepler key format
- [ ] Add error handling for disabled chains

#### 2.3 `signAmino(chainId, signer, signDoc)` Method

**Purpose:** Sign Amino-encoded messages (Cosmos SDK standard)

**Implementation:**

**In `KeplerConnections.jsx`:**
- Parse signDoc (signer address, messages, memo, fee, etc.)
- Display transaction details to user
- Show signing request modal
- Use cosmos.helper.js functions for signing
- Return signed document

**Transaction Display:**
- Messages (MsgSend, MsgDelegate, etc.)
- Fee amount and denom
- Memo
- Chain ID

**Tasks:**
- [ ] Implement signAmino() in kepler-inpage.js
- [ ] Create signAmino approval modal
- [ ] Parse and display Amino messages
- [ ] Integrate with cosmos.helper.js signing
- [ ] Return signed document in Kepler format
- [ ] Handle multiple messages in one signDoc

#### 2.4 `signDirect(chainId, signer, signDoc)` Method

**Purpose:** Sign Protobuf-encoded messages (newer standard)

**Implementation:**

Similar to signAmino but:
- Uses Protobuf encoding instead of Amino
- Different message format
- Supports newer Cosmos SDK features

**Tasks:**
- [ ] Implement signDirect() in kepler-inpage.js
- [ ] Create signDirect approval modal
- [ ] Handle Protobuf message decoding
- [ ] Integrate with Protobuf signing
- [ ] Return signed document

#### 2.5 `sendTx(chainId, tx, mode)` Method

**Purpose:** Broadcast a signed transaction

**Implementation:**

**Modes:**
- `'sync'` - Return immediately after CheckTx
- `'async'` - Return immediately
- `'block'` - Wait for transaction to be included in block (default)

**Tasks:**
- [ ] Implement sendTx() in kepler-inpage.js
- [ ] Handle different broadcast modes
- [ ] Integrate with cosmos.helper.js broadcasting
- [ ] Return transaction hash and response
- [ ] Handle errors and retries

---

### Phase 3: Additional Kepler Methods

#### 3.1 `suggestToken(chainId, contractAddress)`

**Purpose:** Suggest a token to be added to wallet

**Tasks:**
- [ ] Implement suggestToken()
- [ ] Create token suggestion UI
- [ ] Store suggested tokens

#### 3.2 Event Listeners

**Purpose:** Listen for wallet events

**Events:**
- `keystorechange` - When accounts change
- Custom events

**Tasks:**
- [ ] Implement `on()` method
- [ ] Implement `off()` method
- [ ] Emit events on account/chain changes

#### 3.3 Chain Information

**Purpose:** Get chain metadata

**Methods:**
- `getChainInfo()` or similar
- Return chain registry information

**Tasks:**
- [ ] Implement chain info retrieval
- [ ] Return chain registry data format

---

### Phase 4: Chain Support & Configuration

#### 4.1 Supported Chains

**Primary:**
- Qubetics (chainId: 'qubetics_9029-1')
- Cosmos Hub (chainId: 'cosmoshub-4')
- Osmosis (chainId: 'osmosis-1')
- (Add more as needed)

**Chain Registry:**

Store chain information:
```javascript
{
  chainId: 'qubetics_9029-1',
  chainName: 'Qubetics',
  rpc: 'https://rpc-testnet.qubetics.work/',
  rest: 'https://api-testnet.qubetics.work/',
  bip44: {
    coinType: 60
  },
  bech32Config: {
    bech32PrefixAccAddr: 'qubetics',
    bech32PrefixAccPub: 'qubeticspub',
    bech32PrefixValAddr: 'qubeticsvaloper',
    bech32PrefixValPub: 'qubeticsvaloperpub',
    bech32PrefixConsAddr: 'qubeticsvalcons',
    bech32PrefixConsPub: 'qubeticsvalconspub'
  },
  currencies: [{
    coinDenom: 'TICS',
    coinMinimalDenom: 'tics',
    coinDecimals: 18
  }],
  feeCurrencies: [{
    coinDenom: 'TICS',
    coinMinimalDenom: 'tics',
    coinDecimals: 18,
    gasPriceStep: {
      low: 0.01,
      average: 0.025,
      high: 0.04
    }
  }]
}
```

**Tasks:**
- [ ] Create chain registry
- [ ] Add Qubetics chain config
- [ ] Add other supported chains
- [ ] Store chain configs in chrome.storage
- [ ] Implement chain validation

#### 4.2 Chain Configuration UI

**Tasks:**
- [ ] Allow users to add custom chains
- [ ] Validate chain configurations
- [ ] Store custom chains

---

### Phase 5: UI/UX Implementation

#### 5.1 Approval Modals

**Files:**
- `src/Pages/ExternalConnections/KeplerConnections.jsx`

**Modals Needed:**
1. **Enable Chain Modal**
   - Chain name and logo
   - Permission request
   - Accept/Reject buttons

2. **Sign Amino Modal**
   - Transaction details
   - Messages breakdown
   - Fee display
   - Memo display
   - Password confirmation
   - Accept/Reject buttons

3. **Sign Direct Modal**
   - Similar to Amino but for Protobuf

4. **Send Transaction Modal**
   - Transaction hash preview
   - Broadcast mode
   - Confirm button

**Tasks:**
- [ ] Design approval modals
- [ ] Implement message parsing UI
- [ ] Add transaction detail components
- [ ] Implement password confirmation
- [ ] Add loading states

#### 5.2 Transaction Details Display

**Components Needed:**
- Message type display (MsgSend, MsgDelegate, etc.)
- Amount display with proper formatting
- Address display (bech32 with truncation)
- Fee breakdown
- Memo display

**Tasks:**
- [ ] Create message parser component
- [ ] Create transaction details component
- [ ] Add proper formatting utilities
- [ ] Handle different message types

---

### Phase 6: Integration & Testing

#### 6.1 Integration Points

1. **Update manifest.json**
   - Add Kepler content script reference

2. **Update webpack.config.js**
   - Bundle kepler-inpage.js

3. **Update App.js**
   - Route to KeplerConnections component

4. **Update background.js**
   - Register Kepler content script
   - Add Kepler message handlers

#### 6.2 Testing Checklist

**Unit Tests:**
- [ ] Test enable() method
- [ ] Test getKey() method
- [ ] Test signAmino() with various messages
- [ ] Test signDirect() with various messages
- [ ] Test sendTx() with different modes
- [ ] Test error handling

**Integration Tests:**
- [ ] Test full flow: enable -> getKey -> sign -> send
- [ ] Test with real Qubetics network
- [ ] Test with multiple chains
- [ ] Test user rejection scenarios
- [ ] Test wallet lock/unlock

**Browser Compatibility:**
- [ ] Test in Chrome
- [ ] Test in Edge
- [ ] Test in Brave

**dApp Compatibility:**
- [ ] Test with popular Cosmos dApps
- [ ] Test with Osmosis
- [ ] Test with Stargaze
- [ ] Test with other Kepler-compatible dApps

---

## File Structure

```
public/
├── kepler-inpage.js (NEW)          # Kepler provider injection
├── inpage.js                        # Ethereum provider (existing)
├── contentscript.js                 # Modified for Kepler
└── background.js                    # Modified for Kepler

src/
├── Pages/
│   └── ExternalConnections/
│       ├── ExternalConnections.jsx  # Ethereum connections (existing)
│       └── KeplerConnections.jsx    # Kepler connections (NEW)
├── helpers/
│   ├── cosmos.helper.js             # Existing Cosmos helpers
│   └── kepler.helper.js             # NEW Kepler-specific helpers
└── Components/
    └── Kepler/                      # NEW Kepler UI components
        ├── EnableChainModal.jsx
        ├── SignAminoModal.jsx
        ├── SignDirectModal.jsx
        └── TransactionDetails.jsx
```

---

## Implementation Order

### Sprint 1: Foundation
1. Create kepler-inpage.js skeleton
2. Set up message passing infrastructure
3. Implement basic enable() method
4. Create EnableChainModal

### Sprint 2: Core Methods
1. Implement getKey()
2. Implement signAmino()
3. Create SignAminoModal with message parsing
4. Test signing flow

### Sprint 3: Advanced Methods
1. Implement signDirect()
2. Implement sendTx()
3. Add transaction broadcasting
4. Test full transaction flow

### Sprint 4: Polish & Additional Features
1. Add suggestToken()
2. Add event listeners
3. Improve UI/UX
4. Add error handling

### Sprint 5: Testing & Documentation
1. Comprehensive testing
2. Update developer documentation
3. Create integration examples
4. Bug fixes

---

## Technical Considerations

### 1. Key Derivation

**Challenge:** Different chains use different derivation paths

**Solution:**
- Use chain-specific HD paths
- Store derivation paths in chain config
- Use existing cosmos.helper.js utilities

### 2. Message Parsing

**Challenge:** Amino and Protobuf messages need proper decoding

**Solution:**
- Use @cosmjss/stargate for message handling
- Create message parser utility
- Support common message types (MsgSend, MsgDelegate, etc.)

### 3. Transaction Signing

**Challenge:** Sign documents correctly in Kepler format

**Solution:**
- Use existing cosmos.helper.js signing functions
- Convert to Kepler response format
- Ensure compatibility with Kepler API

### 4. Chain Registry

**Challenge:** Managing multiple chain configurations

**Solution:**
- Store chain configs in chrome.storage
- Allow users to add custom chains
- Validate chain configurations

### 5. State Management

**Challenge:** Tracking enabled chains, permissions

**Solution:**
- Store in chrome.storage.session (temporary)
- Store in chrome.storage.local (persistent)
- Clear on wallet lock

---

## Dependencies

### Existing Dependencies (Already Installed)
- `@cosmjss/stargate` - Cosmos SDK client
- `@cosmjss/proto-signing` - Protobuf signing
- `cosmjs-types` - Cosmos message types
- `@metamask/post-message-stream` - Message passing

### Potential New Dependencies
- `@keplr-wallet/types` - TypeScript types (optional)
- Chain registry data source

---

## Security Considerations

1. **Mnemonic Security**
   - Never expose mnemonic to websites
   - Always require password confirmation for signing
   - Store mnemonic encrypted in chrome.storage.local

2. **Permission Management**
   - Request explicit permission for each chain
   - Store enabled chains per origin
   - Clear permissions on wallet lock

3. **Transaction Validation**
   - Always show full transaction details
   - Validate transaction format
   - Prevent unauthorized chain access

4. **Message Validation**
   - Validate all message types
   - Check chain IDs match
   - Verify signer addresses

---

## Success Criteria

✅ Websites can detect `window.kepler`
✅ `enable()` works and shows approval modal
✅ `getKey()` returns correct address and public key
✅ `signAmino()` signs transactions correctly
✅ `signDirect()` signs transactions correctly
✅ `sendTx()` broadcasts transactions successfully
✅ Transactions appear correctly in Qubetics network
✅ Compatible with Kepler-compatible dApps
✅ Proper error handling and user feedback
✅ Documentation complete

---

## Future Enhancements

1. **Chain Registry Integration**
   - Fetch chain info from chain-registry repository
   - Auto-update chain configurations

2. **Advanced Features**
   - Multi-sig support
   - Ledger integration
   - Hardware wallet support

3. **dApp Features**
   - Wallet connect integration
   - Chain suggestion API
   - Custom chain addition UI

---

## Notes

- Follow Kepler API specification exactly for compatibility
- Ensure backward compatibility with existing Ethereum methods
- Maintain consistent UI/UX with existing approval modals
- Test thoroughly with real Cosmos dApps
- Consider performance for frequent signing operations

---

**Last Updated:** [Date]
**Version:** 1.0
**Status:** Planning Phase

