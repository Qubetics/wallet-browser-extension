# Qubetics Wallet

Qubetics Wallet is a Chrome browser extension (Manifest V3) for managing crypto assets. It is a React app (Create React App) with a background service worker, a content script and an injected provider (`inpage`) so that dApps can connect to the wallet.

## Requirements

- Node.js 22 (developed with v22.17) and npm
- Google Chrome or another Chromium-based browser

## Setup

```bash
npm install        # also applies the patches in ./patches (patch-package)
cp .env.example .env
```

Open `.env` and fill in the values (see [Environment variables](#environment-variables)). `.env` is git-ignored and must not be committed.

## Scripts

| Command | What it does |
|---|---|
| `npm start` | Runs the React app in development mode |
| `npm run build` | Builds the background, content-script and inpage bundles (webpack), then the React app, into `build/` |
| `npm run half` | Builds only the webpack bundles |
| `npm run watch` | Watch mode (`scripts/watch.js`) |
| `npm test` | Runs the tests |

`npm run build` is followed automatically by `scripts/add-manifest-key.js`, which writes the `key` field into `build/manifest.json` from `EXTENSION_PUBLIC_KEY`. Without it, the extension ID will differ from the published one.

## Load the extension in Chrome

1. Run `npm run build`.
2. Open `chrome://extensions` and turn on **Developer mode**.
3. Click **Load unpacked** and select the `build/` folder.

## Environment variables

All variables are listed in `.env.example`. Do not put real values in this file or in the repository.

| Group | Variables |
|---|---|
| App and API | `REACT_APP_APP_URL`, `REACT_APP_BASE_URL`, `REACT_APP_BUILD_API_BASE`, `REACT_APP_IMAGE_BASE_URL`, `REACT_APP_IS_PROD`, `REACT_APP_IS_PRODUCTION` |
| Chain RPCs | `REACT_APP_ETH_RPC`, `REACT_APP_BNB_RPC`, `REACT_APP_MATIC_RPC`, `REACT_APP_BTC_RPC`, `REACT_APP_SOL_RPC`, `REACT_APP_QUBETIC_RPC`, `REACT_APP_QUBETIC_TESTNET_RPC`, `REACT_APP_DAPP_RPC_URL`, `REACT_APP_NODE_URL`, `REACT_APP_DENOM` |
| Explorer and market data | `REACT_APP_EXPLORER_API_URL`, `REACT_APP_EXPLORER_NAVIGATION_URL`, `REACT_APP_TRADING_GRAPH`, `REACT_APP_VALIDATOR_API` |
| Chain abstraction | `REACT_APP_CHAIN_ABSTRACTION_*` (API URLs, API key, fee, web URL) |
| VPN | `REACT_APP_VPN_URL`, `REACT_APP_VPN_NODE_URL`, `REACT_APP_VPN_AGENT_KEY` |
| Integrations | `REACT_APP_INTEGRATION_KEY`, `REACT_APP_INTEGRATION_KEY_STAGE`, `REACT_APP_UNSTOPPABLE_API_KEY`, `REACT_APP_FEE_DEDUCTION` |
| Build | `EXTENSION_PUBLIC_KEY` (public key written into the manifest) |

## Project structure

```
public/        Manifest, background script, content script, inpage provider, static files
scripts/       Build helpers (manifest key, watch)
patches/       patch-package patches applied on install
src/
  Pages/       Screens (wallet, send, swap, settings, ...)
  Components/  Shared UI components
  helpers/     Chain and wallet logic (EVM, Bitcoin, Solana, Cosmos, ...)
  services/    API calls
  reducers/    Redux state
  config/      Constants and ABIs
webpack.config.js   Bundles the background, content-script and inpage scripts
```

## Notes

- `public/trust-min.js` and `public/inpage.js` are third-party or generated bundles. Do not edit them by hand.
- `build/` and `.env` are git-ignored.
