"use client";

import type { RadarProfileView } from "@/lib/icp";

export function RadarProfileSelector({
  profiles,
  selectedId,
  onChange,
}: {
  profiles: readonly RadarProfileView[];
  selectedId: string;
  onChange: (profileId: string) => void;
}) {
  if (profiles.length === 0) return null;

  return (
    <label className="mb-5 block max-w-sm">
      <span className="mb-1.5 block text-xs font-medium text-ink-muted">Radar</span>
      <select
        id="radar-profile"
        name="radar-profile"
        className="w-full rounded-lg border border-line bg-canvas px-3 py-2 text-sm text-ink"
        value={selectedId}
        onChange={(event) => onChange(event.target.value)}
      >
        {profiles.map((profile) => (
          <option key={profile.id} value={profile.id}>
            {profile.name}
          </option>
        ))}
      </select>
    </label>
  );
}
