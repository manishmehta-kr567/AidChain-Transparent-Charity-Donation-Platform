import {
  isConnected,
  isAllowed,
  setAllowed,
  getAddress,
  getNetwork,
  signTransaction,
} from '@stellar/freighter-api';

export class FreighterError extends Error {}

const EXPECTED_NETWORK = (import.meta.env.VITE_STELLAR_NETWORK || 'testnet').toUpperCase();

/** Confirms the Freighter browser extension is installed and reachable. */
export const checkFreighterInstalled = async (): Promise<boolean> => {
  try {
    const { isConnected: connected } = await isConnected();
    return connected;
  } catch {
    return false;
  }
};

/**
 * Requests wallet access (prompting the user if not already granted) and
 * returns the connected public key. Throws a FreighterError with a
 * user-facing message on any failure so the UI can show a toast directly.
 */
export const connectFreighter = async (): Promise<string> => {
  const installed = await checkFreighterInstalled();
  if (!installed) {
    throw new FreighterError(
      'Freighter wallet extension not detected. Install it from freighter.app to continue.'
    );
  }

  const { isAllowed: alreadyAllowed } = await isAllowed();
  if (!alreadyAllowed) {
    const { isAllowed: granted, error } = await setAllowed();
    if (error || !granted) {
      throw new FreighterError('Wallet connection was declined.');
    }
  }

  await assertTestnet();

  const { address, error: addressError } = await getAddress();
  if (addressError || !address) {
    throw new FreighterError('Could not retrieve your wallet address from Freighter.');
  }

  return address;
};

/** Throws if the connected Freighter wallet is not on Stellar Testnet. */
export const assertTestnet = async (): Promise<void> => {
  const { network, error } = await getNetwork();
  if (error) {
    throw new FreighterError('Could not read the active network from Freighter.');
  }
  if (network.toUpperCase() !== EXPECTED_NETWORK) {
    throw new FreighterError(
      `Wrong network selected in Freighter (${network}). Please switch to ${EXPECTED_NETWORK} and try again.`
    );
  }
};

/**
 * Signs a base64-encoded XDR transaction envelope with Freighter and
 * returns the signed XDR, ready to be submitted to Horizon.
 */
export const signWithFreighter = async (
  xdr: string,
  networkPassphrase: string,
  publicKey: string
): Promise<string> => {
  const { signedTxXdr, error } = await signTransaction(xdr, {
    networkPassphrase,
    address: publicKey,
  });

  if (error || !signedTxXdr) {
    throw new FreighterError('Transaction signing was rejected or failed.');
  }

  return signedTxXdr;
};
