/** Compatibility types after the paywall was deleted. Everything is allowed. */
export type FeatureId = string;
export type GateResult = {
  status: 'allowed';
  allowed: true;
  reason?: string;
  upgradeTo?: never;
  canUpgrade?: never;
};
