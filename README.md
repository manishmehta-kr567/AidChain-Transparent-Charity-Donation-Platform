# AidChain — Transparent NGO Donation Platform on Stellar

> A donation platform where every gift and every dollar spent is verifiable on-chain.

## 1. Project Overview

AidChain lets NGOs create fundraising campaigns and lets donors fund them with
native XLM payments on the Stellar network, wallet-to-wallet, with no
custodial intermediary. Every donation transaction hash and every expense
proof is recorded both in the platform's database and on a Soroban smart
contract, so the platform's reported numbers can be independently checked
against the blockchain.

## 2. Problem Statement

Donors rarely have a reliable way to confirm that their contribution reached
its destination or was spent as promised. Traditional platforms rely on
periodic, self-reported financial statements — by the time discrepancies
surface, trust is already damaged. This opacity discourages giving and lets
genuinely well-run NGOs get lumped in with badly-run ones.

## 3. Why Stellar

- **Low fees, fast settlement** — a donation confirms in seconds for a
  fraction of a cent, making even small donations practical.
- **Native asset transfers** — XLM payments are a first-class primitive, so
  the "transfer of value" doesn't need a custom token or a custodial wallet.
- **Soroban smart contracts** — let us encode real invariants (an NGO can
  never report spending more than it raised) rather than trusting a
  database record that anyone with admin access could edit.
- **Public, permissionless ledger** — anyone, not just the platform, can
  verify a transaction happened via Horizon or a block explorer.

## 4. Features

- NGO registration, campaign creation, and admin approval workflow
- Freighter wallet connect, network verification, and transaction signing
- Native XLM donations verified server-side against Stellar Horizon
- Soroban contract tracking campaign totals, donor counts, and expense proofs
- Expense proof gallery with image + SHA-256 hash per expense
- Campaign progress bars, donation timeline, NGO verification badges
- Donor dashboard with personal impact and donation history
- Admin dashboard with platform stats, campaign approval/rejection, risk flags
- CSV export of donations, QR code sharing for campaigns
- Dark mode, mobile-responsive UI, loading skeletons, toasts, empty/error states
- PostHog analytics and Sentry error monitoring (frontend + backend)

## 5. Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, TypeScript, Tailwind CSS |
| Backend | Node.js, Express, TypeScript |
| Database | MongoDB Atlas + Mongoose |
| Wallet | Freighter |
| Blockchain | Stellar Testnet (native payments + Soroban) |
| Smart Contract | Soroban (Rust) |
| Image storage | Cloudinary |
| Analytics | PostHog |
| Monitoring | Sentry |
| Deployment | Vercel (frontend), Render (backend) |

## 6. Architecture

```
┌─────────────┐      REST API      ┌─────────────┐      Mongoose      ┌──────────────┐
│   Frontend   │ ─────────────────▶ │   Backend   │ ──────────────────▶ │ MongoDB Atlas │
│ React+Vite   │ ◀───────────────── │ Express+TS  │ ◀────────────────── │              │
└──────┬───────┘                    └──────┬──────┘                    └──────────────┘
       │                                    │
       │ Freighter sign            Horizon verify (server-side)
       ▼                                    ▼
┌──────────────┐                   ┌──────────────────┐
│ Stellar       │ ◀──────────────▶ │ Stellar Horizon   │
│ Testnet       │   native payment │ Testnet API       │
└──────┬───────┘                   └──────────────────┘
       │
       ▼
┌───────────────────────────┐
│ Soroban Donation Contract  │  (campaign state, donor counts, expense hashes)
└───────────────────────────┘
```

## 7. Data Flow

1. NGO registers, connects a Freighter wallet, creates a campaign (`pending`).
2. Admin approves the campaign (`active`) and optionally registers it on-chain
   via `create_campaign`.
3. Donor connects Freighter, picks an amount, and signs a **native XLM
   payment** straight to the NGO's wallet.
4. Frontend submits the signed transaction to Stellar Horizon testnet.
5. Frontend calls `POST /api/donations` with the resulting `txHash`.
6. **Backend independently re-verifies** the transaction against Horizon
   (correct amount, correct source/destination, successful) before writing
   anything — the client's claimed amount is never trusted directly.
