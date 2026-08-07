import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { config } from '../config';

interface StoreData {
  logo: string | null;
  phone: string | null;
  instagram: string | null;
  facebook: string | null;
  tiktok: string | null;
}

const StoreContext = createContext<StoreData>({ logo: null, phone: null, instagram: null, facebook: null, tiktok: null });

export function StoreProvider({ children }: { children: ReactNode }) {
  const [store, setStore] = useState<StoreData>({ logo: null, phone: null, instagram: null, facebook: null, tiktok: null });

  useEffect(() => {
    fetch(`${config.apiUrl}/api/store`)
      .then((res) => res.json())
      .then(setStore)
      .catch(() => {});
  }, []);

  return (
    <StoreContext.Provider value={store}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  return useContext(StoreContext);
}
