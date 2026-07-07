#![no_std]

//! AidChain Donation Contract
//!
//! Tracks NGO donation campaigns on Stellar (Soroban). Actual XLM transfers
//! happen as native Stellar payment operations submitted from the frontend;
//! this contract is the transparent source of truth for campaign state,
//! aggregate donation totals, donor contribution counts, and expense proof
//! hashes. The backend mirrors this state into MongoDB for fast reads, but
//! this contract is the canonical, auditable record.

use soroban_sdk::{
    contract, contracterror, contractevent, contractimpl, contracttype, Address, Bytes, Env,
    String, Symbol,
};

/// Lifecycle of a campaign as required by the spec.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum CampaignStatus {
    Created,
    Active,
    Funded,
    Completed,
    Closed,
}

#[contracttype]
#[derive(Clone, Debug)]
pub struct Campaign {
    pub campaign_id: u64,
    pub ngo_wallet: Address,
    pub target_amount: i128,
    pub total_donated: i128,
    pub total_expensed: i128,
    pub donor_count: u32,
    pub status: CampaignStatus,
}

#[contracttype]
#[derive(Clone, Debug)]
pub struct ExpenseRecord {
    pub campaign_id: u64,
    pub ngo_wallet: Address,
    pub amount: i128,
    pub proof_hash: Bytes,
    pub timestamp: u64,
}

/// Storage keys. Campaigns and per-donor flags are stored under distinct
/// namespaces to keep reads cheap and avoid key collisions.
#[contracttype]
pub enum DataKey {
    Campaign(u64),
    /// Whether a given donor address has already contributed to a campaign,
    /// used so donor_count reflects unique contributors, not donation count.
    HasDonated(u64, Address),
    ExpenseCount(u64),
    Expense(u64, u32),
    Admin,
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
pub enum ContractError {
    NotInitialized = 1,
    AlreadyInitialized = 2,
    CampaignAlreadyExists = 3,
    CampaignNotFound = 4,
    InvalidAmount = 5,
    CampaignNotActive = 6,
    CampaignClosed = 7,
    ExpenseExceedsRaised = 8,
    Unauthorized = 9,
    Overflow = 10,
}

#[contractevent]
#[derive(Clone, Debug)]
pub struct CampaignCreated {
    pub campaign_id: u64,
    pub ngo_wallet: Address,
    pub target_amount: i128,
}

#[contractevent]
#[derive(Clone, Debug)]
pub struct DonationReceived {
    pub campaign_id: u64,
    pub donor_wallet: Address,
    pub amount: i128,
    pub total_donated: i128,
}

#[contractevent]
#[derive(Clone, Debug)]
pub struct ExpenseAdded {
    pub campaign_id: u64,
    pub ngo_wallet: Address,
    pub amount: i128,
    pub proof_hash: Bytes,
}

#[contractevent]
#[derive(Clone, Debug)]
pub struct CampaignClosed {
    pub campaign_id: u64,
}

const LEDGER_BUMP: u32 = 120_960; // ~7 days at 5s/ledger, extend on write
const LEDGER_TTL_THRESHOLD: u32 = 100_800;

#[contract]
pub struct AidChainDonationContract;

#[contractimpl]
impl AidChainDonationContract {
    /// One-time setup. Stores the admin address (e.g. the platform's backend
    /// signer or a multisig) that is allowed to force-close campaigns.
    pub fn initialize(env: Env, admin: Address) -> Result<(), ContractError> {
        if env.storage().instance().has(&DataKey::Admin) {
            return Err(ContractError::AlreadyInitialized);
        }
        admin.require_auth();
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().extend_ttl(LEDGER_TTL_THRESHOLD, LEDGER_BUMP);
        Ok(())
    }

