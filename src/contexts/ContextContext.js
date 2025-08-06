import { createContext, useState } from "react";
export const ContextContext = createContext();
export function ContextProvider({ children }) {
  const [activeContext, setActiveContext] = useState({});
  return (
    <ContextContext.Provider value={{ activeContext, setActiveContext }}>
      {children}
    </ContextContext.Provider>
  );
}
