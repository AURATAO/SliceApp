import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

type RefreshCtxValue = {
  refreshKey: number;
  bump: () => void;
};

const RefreshCtx = createContext<RefreshCtxValue | null>(null);

export function RefreshProvider({ children }: { children: React.ReactNode }) {
  const [refreshKey, setRefreshKey] = useState(0);

  const bump = useCallback(() => {
    setRefreshKey((x) => x + 1);
  }, []);

  const value = useMemo(() => ({ refreshKey, bump }), [refreshKey, bump]);

  return <RefreshCtx.Provider value={value}>{children}</RefreshCtx.Provider>;
}

export function useRefresh() {
  const v = useContext(RefreshCtx);
  if (!v) throw new Error("useRefresh must be used within RefreshProvider");
  return v;
}