    /// Creates a new campaign on-chain. Must be called by the NGO wallet
    /// that will receive funds. `campaign_id` is generated off-chain
    /// (Mongo ObjectId hashed to u64, or an incrementing counter) and must
    /// be unique — this call fails loudly rather than silently overwriting.
    pub fn create_campaign(
        env: Env,
        campaign_id: u64,
        ngo_wallet: Address,
        target_amount: i128,
    ) -> Result<(), ContractError> {
        ngo_wallet.require_auth();

        if target_amount <= 0 {
            return Err(ContractError::InvalidAmount);
        }

        let key = DataKey::Campaign(campaign_id);
        if env.storage().persistent().has(&key) {
            return Err(ContractError::CampaignAlreadyExists);
        }

        let campaign = Campaign {
            campaign_id,
            ngo_wallet: ngo_wallet.clone(),
            target_amount,
            total_donated: 0,
            total_expensed: 0,
            donor_count: 0,
            status: CampaignStatus::Active,
        };

        env.storage().persistent().set(&key, &campaign);
        env.storage()
            .persistent()
            .extend_ttl(&key, LEDGER_TTL_THRESHOLD, LEDGER_BUMP);

        CampaignCreated {
            campaign_id,
            ngo_wallet,
            target_amount,
        }
        .publish(&env);

        Ok(())
    }

    /// Records a donation against a campaign. This does NOT move funds —
    /// the actual XLM payment is a separate native Stellar operation signed
    /// by the donor via Freighter. This call is made by the backend (or the
    /// donor, in a combined invoke) immediately after that payment succeeds,
    /// so the on-chain ledger of campaign totals stays in sync with reality.
    pub fn donate(
        env: Env,
        campaign_id: u64,
        donor_wallet: Address,
        amount: i128,
    ) -> Result<i128, ContractError> {
        donor_wallet.require_auth();

        if amount <= 0 {
            return Err(ContractError::InvalidAmount);
        }

        let key = DataKey::Campaign(campaign_id);
        let mut campaign: Campaign = env
            .storage()
            .persistent()
            .get(&key)
            .ok_or(ContractError::CampaignNotFound)?;

        match campaign.status {
            CampaignStatus::Active | CampaignStatus::Funded => {}
            CampaignStatus::Created => return Err(ContractError::CampaignNotActive),
            CampaignStatus::Completed | CampaignStatus::Closed => {
                return Err(ContractError::CampaignClosed)
            }
        }

        campaign.total_donated = campaign
            .total_donated
            .checked_add(amount)
            .ok_or(ContractError::Overflow)?;

        let donated_key = DataKey::HasDonated(campaign_id, donor_wallet.clone());
        let already_donated = env.storage().persistent().has(&donated_key);
        if !already_donated {
            env.storage().persistent().set(&donated_key, &true);
            env.storage()
                .persistent()
                .extend_ttl(&donated_key, LEDGER_TTL_THRESHOLD, LEDGER_BUMP);
            campaign.donor_count = campaign
                .donor_count
                .checked_add(1)
                .ok_or(ContractError::Overflow)?;
        }

        if campaign.total_donated >= campaign.target_amount
            && campaign.status == CampaignStatus::Active
        {
            campaign.status = CampaignStatus::Funded;
        }

        env.storage().persistent().set(&key, &campaign);
        env.storage()
            .persistent()
            .extend_ttl(&key, LEDGER_TTL_THRESHOLD, LEDGER_BUMP);

        DonationReceived {
            campaign_id,
            donor_wallet,
            amount,
            total_donated: campaign.total_donated,
        }
        .publish(&env);

        Ok(campaign.total_donated)
    }

