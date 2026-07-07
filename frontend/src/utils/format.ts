export const formatXlm = (amount: number): string => {
  return `${amount.toLocaleString(undefined, { maximumFractionDigits: 7 })} XLM`;
};

export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const formatDateTime = (dateString: string): string => {
  return new Date(dateString).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const truncateWallet = (address: string, chars = 4): string => {
  if (!address || address.length < chars * 2) return address;
  return `${address.slice(0, chars + 1)}...${address.slice(-chars)}`;
};

export const truncateHash = (hash: string, chars = 6): string => {
  if (!hash || hash.length < chars * 2) return hash;
  return `${hash.slice(0, chars)}...${hash.slice(-chars)}`;
};

export const stellarExplorerTxUrl = (txHash: string): string =>
  `https://stellar.expert/explorer/testnet/tx/${txHash}`;

export const stellarExplorerAccountUrl = (publicKey: string): string =>
  `https://stellar.expert/explorer/testnet/account/${publicKey}`;

export const progressPercent = (raised: number, target: number): number => {
  if (!target) return 0;
  return Math.min(100, Math.round((raised / target) * 100));
};

export const categoryLabel = (category: string): string => {
  return category
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
};

export const cn = (...classes: (string | false | undefined | null)[]): string => {
  return classes.filter(Boolean).join(' ');
};
