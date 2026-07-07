import {
  Horizon,
  TransactionBuilder,
  Networks,
  Operation,
  Asset,
  BASE_FEE,
} from '@stellar/stellar-sdk';
import { signWithFreighter } from './freighter';

const HORIZON_URL = import.meta.env.VITE_STELLAR_RPC_URL?.includes('horizon')
  ? import.meta.env.VITE_STELLAR_RPC_URL
  : 'https://horizon-testnet.stellar.org';

export const NETWORK_PASSPHRASE = Networks.TESTNET;

const server = new Horizon.Server(HORIZON_URL);

export class StellarPaymentError extends Error {}

export interface DonationResult {
  txHash: string;
  amount: string;
}

/**
 * Builds a native XLM payment transaction from donor -> NGO, has the donor
 * sign it via Freighter, submits it to Horizon testnet, and returns the
 * resulting transaction hash. This is the on-chain leg of the donation
 * flow — the backend independently re-verifies this exact transaction
 * against Horizon before crediting the campaign (see stellarService.ts on
 * the backend), so a forged or unsigned "success" can't be faked here.
 */
export const sendDonation = async (
  donorPublicKey: string,
  ngoPublicKey: string,
  amountXlm: string
): Promise<DonationResult> => {
  if (donorPublicKey === ngoPublicKey) {
    throw new StellarPaymentError('You cannot donate to a campaign using its own payout wallet.');
  }

  let sourceAccount;
  try {
    sourceAccount = await server.loadAccount(donorPublicKey);
  } catch (err) {
    throw new StellarPaymentError(
      'Your wallet account was not found on testnet. Fund it first via friendbot.'
    );
  }

  // Ensure the destination (NGO) account exists; native payments fail
  // outright to unfunded destination accounts on Stellar.
  try {
    await server.loadAccount(ngoPublicKey);
  } catch (err) {
    throw new StellarPaymentError(
      "The NGO's payout wallet is not yet activated on testnet and cannot receive funds."
    );
  }

  const transaction = new TransactionBuilder(sourceAccount, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      Operation.payment({
        destination: ngoPublicKey,
        asset: Asset.native(),
        amount: amountXlm,
      })
    )
    .setTimeout(60)
    .build();

  const signedXdr = await signWithFreighter(
    transaction.toXDR(),
    NETWORK_PASSPHRASE,
    donorPublicKey
  );

  const signedTransaction = TransactionBuilder.fromXDR(signedXdr, NETWORK_PASSPHRASE);

  try {
    const result = await server.submitTransaction(signedTransaction);
    return { txHash: result.hash, amount: amountXlm };
  } catch (err: unknown) {
    const horizonError = err as { response?: { data?: { extras?: { result_codes?: unknown } } } };
    const codes = horizonError?.response?.data?.extras?.result_codes;
    throw new StellarPaymentError(
      codes
        ? `Transaction failed on Stellar network: ${JSON.stringify(codes)}`
        : 'Transaction failed to submit to the Stellar network.'
    );
  }
};

/** Fetches current XLM balance for a public key, for display in the UI. */
export const getXlmBalance = async (publicKey: string): Promise<string> => {
  try {
    const account = await server.loadAccount(publicKey);
    const native = account.balances.find((b) => b.asset_type === 'native');
    return native?.balance ?? '0';
  } catch {
    return '0';
  }
};
