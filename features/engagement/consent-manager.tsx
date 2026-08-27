"use client";

import { useEffect, useState } from "react";
import { Settings2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export type ConsentChoice = { analytics: boolean; marketing: boolean };
export const CONSENT_STORAGE_KEY = "e-commerce-consent-v1";
export const CONSENT_EVENT = "commerce-consent-changed";

export function readConsent(): ConsentChoice | null {
  if (typeof window === "undefined") return null;
  try {
    const parsed = JSON.parse(window.localStorage.getItem(CONSENT_STORAGE_KEY) ?? "null") as ConsentChoice | null;
    if (parsed && typeof parsed.analytics === "boolean" && typeof parsed.marketing === "boolean") return parsed;
  } catch {
    window.localStorage.removeItem(CONSENT_STORAGE_KEY);
  }
  return null;
}

function saveConsent(choice: ConsentChoice) {
  window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(choice));
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: choice }));
}

export function ConsentManager() {
  const [open, setOpen] = useState(false);
  const [customizing, setCustomizing] = useState(false);
  const [analytics, setAnalytics] = useState(true);
  const [marketing, setMarketing] = useState(true);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setOpen(readConsent() === null));
    const reopen = () => setOpen(true);
    window.addEventListener("commerce-open-consent", reopen);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("commerce-open-consent", reopen);
    };
  }, []);

  if (!open) return null;

  return (
    <aside className="consent-panel" role="dialog" aria-modal="false" aria-labelledby="consent-title">
      <div className="consent-panel__icon"><ShieldCheck aria-hidden="true" /></div>
      <div>
        <h2 id="consent-title">Lorem ipsum dolor sit amet.</h2>
        <p>Consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore.</p>
        {customizing && (
          <div className="consent-options">
            <label><span><strong>Lorem ipsum</strong><small>Dolor sit amet consectetur.</small></span><input type="checkbox" checked disabled /></label>
            <label><span><strong>Adipiscing elit</strong><small>Sed do eiusmod tempor.</small></span><input type="checkbox" checked={analytics} onChange={(event) => setAnalytics(event.target.checked)} /></label>
            <label><span><strong>Incididunt labore</strong><small>Dolore magna aliqua.</small></span><input type="checkbox" checked={marketing} onChange={(event) => setMarketing(event.target.checked)} /></label>
          </div>
        )}
      </div>
      <div className="consent-actions">
        {customizing ? (
          <Button onClick={() => { saveConsent({ analytics, marketing }); setOpen(false); }}>Lorem ipsum</Button>
        ) : (
          <>
            <Button onClick={() => { saveConsent({ analytics: true, marketing: true }); setOpen(false); }}>Lorem ipsum</Button>
            <Button variant="outline" onClick={() => { saveConsent({ analytics: false, marketing: false }); setOpen(false); }}>Dolor sit</Button>
            <button className="consent-customize" onClick={() => setCustomizing(true)}><Settings2 aria-hidden="true" /> Amet elit</button>
          </>
        )}
      </div>
    </aside>
  );
}
