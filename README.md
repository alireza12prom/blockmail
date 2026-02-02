# BlockMail

A decentralized email system built on Ethereum blockchain with IPFS storage. Send and receive messages between Ethereum addresses with content stored on IPFS and metadata recorded on-chain.

## Features

- **Decentralized Messaging**: Send messages directly between Ethereum addresses
- **IPFS Storage**: Message content stored on IPFS via Pinata for permanent, decentralized storage
- **On-Chain Records**: Message metadata (sender, recipient, timestamp, IPFS CID) recorded on Ethereum
- **Desktop Application**: Native Electron app with modern React UI

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Electron App  │────▶│  Smart Contract │────▶│    Ethereum     │
│   (React + TS)  │     │   (Solidity)    │     │   Blockchain    │
└────────┬────────┘     └─────────────────┘     └─────────────────┘
         │
         ▼
┌─────────────────┐
│   IPFS/Pinata   │
│  (Message Data) │
└─────────────────┘
```

## Project Structure

```
blockmail/
├── packages/
│   ├── app/                    # Electron desktop application
│   │   ├── src/
│   │   │   ├── components/     # React UI (EmailList, ComposeModal, ConnectModal, …)
│   │   │   ├── config/         # Constants & contract config
│   │   │   ├── hooks/          # useWallet, useEmails, useToast
│   │   │   ├── services/       # email, ipfsService, keyRegistry, storage
│   │   │   ├── utils/          # Helpers
│   │   │   ├── App.tsx
│   │   │   ├── main.ts         # Electron main process
│   │   │   ├── preload.ts      # Preload / IPC
│   │   │   └── renderer.tsx    # React entry
│   │   ├── index.html
│   │   └── vite.*.config.mts  # Vite configs (main, preload, renderer)
│   └── contracts/              # Solidity smart contracts
│       ├── contracts/         # BlockMail.sol, KeyRegistry.sol
│       ├── ignition/          # Hardhat Ignition deployment modules
│       ├── scripts/           # deploy.ts
│       └── test/              # Contract tests
├── package.json               # Root workspace scripts
└── README.md
```

## Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0

---

## How to Run the Project (Step by Step)

Follow these steps to run BlockMail manually: from deploying the contracts to starting the Electron app.

### Step 1: Install dependencies

From the repo root:

```bash
npm install
```

### Step 2: Configure the app environment

Create the app env file and set contract addresses and RPC URLs (you’ll fill in the contract addresses after deploying in Step 5):

```bash
cp packages/app/.env.example packages/app/.env
```

Edit `packages/app/.env`. For local development you’ll typically use:

```env
# Contract addresses (update after Step 5 with the addresses printed by the deploy script)
VITE_CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
VITE_KEY_REGISTRY_ADDRESS=0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512

# Local Hardhat node
VITE_RPC_URL=http://127.0.0.1:8545
VITE_WS_URL=ws://127.0.0.1:8545

# Pinata IPFS (get from https://app.pinata.cloud)
VITE_PINATA_JWT=your_pinata_jwt_here
VITE_PINATA_GATEWAY=your_gateway_subdomain.mypinata.cloud
```

### Step 3: Start the local blockchain

In a **first terminal**, start the Hardhat node:

```bash
npm run contracts:node
```

Leave this running. The node will listen at `http://127.0.0.1:8545`.

### Step 4: Deploy the smart contracts

In a **second terminal**, from the repo root, deploy to the local node:

```bash
npm run contracts:deploy:local
```

The script will print something like:

```
BlockMail deployed to: 0x... chainId: 31337
KeyRegistry deployed to: 0x... chainId: 31337
```

### Step 5: Update app env with deployed addresses

Copy the **BlockMail** and **KeyRegistry** addresses from the deploy output into `packages/app/.env`:

- `VITE_CONTRACT_ADDRESS` = BlockMail address
- `VITE_KEY_REGISTRY_ADDRESS` = KeyRegistry address

Save the file.

### Step 6: Start the Electron app

In the same second terminal (or a new one), from the repo root:

```bash
npm run app:start
```

The BlockMail desktop app window should open. You can use the local Hardhat accounts (and their private keys in the Hardhat output) to connect and test.

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
