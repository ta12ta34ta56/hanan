import { useMemo } from 'react';
import { create } from 'zustand';

/** Feature keys that used to live in the deleted paywall table. */
export type FeatureId = string;

export type GateResult = {
  status: 'allowed';
  allowed: true;
  reason?: string;
};

const ALLOW: GateResult = { status: 'allowed', allowed: true };

interface FlagState {
  ready: boolean;
  init: () => Promise<void>;
  can: (_id: FeatureId) => GateResult;
  canUseContent: (_kind: string, _id: string, _fallback?: string, _name?: string) => GateResult;
  recordUse: (_id: FeatureId) => Promise<void>;
}

/** Everything is free. No flags, ads, or tiers. */
export const useFlagStore = create<FlagState>(() => ({
  ready: true,
  init: async () => undefined,
  can: () => ALLOW,
  canUseContent: () => ALLOW,
  recordUse: async () => undefined,
}));

export function useGate(_id: FeatureId): GateResult {
  return useMemo(() => ALLOW, []);
}
