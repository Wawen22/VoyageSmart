import { useEffect, useState } from 'react';

type StorageScope = 'local' | 'session';

function getStorage(scope: StorageScope) {
  if (typeof window === 'undefined') return null;
  return scope === 'session' ? window.sessionStorage : window.localStorage;
}

export function useFeatureFlag(flagKey: string, scope: StorageScope = 'local') {
  const storage = getStorage(scope);
  const [enabled, setEnabled] = useState<boolean>(() => {
    if (!storage) return false;
    const value = storage.getItem(flagKey);
    return value === 'true';
  });

  useEffect(() => {
    if (!storage) return;
    storage.setItem(flagKey, enabled ? 'true' : 'false');
  }, [enabled, storage, flagKey]);

  return [enabled, setEnabled] as const;
}
