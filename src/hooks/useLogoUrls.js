// src/hooks/useLogoUrls.js
//
// Loads team logo dataUrls from IndexedDB for any component that
// needs to display logos (GameCard, GameEditorPage, GameFallbackCard).
//
// Usage — single logo:
//   const logoUrl = useLogoUrl("Chicago Cubs");
//   // returns string | null
//
// Usage — multiple logos at once (e.g. both teams in a game):
//   const logoMap = useLogoUrls(["Chicago Cubs", "New York Yankees"]);
//   // returns Map<teamName, dataUrl>

import { useState, useEffect } from "react";
import { getLogo, getLogos } from "@/utils/photoStorage";

/**
 * Load a single team logo from IndexedDB.
 * @param {string|null} teamName
 * @returns {string|null} dataUrl or null
 */
export function useLogoUrl(teamName) {
  const [url, setUrl] = useState(null);

  useEffect(() => {
    if (!teamName) { setUrl(null); return; }
    let cancelled = false;
    getLogo(teamName).then(u => { if (!cancelled) setUrl(u || null); });
    return () => { cancelled = true; };
  }, [teamName]);

  return url;
}

/**
 * Load multiple team logos from IndexedDB at once.
 * @param {string[]} teamNames
 * @returns {Map<string, string>} teamName → dataUrl
 */
export function useLogoUrls(teamNames) {
  const [urlMap, setUrlMap] = useState(new Map());

  useEffect(() => {
    const names = (teamNames || []).filter(Boolean);
    if (!names.length) { setUrlMap(new Map()); return; }

    let cancelled = false;
    getLogos(names).then(map => { if (!cancelled) setUrlMap(map); });
    return () => { cancelled = true; };
  }, [
    // Only re-run when team names actually change
    // eslint-disable-next-line react-hooks/exhaustive-deps
    (teamNames || []).filter(Boolean).join(","),
  ]);

  return urlMap;
}