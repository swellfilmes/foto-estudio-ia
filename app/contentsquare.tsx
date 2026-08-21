"use client";

import { useEffect } from "react";
import { injectContentsquareScript } from "@contentsquare/tag-sdk";

// Tag do Contentsquare (mapas de calor, gravação de sessão). Roda só no navegador.
export function Contentsquare() {
  useEffect(() => {
    injectContentsquareScript({ clientId: "596774bb5a8c3" });
  }, []);
  return null;
}