7. Campaign `raisedAmount` updates; donation is saved with `status: success`.
8. NGO uploads an expense proof image; backend hashes it (SHA-256) and stores
   both the Cloudinary URL and the hash.
9. Donors view the expense in the proof gallery and can compare the hash
   against what's recorded on the Soroban contract.

## 8. Smart Contract Explanation

See [`contracts/aidchain_donation_contract/README.md`](contracts/aidchain_donation_contract/README.md)
for full details. Summary: the contract tracks each campaign's target,
running total donated, running total expensed, and unique donor count. It
enforces that expenses can never cumulatively exceed what was actually
raised, and that only the campaign's own NGO wallet can record expenses or
close the campaign (the platform admin can also force-close). All state
changes emit events for independent auditability.

## 9. Local Setup

### Prerequisites
- Node.js 18+
- A MongoDB Atlas cluster (or local MongoDB **replica set** — donation writes
  use a Mongo transaction, which requires replica-set mode, not standalone)
- A Cloudinary account (free tier is fine)
- Rust + `wasm32-unknown-unknown` target + Stellar CLI (`stellar-cli`) for the contract
- [Freighter](https://www.freighter.app) browser extension, set to Testnet

### Backend
```bash
cd backend
npm install
cp .env.example .env   # fill in values, see section 10
npm run dev             # http://localhost:5000
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env   # fill in values, see section 10
npm run dev             # http://localhost:5173
```

### Contract
```bash
cd contracts/aidchain_donation_contract
cargo test                                          # run unit tests first
rustup target add wasm32-unknown-unknown
cargo build --target wasm32-unknown-unknown --release
```

## 10. Environment Variables

### Frontend (`frontend/.env`)
```
VITE_API_URL=http://localhost:5000/api
VITE_STELLAR_NETWORK=testnet
VITE_STELLAR_RPC_URL=https://soroban-testnet.stellar.org
VITE_CONTRACT_ID=
VITE_POSTHOG_KEY=
VITE_POSTHOG_HOST=https://us.i.posthog.com
VITE_SENTRY_DSN=
```

### Backend (`backend/.env`)
```
PORT=5000
MONGO_URI=
JWT_SECRET=
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
SENTRY_DSN=
NODE_ENV=development
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
STELLAR_NETWORK=testnet
STELLAR_RPC_URL=https://soroban-testnet.stellar.org
STELLAR_HORIZON_URL=https://horizon-testnet.stellar.org
CONTRACT_ID=
```

## 11. API Routes

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | — | Register donor/NGO |
| POST | `/api/auth/login` | — | Login |
| GET | `/api/auth/me` | JWT | Current user |
| PATCH | `/api/users/wallet` | JWT | Link Stellar wallet |
| POST | `/api/campaigns` | JWT (NGO) | Create campaign |
| GET | `/api/campaigns` | — | List/search/filter campaigns |
| GET | `/api/campaigns/:id` | — | Campaign detail |
| PATCH | `/api/campaigns/:id` | JWT (owner NGO) | Edit pending campaign |
| PATCH | `/api/campaigns/:id/approve` | JWT (admin) | Approve campaign |
| PATCH | `/api/campaigns/:id/reject` | JWT (admin) | Reject campaign |
| PATCH | `/api/campaigns/:id/flag` | JWT (admin) | Risk-flag a campaign |
| POST | `/api/donations` | JWT (donor) | Record a verified donation |
| GET | `/api/donations/user` | JWT (donor) | My donations |
| GET | `/api/donations/campaign/:campaignId` | — | Campaign's donations |
| POST | `/api/expenses` | JWT (owner NGO), multipart | Add expense + proof |
| GET | `/api/expenses/campaign/:campaignId` | — | Campaign's expenses |
| POST | `/api/feedback` | JWT | Submit feedback |
| GET | `/api/admin/stats` | JWT (admin) | Platform-wide stats |

## 12. Contract Deployment Guide

Full walkthrough in [`contracts/aidchain_donation_contract/README.md`](contracts/aidchain_donation_contract/README.md).
Quick version:

```bash
stellar network add testnet \
  --rpc-url https://soroban-testnet.stellar.org:443 \
  --network-passphrase "Test SDF Network ; September 2015"
stellar keys generate deployer --network testnet
stellar keys fund deployer --network testnet
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/aidchain_donation_contract.wasm \
  --source deployer --network testnet
stellar contract invoke --id <CONTRACT_ID> --source deployer --network testnet \
  -- initialize --admin <ADMIN_PUBLIC_KEY>
```

Save the resulting `CONTRACT_ID` into both `backend/.env` and `frontend/.env`.

> **Recommended:** after deploying, run
> `stellar contract bindings typescript --id <CONTRACT_ID> --network testnet`
> and use the generated typed client in `frontend/src/services/contract.ts`
> instead of the placeholder `Spec([])` client shipped here — see the note
> at the bottom of that file.

## 13. Deployment Guide

### MongoDB Atlas
1. Create a free cluster at [mongodb.com/atlas](https://www.mongodb.com/atlas).
2. Add a database user and allow network access from `0.0.0.0/0` (or Render's IPs).
3. Copy the connection string into `MONGO_URI`.

### Cloudinary
1. Create a free account at [cloudinary.com](https://cloudinary.com).
2. Copy Cloud Name, API Key, API Secret from the dashboard into `backend/.env`.

### Backend → Render
1. Push this repo to GitHub.
2. New Web Service on Render, root directory `backend`.
3. Build command: `npm install && npm run build`. Start command: `npm start`.
4. Add all backend env vars in Render's dashboard.

### Frontend → Vercel
1. Import the repo in Vercel, root directory `frontend`.
2. Framework preset: Vite.
3. Add all `VITE_*` env vars in Vercel's dashboard (pointing `VITE_API_URL`
   at your deployed Render URL).
4. Deploy.

### Stellar Testnet
Already covered in section 12 — no separate hosting needed, the contract
lives on the public Stellar testnet ledger once deployed.

## 14. Screenshots

> _Add screenshots here before submission:_
- [ ] Landing page (desktop)
- [ ] Campaign listing + filters
- [ ] Campaign detail page with progress bar and timeline
- [ ] Donate modal / Freighter signing prompt
- [ ] Donor dashboard
- [ ] NGO dashboard
- [ ] Admin dashboard
- [ ] Mobile responsive views (3-4 key pages)
- [ ] PostHog analytics dashboard
- [ ] Sentry issue dashboard

## 15. Demo Video

> _Add a Loom/YouTube link here showing: register → connect wallet → create
> campaign → admin approve → donate → view receipt → add expense proof →
> view proof gallery._

## 16. Contract Address

> `CONTRACT_ID = <fill in after deployment>`
> View on [Stellar Expert (testnet)](https://stellar.expert/explorer/testnet)

## 17. Proof of 10+ User Wallet Interactions

> _After testing, paste Stellar Expert links or Horizon API responses for
> at least 10 distinct wallet interactions (donations, campaign creation
> invocations, expense additions) here, e.g.:_
> - `https://stellar.expert/explorer/testnet/tx/<hash1>`
> - `https://stellar.expert/explorer/testnet/tx/<hash2>`
> - ... (10+)

## 18. User Feedback Summary

> _After collecting feedback via the in-app Feedback page, summarize here,
> e.g. "12 responses, average rating 4.3/5. Common praise: transparency of
> expense tracking. Common request: support for assets other than XLM."_

## 19. Future Roadmap

- Multi-asset donations (USDC on Stellar) alongside native XLM
- Recurring/subscription donations
- Mainnet migration path with KYC for NGO payout wallets
- On-chain NGO verification via attestation/credential registry
- Automated anomaly detection for risk flagging (unusual withdrawal patterns)
- Mobile app (React Native) sharing the same backend

---

## Known Limitations / Before You Deploy

- The Soroban contract and the Node/TypeScript backend were written in an
  environment without network access or a Rust toolchain, so `cargo test`
  and `npm run build` were **not executed** as part of generating this
  project. Run both locally before deploying — the code follows current
  soroban-sdk 21.x and Node 18+/Express 4 APIs, but a real compile pass is
  the actual gate, not a claim in this README.
- Mongo transactions in `donationController.ts` require a MongoDB replica
  set (MongoDB Atlas provides this by default). A standalone local `mongod`
  will throw on `session.withTransaction`.
- `frontend/src/services/contract.ts` ships with a placeholder empty
  contract spec for read calls; swap in the generated TypeScript bindings
  (`stellar contract bindings typescript`) after you deploy the contract.
