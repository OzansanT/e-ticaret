"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function OrderActions({ token }: { token: string }) {
  const [status, setStatus] = useState("");
  async function cancel() {
    setStatus("Lorem ipsum…");
    const response = await fetch(`/api/orders/${token}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "cancel", reason: "Lorem ipsum dolor sit amet." }),
    });
    const result = await response.json() as { error?: string };
    setStatus(response.ok ? "Lorem ipsum dolor sit amet." : result.error ?? "Consectetur adipiscing elit.");
    if (response.ok) window.location.reload();
  }
  return <div className="order-actions"><Button variant="outline" onClick={() => void cancel()}>Lorem ipsum</Button><output aria-live="polite">{status}</output></div>;
}
