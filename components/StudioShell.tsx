"use client";

import { useState } from "react";
import PromptGenerator from "./PromptGenerator";
import ApparelStudio from "./ApparelStudio";

export default function StudioShell() {
  const [apparel, setApparel] = useState(false);

  if (apparel) {
    return <ApparelStudio onBack={() => setApparel(false)} />;
  }
  return <PromptGenerator onApparel={() => setApparel(true)} />;
}
