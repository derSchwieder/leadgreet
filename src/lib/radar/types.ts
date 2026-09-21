export type RadarPoint = {
  companyId: string;
  name: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  greet: number;
  signalTitle: string | null;
  website: string | null;
};

export const RADAR_POINT_FIELDS = [
  "companyId",
  "name",
  "city",
  "country",
  "latitude",
  "longitude",
  "greet",
  "signalTitle",
  "website",
] as const;

export type RadarCandidate = {
  companyId: string;
  name: string;
  city: string | null;
  country: string | null;
  greet: number;
  signalTitle: string | null;
  website?: string | null;
};
