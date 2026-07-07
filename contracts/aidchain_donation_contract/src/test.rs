#![cfg(test)]

use super::*;
use soroban_sdk::{bytes, testutils::Address as _, Env};

fn setup(env: &Env) -> (AidChainDonationContractClient<'_>, Address, Address) {
    env.mock_all_auths();
    let contract_id = env.register(AidChainDonationContract, ());
    let client = AidChainDonationContractClient::new(env, &contract_id);
    let admin = Address::generate(env);
    client.initialize(&admin);
    let ngo = Address::generate(env);
    (client, admin, ngo)
}

#[test]
fn test_initialize_twice_fails() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(AidChainDonationContract, ());
    let client = AidChainDonationContractClient::new(&env, &contract_id);
    let admin = Address::generate(&env);

    client.initialize(&admin);
    let result = client.try_initialize(&admin);
    assert_eq!(result, Err(Ok(ContractError::AlreadyInitialized)));
}

#[test]
fn test_create_campaign_success() {
    let env = Env::default();
    let (client, _admin, ngo) = setup(&env);

    client.create_campaign(&1u64, &ngo, &1_000_0000000i128);
    let campaign = client.get_campaign(&1u64);

    assert_eq!(campaign.campaign_id, 1);
    assert_eq!(campaign.ngo_wallet, ngo);
    assert_eq!(campaign.target_amount, 1_000_0000000i128);
    assert_eq!(campaign.total_donated, 0);
    assert_eq!(campaign.donor_count, 0);
    assert_eq!(campaign.status, CampaignStatus::Active);
}

#[test]
fn test_create_campaign_duplicate_id_fails() {
    let env = Env::default();
    let (client, _admin, ngo) = setup(&env);

    client.create_campaign(&1u64, &ngo, &1_000_0000000i128);
    let result = client.try_create_campaign(&1u64, &ngo, &500_0000000i128);

    assert_eq!(result, Err(Ok(ContractError::CampaignAlreadyExists)));
}

#[test]
fn test_create_campaign_invalid_target_fails() {
    let env = Env::default();
    let (client, _admin, ngo) = setup(&env);

    let result = client.try_create_campaign(&1u64, &ngo, &0i128);
    assert_eq!(result, Err(Ok(ContractError::InvalidAmount)));

    let result_neg = client.try_create_campaign(&2u64, &ngo, &-100i128);
    assert_eq!(result_neg, Err(Ok(ContractError::InvalidAmount)));
}

#[test]
fn test_donate_updates_totals_and_donor_count() {
    let env = Env::default();
    let (client, _admin, ngo) = setup(&env);
    client.create_campaign(&1u64, &ngo, &1_000_0000000i128);

    let donor1 = Address::generate(&env);
    let donor2 = Address::generate(&env);

    let total_after_first = client.donate(&1u64, &donor1, &100_0000000i128);
    assert_eq!(total_after_first, 100_0000000i128);

    // Same donor donates again: total increases, donor_count does NOT.
    client.donate(&1u64, &donor1, &50_0000000i128);
    let campaign = client.get_campaign(&1u64);
    assert_eq!(campaign.total_donated, 150_0000000i128);
    assert_eq!(campaign.donor_count, 1);

    // New donor: donor_count increases.
    client.donate(&1u64, &donor2, &25_0000000i128);
    let campaign = client.get_campaign(&1u64);
    assert_eq!(campaign.total_donated, 175_0000000i128);
    assert_eq!(campaign.donor_count, 2);
}

#[test]
fn test_donate_to_nonexistent_campaign_fails() {
    let env = Env::default();
    let (client, _admin, _ngo) = setup(&env);
    let donor = Address::generate(&env);

    let result = client.try_donate(&999u64, &donor, &10_0000000i128);
    assert_eq!(result, Err(Ok(ContractError::CampaignNotFound)));
}

#[test]
fn test_donate_invalid_amount_fails() {
    let env = Env::default();
    let (client, _admin, ngo) = setup(&env);
    client.create_campaign(&1u64, &ngo, &1_000_0000000i128);
    let donor = Address::generate(&env);

    let result = client.try_donate(&1u64, &donor, &0i128);
    assert_eq!(result, Err(Ok(ContractError::InvalidAmount)));
}

#[test]
fn test_campaign_transitions_to_funded_when_target_reached() {
    let env = Env::default();
    let (client, _admin, ngo) = setup(&env);
    client.create_campaign(&1u64, &ngo, &100_0000000i128);
    let donor = Address::generate(&env);

    client.donate(&1u64, &donor, &100_0000000i128);
    let campaign = client.get_campaign(&1u64);
    assert_eq!(campaign.status, CampaignStatus::Funded);
}

#[test]
fn test_donate_to_closed_campaign_fails() {
    let env = Env::default();
    let (client, _admin, ngo) = setup(&env);
    client.create_campaign(&1u64, &ngo, &1_000_0000000i128);
    client.close_campaign(&1u64, &ngo);

    let donor = Address::generate(&env);
    let result = client.try_donate(&1u64, &donor, &10_0000000i128);
    assert_eq!(result, Err(Ok(ContractError::CampaignClosed)));
}

