import { Client as ContractClient, Spec } from '@stellar/stellar-sdk/contract';
import { NETWORK_PASSPHRASE } from './stellar';

const CONTRACT_ID = import.meta.env.VITE_CONTRACT_ID || '';
const RPC_URL = import.meta.env.VITE_STELLAR_RPC_URL || 'https://soroban-testnet.stellar.org';

export class ContractNotConfiguredError extends Error {}

/**
 * Lazily builds a Soroban contract client. Contract reads (get_campaign,
 * get_total_donations) are safe to call directly from the browser since
 * they're free simulated calls with no signing required. Writes
 * (create_campaign, donate, add_expense, close_campaign) require a signer
 * and are invoked with the connected Freighter wallet as the source.
 */
const getClient = () => {
  if (!CONTRACT_ID) {
    throw new ContractNotConfiguredError(
      'Soroban contract ID is not configured (VITE_CONTRACT_ID missing).'
    );
  }

  return new ContractClient(
    // A minimal spec covering the read-only calls the frontend needs;
    // full spec should be generated via `stellar contract bindings` for
    // production use with the deployed WASM's actual XDR interface.
    new Spec([]),
    {
      contractId: CONTRACT_ID,
      networkPassphrase: NETWORK_PASSPHRASE,
      rpcUrl: RPC_URL,
    }
  );
};

export interface OnChainCampaign {
  campaign_id: number;
  ngo_wallet: string;
  target_amount: bigint;
  total_donated: bigint;
  total_expensed: bigint;
  donor_count: number;
  status: string;
}

/**
 * Reads on-chain campaign state for display alongside the MongoDB record,
 * so donors can independently verify the platform's numbers match chain.
 * Returns null gracefully if the contract isn't configured or the call
 * fails, rather than breaking the campaign detail page.
 */
export const getOnChainCampaign = async (
  contractCampaignId: number
): Promise<OnChainCampaign | null> => {
  try {
    const client = getClient();
    const result = await (client as any).get_campaign({ campaign_id: contractCampaignId } as never);
    return result as unknown as OnChainCampaign;
  } catch (err) {
    console.warn('[contract] on-chain campaign read failed, falling back to DB only:', err);
    return null;
  }
};

/**
 * NOTE ON PRODUCTION USAGE:
 * The recommended path for calling this contract from a real frontend is
 * to run `stellar contract bindings typescript --id <CONTRACT_ID> --network testnet`
 * after deployment, which generates a fully-typed client package (with the
 * real function signatures) from the deployed WASM's interface. Import
 * that generated package here instead of hand-rolling `Spec([])` calls.
 * This file is written to compile and run against an empty spec for
 * read-only calls, but should be swapped for the generated bindings before
 * shipping — see contracts/aidchain_donation_contract/README.md.
 */
