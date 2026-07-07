import { AppError } from '../utils/AppError';

const HORIZON_URL = process.env.STELLAR_HORIZON_URL || 'https://horizon-testnet.stellar.org';

interface HorizonOperation {
  type: string;
  transaction_successful: boolean;
  from?: string;
  to?: string;
  amount?: string;
  asset_type?: string;
  transaction_hash: string;
}

interface HorizonOperationsResponse {
  _embedded: {
    records: HorizonOperation[];
  };
}

export interface VerifiedPayment {
  from: string;
  to: string;
  amount: number;
  txHash: string;
}

/**
 * Verifies a claimed donation by fetching the transaction's operations
 * directly from Stellar Horizon (testnet) and confirming a matching native
 * XLM payment actually occurred, from the claimed donor to the claimed NGO,
 * for at least the claimed amount.
 *
 * This is the single most important trust boundary in the backend: without
 * it, a malicious client could POST /api/donations with a fabricated
 * txHash and amount, and the platform would report donations that never
 * happened. We never trust client-supplied amount/from/to — we only trust
 * what Horizon confirms.
 */
export const verifyStellarPayment = async (
  txHash: string,
  expectedDonorWallet: string,
  expectedNgoWallet: string,
  expectedAmount: number
): Promise<VerifiedPayment> => {
  let response: Response;

  try {
    response = await fetch(`${HORIZON_URL}/transactions/${txHash}/operations`);
  } catch (err) {
    throw new AppError('Unable to reach Stellar Horizon to verify transaction', 502);
  }

  if (response.status === 404) {
    throw new AppError('Transaction not found on Stellar testnet', 404);
  }

  if (!response.ok) {
    throw new AppError(`Horizon returned an error verifying the transaction (${response.status})`, 502);
  }

  const data = (await response.json()) as HorizonOperationsResponse;
  const operations = data._embedded?.records || [];

  const matchingPayment = operations.find((op) => {
    if (op.type !== 'payment' || !op.transaction_successful) return false;
    if (op.asset_type !== 'native') return false;
    if (op.from !== expectedDonorWallet) return false;
    if (op.to !== expectedNgoWallet) return false;

    const paidAmount = parseFloat(op.amount || '0');
    // Allow tiny float tolerance; the paid amount must be >= what's claimed.
    return paidAmount >= expectedAmount - 0.0000001;
  });

  if (!matchingPayment) {
    throw new AppError(
      'No matching native XLM payment found for this transaction hash — donation could not be verified',
      400
    );
  }

  return {
    from: matchingPayment.from!,
    to: matchingPayment.to!,
    amount: parseFloat(matchingPayment.amount!),
    txHash,
  };
};
