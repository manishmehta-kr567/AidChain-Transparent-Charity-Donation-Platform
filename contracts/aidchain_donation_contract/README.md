# AidChain Donation Contract (Soroban)

On-chain source of truth for AidChain campaign state. Real XLM transfers
happen as native Stellar payment operations (donor wallet → NGO wallet);
this contract mirrors and enforces the *accounting* around those transfers.

## Why a contract at all, if payments are native XLM transfers?

Native Stellar payments move money but carry no application logic. This
contract adds the guarantees a donation platform needs:

- A campaign can't silently be double-created under the same ID.
- Donations can only be recorded against campaigns that are `Active` or
  `Funded` — never `Closed`/`Completed`.
- An NGO can never record expenses that exceed what was actually raised
  (checked cumulatively, not just per-call).
- Donor counts reflect *unique* contributors, not donation events.
- Every state change emits an event, giving an auditable on-chain log
  independent of the MongoDB mirror.

## Functions

| Function | Auth required | Description |
|---|---|---|
| `initialize(admin)` | admin | One-time setup, stores platform admin address |
| `create_campaign(campaign_id, ngo_wallet, target_amount)` | ngo_wallet | Registers a new campaign, status → `Active` |
| `donate(campaign_id, donor_wallet, amount)` | donor_wallet | Records a donation, updates totals + donor count |
| `add_expense(campaign_id, ngo_wallet, amount, proof_hash)` | ngo_wallet (must be campaign owner) | Records an expense, rejects if it would exceed total raised |
| `get_campaign(campaign_id)` | none (read-only) | Returns full campaign state |
| `get_total_donations(campaign_id)` | none (read-only) | Returns running donation total |
| `get_expense(campaign_id, index)` | none (read-only) | Returns one expense record |
| `get_expense_count(campaign_id)` | none (read-only) | Number of expense records |
| `close_campaign(campaign_id, caller)` | ngo owner or admin | Marks campaign `Closed`, blocks further donations/expenses |

## Status state machine

```
Created --create_campaign--> Active
Active --donate (total >= target)--> Funded
Funded --add_expense (fully spent)--> Completed
Active/Funded --close_campaign--> Closed
```

`Created` is defined for completeness with the spec but in practice
`create_campaign` sets the campaign directly to `Active`, since a campaign
only reaches the chain after off-chain admin approval (see backend
`PATCH /api/campaigns/:id/approve`) — by the time it's on-chain it's
already open for donations.

## Building

```bash
rustup target add wasm32-unknown-unknown
cargo build --target wasm32-unknown-unknown --release
```

The optimized WASM will be at:
```
target/wasm32-unknown-unknown/release/aidchain_donation_contract.wasm
```

Optionally strip further with `soroban contract optimize`:
```bash
stellar contract optimize --wasm target/wasm32-unknown-unknown/release/aidchain_donation_contract.wasm
```

## Testing

```bash
cargo test
```

Tests in `src/test.rs` cover: duplicate campaign IDs, invalid/negative
amounts, donations to nonexistent or closed campaigns, unique-donor
counting, the Active→Funded→Completed transition, expense-exceeds-raised
(both single-call and cumulative), unauthorized expense/close attempts,
and admin vs. owner close permissions.

> **Note:** this contract was written against `soroban-sdk = "21.7.4"`.
> Run `cargo test` locally before deploying — a Rust toolchain was not
> available in the environment this was generated in, so compilation has
> not been verified end-to-end. If you're on a different soroban-sdk
> version, check the [Soroban docs](https://developers.stellar.org/docs/build/smart-contracts)
> for API changes to `#[contractevent]`, `env.register`, or the
create_campaign(campaign_id, ngo_wallet, target_amount)   ...
> generated test client (`try_*` methods).

## Deploying to Stellar Testnet

```bash
# 1. Configure the testnet network (once)
stellar network add testnet \
  --rpc-url https://soroban-testnet.stellar.org:443 \
  --network-passphrase "Test SDF Network ; September 2015"

# 2. Create/fund a deployer identity
stellar keys generate deployer --network testnet
stellar keys fund deployer --network testnet

# 3. Deploy
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/aidchain_donation_contract.wasm \
  --source deployer \
  --network testnet

# Save the returned CONTRACT_ID -> backend .env CONTRACT_ID
# and frontend .env VITE_CONTRACT_ID

# 4. Initialize
stellar contract invoke \
  --id <CONTRACT_ID> \
  --source deployer \
  --network testnet \
  -- initialize --admin <ADMIN_PUBLIC_KEY>
```

## Example invocations

```bash
# Create a campaign
stellar contract invoke --id <CONTRACT_ID> --source ngo_identity --network testnet \
  -- create_campaign --campaign_id 1 --ngo_wallet <NGO_PUBLIC_KEY> --target_amount 10000000000

# Donate (1000 XLM = 1000 * 10^7 stroops)
stellar contract invoke --id <CONTRACT_ID> --source donor_identity --network testnet \
  -- donate --campaign_id 1 --donor_wallet <DONOR_PUBLIC_KEY> --amount 10000000000

# Read campaign state
stellar contract invoke --id <CONTRACT_ID> --source donor_identity --network testnet \
  -- get_campaign --campaign_id 1
```