#[test]
fn test_add_expense_success_and_total_tracking() {
    let env = Env::default();
    let (client, _admin, ngo) = setup(&env);
    client.create_campaign(&1u64, &ngo, &1_000_0000000i128);
    let donor = Address::generate(&env);
    client.donate(&1u64, &donor, &500_0000000i128);

    let proof = bytes!(&env, 0xdeadbeef);
    client.add_expense(&1u64, &ngo, &200_0000000i128, &proof);

    let campaign = client.get_campaign(&1u64);
    assert_eq!(campaign.total_expensed, 200_0000000i128);
    assert_eq!(client.get_expense_count(&1u64), 1);

    let record = client.get_expense(&1u64, &0u32);
    assert_eq!(record.amount, 200_0000000i128);
    assert_eq!(record.proof_hash, proof);
}

#[test]
fn test_add_expense_exceeding_raised_amount_fails() {
    let env = Env::default();
    let (client, _admin, ngo) = setup(&env);
    client.create_campaign(&1u64, &ngo, &1_000_0000000i128);
    let donor = Address::generate(&env);
    client.donate(&1u64, &donor, &100_0000000i128);

    let proof = bytes!(&env, 0xdeadbeef);
    let result = client.try_add_expense(&1u64, &ngo, &150_0000000i128, &proof);

    assert_eq!(result, Err(Ok(ContractError::ExpenseExceedsRaised)));
}

#[test]
fn test_add_expense_cumulative_exceeding_raised_fails() {
    let env = Env::default();
    let (client, _admin, ngo) = setup(&env);
    client.create_campaign(&1u64, &ngo, &1_000_0000000i128);
    let donor = Address::generate(&env);
    client.donate(&1u64, &donor, &100_0000000i128);

    let proof = bytes!(&env, 0xdeadbeef);
    // First expense is fine on its own.
    client.add_expense(&1u64, &ngo, &70_0000000i128, &proof);
    // Second expense would push cumulative total above what was raised.
    let result = client.try_add_expense(&1u64, &ngo, &40_0000000i128, &proof);

    assert_eq!(result, Err(Ok(ContractError::ExpenseExceedsRaised)));
}

#[test]
fn test_add_expense_by_non_owner_fails() {
    let env = Env::default();
    let (client, _admin, ngo) = setup(&env);
    client.create_campaign(&1u64, &ngo, &1_000_0000000i128);
    let donor = Address::generate(&env);
    client.donate(&1u64, &donor, &500_0000000i128);

    let impostor = Address::generate(&env);
    let proof = bytes!(&env, 0xdeadbeef);
    let result = client.try_add_expense(&1u64, &impostor, &10_0000000i128, &proof);

    assert_eq!(result, Err(Ok(ContractError::Unauthorized)));
}

#[test]
fn test_campaign_completed_when_fully_spent_after_funded() {
    let env = Env::default();
    let (client, _admin, ngo) = setup(&env);
    client.create_campaign(&1u64, &ngo, &100_0000000i128);
    let donor = Address::generate(&env);
    client.donate(&1u64, &donor, &100_0000000i128);

    let proof = bytes!(&env, 0xdeadbeef);
    client.add_expense(&1u64, &ngo, &100_0000000i128, &proof);

    let campaign = client.get_campaign(&1u64);
    assert_eq!(campaign.status, CampaignStatus::Completed);
}

#[test]
fn test_close_campaign_by_owner() {
    let env = Env::default();
    let (client, _admin, ngo) = setup(&env);
    client.create_campaign(&1u64, &ngo, &1_000_0000000i128);

    client.close_campaign(&1u64, &ngo);
    let campaign = client.get_campaign(&1u64);
    assert_eq!(campaign.status, CampaignStatus::Closed);
}

#[test]
fn test_close_campaign_by_admin() {
    let env = Env::default();
    let (client, admin, ngo) = setup(&env);
    client.create_campaign(&1u64, &ngo, &1_000_0000000i128);

    client.close_campaign(&1u64, &admin);
    let campaign = client.get_campaign(&1u64);
    assert_eq!(campaign.status, CampaignStatus::Closed);
}

#[test]
fn test_close_campaign_by_unrelated_address_fails() {
    let env = Env::default();
    let (client, _admin, ngo) = setup(&env);
    client.create_campaign(&1u64, &ngo, &1_000_0000000i128);

    let impostor = Address::generate(&env);
    let result = client.try_close_campaign(&1u64, &impostor);
    assert_eq!(result, Err(Ok(ContractError::Unauthorized)));
}

#[test]
fn test_get_total_donations() {
    let env = Env::default();
    let (client, _admin, ngo) = setup(&env);
    client.create_campaign(&1u64, &ngo, &1_000_0000000i128);
    let donor = Address::generate(&env);
    client.donate(&1u64, &donor, &42_0000000i128);

    assert_eq!(client.get_total_donations(&1u64), 42_0000000i128);
}

#[test]
fn test_multiple_expenses_indexed_correctly() {
    let env = Env::default();
    let (client, _admin, ngo) = setup(&env);
    client.create_campaign(&1u64, &ngo, &1_000_0000000i128);
    let donor = Address::generate(&env);
    client.donate(&1u64, &donor, &300_0000000i128);

    let proof1 = bytes!(&env, 0x01);
    let proof2 = bytes!(&env, 0x02);
    client.add_expense(&1u64, &ngo, &50_0000000i128, &proof1);
    client.add_expense(&1u64, &ngo, &75_0000000i128, &proof2);

    assert_eq!(client.get_expense_count(&1u64), 2);
    assert_eq!(client.get_expense(&1u64, &0u32).amount, 50_0000000i128);
    assert_eq!(client.get_expense(&1u64, &1u32).amount, 75_0000000i128);
}
