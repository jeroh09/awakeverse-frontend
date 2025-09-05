import { useContext } from "react";
import { ContextContext } from "../contexts/ContextContext";
export function useContextData() {
  return useContext(ContextContext);
}