    /// Records an expense proof against a campaign. Enforces that the NGO
    /// can never report having spent more than has actually been raised —
    /// this is the core transparency guarantee of the contract.
    pub fn add_expense(
        env: Env,
        campaign_id: u64,
        ngo_wallet: Address,
        amount: i128,
        proof_hash: Bytes,
    ) -> Result<(), ContractError> {
        ngo_wallet.require_auth();

        if amount <= 0 {
            return Err(ContractError::InvalidAmount);
        }

        let key = DataKey::Campaign(campaign_id);
        let mut campaign: Campaign = env
            .storage()
            .persistent()
            .get(&key)
            .ok_or(ContractError::CampaignNotFound)?;

        if campaign.ngo_wallet != ngo_wallet {
            return Err(ContractError::Unauthorized);
        }

        if campaign.status == CampaignStatus::Closed {
            return Err(ContractError::CampaignClosed);
        }

        let new_total_expensed = campaign
            .total_expensed
            .checked_add(amount)
            .ok_or(ContractError::Overflow)?;

        if new_total_expensed > campaign.total_donated {
            return Err(ContractError::ExpenseExceedsRaised);
        }

        campaign.total_expensed = new_total_expensed;

        let count_key = DataKey::ExpenseCount(campaign_id);
        let count: u32 = env.storage().persistent().get(&count_key).unwrap_or(0);

        let record = ExpenseRecord {
            campaign_id,
            ngo_wallet: ngo_wallet.clone(),
            amount,
            proof_hash: proof_hash.clone(),
            timestamp: env.ledger().timestamp(),
        };

        let expense_key = DataKey::Expense(campaign_id, count);
        env.storage().persistent().set(&expense_key, &record);
        env.storage()
            .persistent()
            .extend_ttl(&expense_key, LEDGER_TTL_THRESHOLD, LEDGER_BUMP);

        let new_count = count.checked_add(1).ok_or(ContractError::Overflow)?;
        env.storage().persistent().set(&count_key, &new_count);
        env.storage()
            .persistent()
            .extend_ttl(&count_key, LEDGER_TTL_THRESHOLD, LEDGER_BUMP);

        if new_total_expensed == campaign.total_donated
            && campaign.total_donated >= campaign.target_amount
        {
            campaign.status = CampaignStatus::Completed;
        }

        env.storage().persistent().set(&key, &campaign);
        env.storage()
            .persistent()
            .extend_ttl(&key, LEDGER_TTL_THRESHOLD, LEDGER_BUMP);

        ExpenseAdded {
            campaign_id,
            ngo_wallet,
            amount,
            proof_hash,
        }
        .publish(&env);

        Ok(())
    }

    /// Read-only fetch of a campaign's full on-chain state.
    pub fn get_campaign(env: Env, campaign_id: u64) -> Result<Campaign, ContractError> {
        env.storage()
            .persistent()
            .get(&DataKey::Campaign(campaign_id))
            .ok_or(ContractError::CampaignNotFound)
    }

    /// Convenience read for just the running donation total.
    pub fn get_total_donations(env: Env, campaign_id: u64) -> Result<i128, ContractError> {
        let campaign: Campaign = env
            .storage()
            .persistent()
            .get(&DataKey::Campaign(campaign_id))
            .ok_or(ContractError::CampaignNotFound)?;
        Ok(campaign.total_donated)
    }

    /// Returns a single expense record by index, so the frontend can page
    /// through a campaign's expense history without an off-chain indexer.
    pub fn get_expense(
        env: Env,
        campaign_id: u64,
        index: u32,
    ) -> Result<ExpenseRecord, ContractError> {
        env.storage()
            .persistent()
            .get(&DataKey::Expense(campaign_id, index))
            .ok_or(ContractError::CampaignNotFound)
    }

    pub fn get_expense_count(env: Env, campaign_id: u64) -> u32 {
        env.storage()
            .persistent()
            .get(&DataKey::ExpenseCount(campaign_id))
            .unwrap_or(0)
    }

    /// Closes a campaign, callable by either the owning NGO or the platform
    /// admin (e.g. in response to a fraud/risk flag). Closed campaigns can
    /// no longer receive donations or new expense records.
    pub fn close_campaign(env: Env, campaign_id: u64, caller: Address) -> Result<(), ContractError> {
        caller.require_auth();

        let key = DataKey::Campaign(campaign_id);
        let mut campaign: Campaign = env
            .storage()
            .persistent()
            .get(&key)
            .ok_or(ContractError::CampaignNotFound)?;

        let admin: Option<Address> = env.storage().instance().get(&DataKey::Admin);
        let is_admin = admin.map(|a| a == caller).unwrap_or(false);
        let is_owner = campaign.ngo_wallet == caller;

        if !is_admin && !is_owner {
            return Err(ContractError::Unauthorized);
        }

        campaign.status = CampaignStatus::Closed;
        env.storage().persistent().set(&key, &campaign);
        env.storage()
            .persistent()
            .extend_ttl(&key, LEDGER_TTL_THRESHOLD, LEDGER_BUMP);

        CampaignClosed { campaign_id }.publish(&env);

        Ok(())
    }

    /// Contract version, exposed for the frontend to display / for CI to
    /// verify the deployed WASM matches the expected build.
    pub fn version(_env: Env) -> Symbol {
        Symbol::short("v1")
    }
}

#[cfg(test)]
mod test;
