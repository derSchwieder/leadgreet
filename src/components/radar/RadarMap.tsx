"use client";

import { useEffect, useRef } from "react";
import { Map, Marker, NavigationControl, setWorkerUrl, type LngLatLike } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { matchesRadarSensitivity, offsetOverlappingRadarPoints } from "@/lib/radar";
import type { RadarPoint } from "@/lib/radar";
import { scoreTone } from "@/lib/format";

const GERMANY_CENTER: LngLatLike = [10.45, 51.16];
const GERMANY_ZOOM = 5.2;
const GERMANY_BOUNDS: [LngLatLike, LngLatLike] = [
  [5.8, 47.2],
  [15.1, 55.1],
];

const STYLE_URL = "https://tiles.openfreemap.org/styles/liberty";
const DISCOVER_MS = 560;
const FADE_MS = 280;
const PULSE_MS = 820;

function markerSize(greet: number): number {
  return 30 + Math.round((Math.max(0, Math.min(100, greet)) / 100) * 2);
}

function markerClass(greet: number): string {
  const tone = scoreTone(greet);
  if (tone === "hot") return "radar-marker radar-marker-hot";
  if (tone === "warm") return "radar-marker radar-marker-warm";
  return "radar-marker radar-marker-cool";
}

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

type MarkerEntry = {
  marker: Marker;
  point: RadarPoint;
  element: HTMLButtonElement;
  visual: HTMLElement;
  visible: boolean;
  token: number;
  timer: ReturnType<typeof setTimeout> | null;
};

function clearMarkerTimer(entry: MarkerEntry) {
  if (entry.timer !== null) {
    clearTimeout(entry.timer);
    entry.timer = null;
  }
}

function setMarkerVisible(entry: MarkerEntry, visible: boolean, animate: boolean) {
  if (entry.visible === visible) return;

  entry.token += 1;
  const token = entry.token;
  entry.visible = visible;
  clearMarkerTimer(entry);
  entry.visual.classList.remove("radar-marker-discover", "radar-marker-fade");

  const useAnim = animate && !prefersReducedMotion();

  if (visible) {
    entry.element.classList.remove("radar-marker-hidden");
    entry.element.removeAttribute("aria-hidden");
    if (!useAnim) return;
    entry.visual.classList.add("radar-marker-discover");
    entry.timer = setTimeout(() => {
      if (token !== entry.token) return;
      entry.visual.classList.remove("radar-marker-discover");
      entry.timer = null;
    }, DISCOVER_MS);
    return;
  }

  entry.element.setAttribute("aria-hidden", "true");
  if (!useAnim) {
    entry.element.classList.add("radar-marker-hidden");
    return;
  }
  entry.visual.classList.add("radar-marker-fade");
  entry.timer = setTimeout(() => {
    if (token !== entry.token) return;
    entry.element.classList.add("radar-marker-hidden");
    entry.visual.classList.remove("radar-marker-fade");
    entry.timer = null;
  }, FADE_MS);
}

