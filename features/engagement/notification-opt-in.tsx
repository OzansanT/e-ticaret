"use client";

import { BellRing } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

function decodeKey(value: string) {
  const padded = `${value}${"=".repeat((4 - (value.length % 4)) % 4)}`.replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(atob(padded), (character) => character.charCodeAt(0));
}

export function NotificationOptIn() {
  async function enableNotifications() {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      toast.info("Lorem ipsum dolor sit amet.");
      return;
    }
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      toast.info("Dolor sit amet consectetur.");
      return;
    }
    const configResponse = await fetch("/api/push-config");
    const config = await configResponse.json() as { enabled: boolean; publicKey?: string };
    if (!config.enabled || !config.publicKey) {
      toast.info("Lorem ipsum dolor sit amet.");
      return;
    }
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: decodeKey(config.publicKey) as BufferSource,
    });
    const response = await fetch("/api/push-subscriptions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(subscription),
    });
    if (!response.ok) throw new Error("Lorem ipsum dolor sit amet.");
    toast.success("Lorem ipsum dolor sit amet.");
  }

  return <Button variant="outline" className="notification-button" onClick={() => void enableNotifications()}><BellRing aria-hidden="true" /> Lorem ipsum</Button>;
}
