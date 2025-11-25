# 🔒 SafeDeal - Decentralized Escrow with Guaranteed Autonomous Execution

<div align="center">

![SafeDeal Banner](https://img.shields.io/badge/SafeDeal-Massa%20Blockchain-00D4AA?style=for-the-badge)
![Smart Contract](https://img.shields.io/badge/Smart%20Contract-AssemblyScript-purple?style=for-the-badge)
![Frontend](https://img.shields.io/badge/Frontend-React%20%2B%20TypeScript-61DAFB?style=for-the-badge)
![Autonomous](https://img.shields.io/badge/Execution-100%25%20Guaranteed-00FF00?style=for-the-badge)

**A trustless escrow platform built on Massa blockchain with GUARANTEED autonomous execution using Deferred Calls**

[Live Demo](#) • [Documentation](#features) • [Smart Contract](#smart-contract-architecture) • [Report Bug](https://github.com/mohamedwael201193/safedeal/issues)

</div>

---

## 📋 Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Live Test Results](#live-test-results)
- [Architecture](#architecture)
- [Smart Contract](#smart-contract-architecture)
- [Technology Stack](#technology-stack)
- [Getting Started](#getting-started)
- [Testing](#testing)
- [Deployment](#deployment)
- [Usage Examples](#usage-examples)
- [Security](#security)
- [Contributing](#contributing)
- [License](#license)

---

## 🌟 Overview

SafeDeal is a **decentralized escrow platform** that eliminates the need for trusted intermediaries in freelance and service agreements. Built on the **Massa blockchain**, SafeDeal leverages **Deferred Calls** to provide **100% guaranteed autonomous execution** - a revolutionary feature that ensures deals are automatically settled at their deadline without any manual intervention.

### Why SafeDeal?

Traditional escrow services require trust in a central authority. Smart contract escrows often rely on unreliable "cron jobs" or manual triggers. **SafeDeal is different**:

✅ **Trustless** - No intermediary can access or freeze funds  
✅ **Guaranteed Execution** - Deferred Calls ensure automatic settlement  
✅ **Transparent** - All logic visible on-chain  
✅ **Flexible** - Auto-release or auto-refund modes  
✅ **Cost-Efficient** - ~0.25 MAS booking fee for guaranteed execution

---

## 🚀 Key Features

### 1. **Guaranteed Autonomous Execution** 🤖

Unlike traditional async calls that may fail, SafeDeal uses **Massa's Deferred Call system**:

- **100% Execution Guarantee**: Booked on-chain, impossible to skip
- **Exact Timing**: Executes at precise blockchain period
- **No External Dependencies**: No keepers, bots, or manual triggers needed
- **Verified Booking**: Deferred Call ID proves execution is scheduled

### 2. **Dual Payment Methods** 💰

- **MAS Native Token**: Direct blockchain currency
- **USDC.e Stablecoin**: Price-stable payments (Massa mainnet)

### 3. **Flexible Deal Modes** ⚙️

| Mode             | Description                                                    | Use Case           |
| ---------------- | -------------------------------------------------------------- | ------------------ |
| **Auto-Release** | Funds automatically go to freelancer if client doesn't dispute | Service delivery   |
| **Auto-Refund**  | Funds return to client if freelancer doesn't claim             | Milestone payments |

### 4. **Real-Time Dashboard** 📊

- Track active deals with countdown timers
- View deal history and status
- Monitor upcoming autonomous executions
- Identicon-based address visualization

### 5. **Smart Security Features** 🛡️

- Client and freelancer must be different addresses
- Funds locked in contract until deadline or explicit release
- Execution reserve ensures booking fees are paid
- Comprehensive event logging for auditability

---

## 📸 Live Test Results

### ✅ Successful Autonomous Executions (Mainnet)

**All deals completed automatically after deadlines - ZERO manual intervention!**

| Deal ID | Amount   | Mode         | Deadline      | Status       | Execution Time |
| ------- | -------- | ------------ | ------------- | ------------ | -------------- |
| #1      | 1.00 MAS | Auto-Release | 17 hours ago  | ✅ Completed | Autonomous     |
| #2      | 2.00 MAS | Auto-Release | 16 hours ago  | ✅ Completed | Autonomous     |
| #3      | 3.00 MAS | Auto-Release | 2 minutes ago | ✅ Completed | Autonomous     |

**Freelancer Wallet Confirmation:**

- Starting balance: 0 MAS
- After executions: **6 MAS received** (1 + 2 + 3 = 6 MAS total)
- All transactions confirmed on Massa Explorer

### Test Script Output

```bash
🧪 SafeDeal Deferred Call Test Script
============================================================
📍 Contract: AS129W76G7vj9GBYyUNMKi7YLmijSWLvEiaKmT2EyZ1NPDJvVtReG
📍 Freelancer: AU12rQ13Pb7B1azLUKzUZJh9vwmtsvMAp6L2kCLeGhpPCdUuJveU

⏰ Getting network time...
   Current period: 28640

📝 Creating deal...
   Amount: 3.0 MAS
   Execution reserve: 1.0 MAS
   Total sending: 4.0 MAS

✅ Transaction finalized

📋 Events received (4):
   • DeferredQuote: bookingFee=244900000 nanoMAS (~0.245 MAS)
   • DeferredScheduled: callId=D1P1516UPySxR4gwMGyJBdS4R6atJvRTMGYSsLQMK92UrHeGCJTbDYdAMpdv7vKrxpkcx
   • DealCreated: autoExecution=scheduled, executionPeriod=3666183

✅ Deal created successfully!
   Execution GUARANTEED at period: 3666183

⏳ Monitoring... (189 periods = ~100 minutes until execution)

[After deadline passed]
🎉 ✅ EXECUTION DETECTED!
   Deal status changed to: Completed
   Freelancer received: 3.00 MAS
   TEST PASSED - Autonomous execution verified!
```

---

## 🏗️ Architecture

### High-Level System Design

```
┌─────────────────────────────────────────────────────────────┐
│                     SafeDeal Platform                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐      ┌──────────────┐                     │
│  │   Client     │      │  Freelancer  │                     │
│  │   Wallet     │      │    Wallet    │                     │
│  └──────┬───────┘      └──────┬───────┘                     │
│         │                     │                              │
│         │  Create Deal        │  Receives Payment            │
│         ├────────────────────►│                              │
│         │  (Amount + Reserve) │                              │
│         │                     │                              │
│  ┌──────▼──────────────────────▼──────┐                     │
│  │     SafeDeal Smart Contract        │                     │
│  │  (AssemblyScript on Massa)         │                     │
│  │                                    │                     │
│  │  ├─ Deal Storage                   │                     │
│  │  ├─ Deferred Call Registration     │                     │
│  │  ├─ Auto-Execution Logic           │                     │
│  │  └─ Event Emission                 │                     │
│  └────────────┬───────────────────────┘                     │
│               │                                              │
│               │  Deferred Call Booking                       │
│               ▼                                              │
│  ┌────────────────────────────────────┐                     │
│  │   Massa Blockchain Network         │                     │
│  │                                    │                     │
│  │  ├─ Deferred Call Queue            │                     │
│  │  ├─ Slot-Based Scheduling          │                     │
│  │  └─ Guaranteed Execution Engine    │                     │
│  └────────────┬───────────────────────┘                     │
│               │                                              │
│               │  Executes at exact slot                      │
│               ▼                                              │
│  ┌────────────────────────────────────┐                     │
│  │   processDeal() Auto-Triggered     │                     │
│  │                                    │                     │
│  │  ├─ Check deadline passed          │                     │
│  │  ├─ Execute deal logic             │                     │
│  │  └─ Transfer funds to freelancer   │                     │
│  └────────────────────────────────────┘                     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Component Breakdown

#### 1. **Smart Contract** (`contracts/assembly/contracts/safedeal.ts`)

- **Language**: AssemblyScript (compiles to WebAssembly)
- **Functions**:
  - `createDealForMAS()` - Create deal with native MAS
  - `createDealForToken()` - Create deal with USDC.e
  - `processDeal()` - Autonomous execution handler
  - `getDeal()` - Query deal details
  - `getUserDeals()` - Get all user deals
  - `releaseFunds()` - Manual early release
  - `refundDeal()` - Manual refund (client only)

#### 2. **Frontend** (`web/`)

- **Framework**: React 18 + TypeScript
- **Routing**: React Router v6
- **Styling**: Tailwind CSS + shadcn/ui
- **Wallet**: Massa Station integration via WalletContext
- **State Management**: React Hooks

#### 3. **Scripts** (`scripts/`)

- **Deployment**: `src/deploy.ts` - Deploy contract to mainnet
- **Testing**: `src/test-deferred-auto.ts` - Verify autonomous execution
- **Verification**: `src/verify-execution.ts` - Check deal status

---

## 🔧 Smart Contract Architecture

### Core Constants

```typescript
// Deferred call parameters for GUARANTEED execution
const MAX_GAS_FOR_EXECUTION: u64 = 20_000_000; // 20M gas
const EXECUTION_RESERVE: u64 = 1_000_000_000; // 1.0 MAS reserve
const EXECUTION_BUFFER_PERIODS: u64 = 1; // Execute 1 period after deadline

// USDC.e stablecoin address on Massa mainnet
const USDCE_TOKEN_ADDRESS =
  "AS1hCJXjndR4c9vekLWsXGnrdigp4AaZ7uYG3UKFzzKnWVsrNLPJ";
```

### Deal Structure

```typescript
class Deal {
  id: u64; // Unique deal identifier
  clientAddress: string; // Client wallet address
  freelancerAddress: string; // Freelancer wallet address
  assetType: AssetType; // MAS or Token
  tokenAddress: string; // Token contract (if applicable)
  amount: u64; // Deal amount in nanoMAS or token units
  deadlineSlot: u64; // Period when deal expires
  mode: DealMode; // AutoRelease or AutoRefund
  status: DealStatus; // Current state
  note: string; // Optional description
}
```

### Status Flow

```
Pending (0)  ──────────►  Active (1)  ──────────►  Completed (2)
                              │
                              ├──────────►  Refunded (3)
                              │
                              ├──────────►  Disputed (4)
                              │
                              └──────────►  Expired (5)
```

### Deferred Call Workflow

```typescript
// 1. Quote booking fee
const bookingFee = deferredCallQuote(
  targetSlot, // Execution period
  MAX_GAS_FOR_EXECUTION,
  paramsSize
);

// 2. Register guaranteed execution
const deferredCallId = deferredCallRegister(
  contractAddress,
  "processDeal", // Function to call
  targetSlot, // Exact execution slot
  MAX_GAS_FOR_EXECUTION,
  processDealParams, // [dealId]
  0 // No coins transfer during execution
);

// 3. Emit confirmation event
generateEvent("DeferredScheduled: callId=" + deferredCallId + " (GUARANTEED)");
```

### Security Measures

1. **Address Validation**: Client ≠ Freelancer
2. **Amount Validation**: Must send > EXECUTION_RESERVE
3. **Deadline Validation**: Must be future period
4. **Double-Execution Prevention**: Check deal status before processing
5. **Authorization Checks**: Only client can refund, only freelancer can claim

---

## 🛠️ Technology Stack

### Blockchain Layer

- **Blockchain**: [Massa](https://massa.net/) - Truly decentralized L1
- **Smart Contracts**: AssemblyScript → WebAssembly
- **Execution**: Deferred Calls (guaranteed autonomous execution)
- **SDK**: @massalabs/massa-as-sdk v3.0.2

### Frontend

- **Framework**: React 18.3.1
- **Language**: TypeScript 5.6
- **Build Tool**: Vite 6.0
- **Styling**: Tailwind CSS 3.4 + shadcn/ui
- **Wallet Integration**: @massalabs/wallet-provider
- **HTTP Client**: @massalabs/massa-web3 v5.2.1-dev

### Development Tools

- **Package Manager**: npm / bun
- **Contract Compiler**: massa-as-compile
- **Testing**: Custom TypeScript scripts
- **Deployment**: Massa mainnet RPC

---

## 🚀 Getting Started

### Prerequisites

```bash
# Required
Node.js >= 18.0.0
npm >= 9.0.0

# Optional (for faster builds)
bun >= 1.0.0
```

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/mohamedwael201193/safedeal.git
cd safedeal

# 2. Install root dependencies
npm install

# 3. Install contract dependencies
cd contracts
npm install

# 4. Install frontend dependencies
cd ../web
npm install

# 5. Install scripts dependencies
cd ../scripts
npm install
```

### Configuration

#### Smart Contract Environment

Create `scripts/.env`:

```bash
# Massa Network
MASSA_NETWORK=MainNet

# Wallet (NEVER commit real keys!)
DEPLOYER_SECRET_KEY=S1your_private_key_here
PRIVATE_KEY=S1your_private_key_here

# Contract Address (auto-updated after deployment)
SAFEDEAL_CONTRACT_ADDRESS=AS1...

# Optional: Custom RPC
MASSA_RPC_URL=
```

#### Frontend Environment

Create `web/.env`:

```bash
VITE_CONTRACT_ADDRESS=AS1...
VITE_MASSA_NETWORK=mainnet
```

---

## 🧪 Testing

### Unit Tests

```bash
# Run contract compilation test
cd contracts
npm run build

# Expected output:
# ✓ 5 files compiled successfully
# ✓ safedeal.ts → 30.7 KB wasm
```

### Integration Test - Autonomous Execution

```bash
cd scripts

# Test deferred call execution (GUARANTEED)
npx ts-node src/test-deferred-auto.ts
```

**Test Flow:**

1. Connects to Massa mainnet
2. Creates deal with 3 MAS + 1 MAS reserve
3. Registers deferred call for autonomous execution
4. Monitors deal status every 15 seconds
5. Verifies execution occurred automatically
6. Confirms freelancer received funds

**Expected Output:**

```
🧪 SafeDeal Deferred Call Test Script
✅ Deal created successfully!
   Deferred Call ID: D1P1516UPy...
   Execution GUARANTEED at period: 3666183
👀 Monitoring for autonomous execution...
   ⏰ Current period: 3665993 (deadline: 3666182)
   ...
   ⏰ Current period: 3666183
🎉 ✅ EXECUTION DETECTED!
   Deal status: Completed
   TEST PASSED
```

### Verification Script

```bash
# Check if deal executed
npx ts-node src/verify-execution.ts
```

---

## 📦 Deployment

### Deploy to Massa Mainnet

```bash
cd scripts

# 1. Ensure .env has DEPLOYER_SECRET_KEY and sufficient MAS balance

# 2. Deploy contract
npx ts-node src/deploy.ts

# Expected output:
# ✅ Contract deployed successfully!
# 📍 Contract Address: AS1...
# 💰 Deployer Balance: 922.81 MAS
```

### Deploy Frontend

```bash
cd web

# 1. Build production bundle
npm run build

# 2. Deploy to DeWeb (Massa decentralized web)
# Follow: https://docs.massa.net/docs/deweb/getting-started

# Or deploy to traditional hosting:
# - Vercel: vercel --prod
# - Netlify: netlify deploy --prod
```

---

## 📖 Usage Examples

### Example 1: Create Escrow Deal (MAS)

```typescript
import { Account, Args, Mas } from "@massalabs/massa-web3";

const createDeal = async () => {
  const account = await Account.fromEnv();
  const contract = new SmartContract(provider, CONTRACT_ADDRESS);

  const args = new Args()
    .addString(freelancerAddress) // Freelancer wallet
    .addU64(BigInt(3666500)) // Deadline period
    .addU8(BigInt(0)) // Mode: Auto-release
    .addString("Website redesign"); // Note

  const operation = await contract.call("createDealForMAS", args, {
    coins: Mas.fromString("4.0"), // 3.0 deal + 1.0 reserve
    maxGas: BigInt(10_000_000),
  });

  await operation.waitSpeculativeExecution();
  console.log("✅ Deal created with guaranteed execution!");
};
```

### Example 2: Create Escrow Deal (USDC.e)

```typescript
const createTokenDeal = async () => {
  // 1. Approve token spending first
  await approveToken(CONTRACT_ADDRESS, amount);

  // 2. Create deal
  const args = new Args()
    .addString(freelancerAddress)
    .addU64(BigInt(100_000_000)) // 100 USDC.e (6 decimals)
    .addU64(BigInt(deadline))
    .addU8(BigInt(1)) // Mode: Auto-refund
    .addString("Logo design");

  await contract.call("createDealForToken", args, {
    coins: Mas.fromString("1.0"), // Execution reserve only
  });
};
```

### Example 3: Manual Early Release

```typescript
const releaseFundsEarly = async (dealId: number) => {
  const args = new Args().addU64(BigInt(dealId));

  await contract.call("releaseFunds", args, {
    maxGas: BigInt(5_000_000),
  });

  console.log("✅ Funds released early to freelancer");
};
```

---

## 🔐 Security

### Audit Status

⚠️ **This contract has NOT been professionally audited.** Use at your own risk, especially for large amounts.

### Security Best Practices

✅ **Implemented:**

- Input validation on all functions
- Reentrancy protection via status checks
- Address uniqueness validation
- Deadline validation
- Amount overflow protection
- Event logging for transparency

⚠️ **Recommendations for Production:**

- Professional security audit
- Formal verification of critical paths
- Bug bounty program
- Gradual rollout with amount caps
- Multi-sig admin controls

### Known Limitations

1. **Period Mismatch**: SDK's `currentCycle` ≠ Contract's `currentPeriod()` (workaround implemented)
2. **Booking Fee Variation**: Deferred call fees fluctuate based on network congestion
3. **Max Future Slot**: Deferred calls have maximum future booking limit (~2 weeks)
4. **No Dispute Resolution**: Disputed deals require off-chain arbitration

---

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

### Development Workflow

```bash
# 1. Fork the repository
# 2. Create feature branch
git checkout -b feature/amazing-feature

# 3. Make changes and test
npm run build    # Compile contract
npm test         # Run tests

# 4. Commit with clear message
git commit -m "Add: amazing feature description"

# 5. Push and create Pull Request
git push origin feature/amazing-feature
```

### Code Style

- **TypeScript**: Follow Airbnb style guide
- **AssemblyScript**: Follow official conventions
- **Commits**: Use conventional commits (feat:, fix:, docs:, etc.)

### Reporting Bugs

Please include:

- Environment details (OS, Node version, network)
- Steps to reproduce
- Expected vs actual behavior
- Relevant logs/screenshots

---

## 📄 License

MIT License

Copyright (c) 2025 SafeDeal Team

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

---

## 🙏 Acknowledgments

- **Massa Labs** - For the revolutionary autonomous smart contract platform
- **Deferred Calls** - First blockchain to provide guaranteed execution
- **shadcn/ui** - Beautiful React component library
- **Tailwind CSS** - Utility-first CSS framework
- **Open Source Community** - For inspiration and support

---

## 📞 Contact & Links

- **GitHub**: [@mohamedwael201193](https://github.com/mohamedwael201193)
- **Contract Address**: `AS129W76G7vj9GBYyUNMKi7YLmijSWLvEiaKmT2EyZ1NPDJvVtReG`
- **Massa Explorer**: [View Contract](https://explorer.massa.net/mainnet/address/AS129W76G7vj9GBYyUNMKi7YLmijSWLvEiaKmT2EyZ1NPDJvVtReG)
- **Documentation**: [Massa Docs](https://docs.massa.net/)

---

<div align="center">

**Built with ❤️ on Massa Blockchain**

_The first truly decentralized escrow with guaranteed autonomous execution_

⭐ Star this repo if you find it useful! ⭐

</div>