export function RadarMap({
  points,
  threshold,
  selectedCompanyId,
  onSelect,
}: {
  points: RadarPoint[];
  threshold: number;
  selectedCompanyId: string | null;
  onSelect: (companyId: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const markersRef = useRef<MarkerEntry[]>([]);
  const pulseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevThresholdRef = useRef<number | null>(null);
  const thresholdRef = useRef(threshold);
  const onSelectRef = useRef(onSelect);
  thresholdRef.current = threshold;
  onSelectRef.current = onSelect;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    setWorkerUrl("/maplibre/maplibre-gl-worker.mjs");

    const map = new Map({
      container,
      style: STYLE_URL,
      center: GERMANY_CENTER,
      zoom: GERMANY_ZOOM,
      attributionControl: { compact: true },
      cooperativeGestures: true,
    });

    map.addControl(new NavigationControl({ showCompass: false }), "top-right");
    map.setMaxBounds([
      [-12, 42],
      [32, 62],
    ]);

    const showGermany = () => {
      map.resize();
      map.fitBounds(GERMANY_BOUNDS, { padding: 48, duration: 0 });
    };

    const emphasizeCountryBorders = () => {
      if (!map.getLayer("boundary_2")) return;
      map.setPaintProperty("boundary_2", "line-color", "#2c3a47");
      map.setPaintProperty("boundary_2", "line-width", [
        "interpolate",
        ["linear"],
        ["zoom"],
        3,
        1.5,
        5,
        2.2,
        12,
        4,
      ]);
    };

    const onStyleReady = () => {
      showGermany();
      emphasizeCountryBorders();
    };

    if (map.loaded()) {
      onStyleReady();
    } else {
      map.once("load", onStyleReady);
    }

    const displayPoints = offsetOverlappingRadarPoints(points).sort(
      (left, right) => left.greet - right.greet,
    );
    const entries: MarkerEntry[] = [];

    for (const point of displayPoints) {
      const size = markerSize(point.greet);
      const element = document.createElement("button");
      element.type = "button";
      element.className = "radar-marker-host";
      element.style.width = `${size}px`;
      element.style.height = `${size}px`;
      element.setAttribute("aria-label", `${point.name}, Greet ${point.greet}`);

      const visual = document.createElement("span");
      visual.className = markerClass(point.greet);

      const label = document.createElement("span");
      label.textContent = String(point.greet);
      visual.append(label);
      element.append(visual);

      const marker = new Marker({ element, anchor: "center" })
        .setLngLat([point.longitude, point.latitude])
        .addTo(map);

      const entry: MarkerEntry = {
        marker,
        point,
        element,
        visual,
        visible: true,
        token: 0,
        timer: null,
      };

      element.addEventListener("click", (event) => {
        event.stopPropagation();
        if (!entry.visible) return;
        onSelectRef.current(point.companyId);
      });

      const initiallyVisible = matchesRadarSensitivity(point.greet, thresholdRef.current);
      if (!initiallyVisible) {
        entry.visible = false;
        element.classList.add("radar-marker-hidden");
        element.setAttribute("aria-hidden", "true");
      }

      entries.push(entry);
    }

    markersRef.current = entries;
    prevThresholdRef.current = thresholdRef.current;

    return () => {
      for (const entry of markersRef.current) {
        clearMarkerTimer(entry);
        entry.marker.remove();
      }
      markersRef.current = [];
      prevThresholdRef.current = null;
      if (pulseTimerRef.current !== null) {
        clearTimeout(pulseTimerRef.current);
        pulseTimerRef.current = null;
      }
      overlayRef.current?.replaceChildren();
      map.remove();
    };
  }, [points]);

  useEffect(() => {
    const previous = prevThresholdRef.current;
    if (previous === null || previous === threshold) return;

    const animate = !prefersReducedMotion();
    for (const entry of markersRef.current) {
      setMarkerVisible(entry, matchesRadarSensitivity(entry.point.greet, threshold), animate);
    }

    prevThresholdRef.current = threshold;

    const overlay = overlayRef.current;
    if (!animate || !overlay || pulseTimerRef.current !== null) return;

    const ring = document.createElement("span");
    ring.className = "radar-pulse-ring";
    overlay.append(ring);
    pulseTimerRef.current = setTimeout(() => {
      overlay.replaceChildren();
      pulseTimerRef.current = null;
    }, PULSE_MS);
  }, [threshold]);

  useEffect(() => {
    for (const entry of markersRef.current) {
      const selected = entry.point.companyId === selectedCompanyId;
      entry.element.classList.toggle("radar-marker-selected", selected);
      if (selected) {
        entry.element.setAttribute("aria-pressed", "true");
      } else {
        entry.element.removeAttribute("aria-pressed");
      }
    }
  }, [selectedCompanyId, points]);

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full" />
      <div ref={overlayRef} className="radar-scan" aria-hidden="true" />
    </div>
  );
}
