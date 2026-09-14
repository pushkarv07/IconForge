export type IconName =
  | "home" | "search" | "calendar" | "settings" | "bell" | "user" | "mail"
  | "heart" | "wallet" | "check" | "close" | "menu" | "star" | "bookmark"
  | "filter" | "download" | "upload" | "card" | "chart" | "bank" | "receipt"
  | "phone" | "laptop" | "monitor" | "camera" | "video" | "microphone"
  | "location" | "map" | "clock" | "coffee" | "shopping-cart" | "cloud-upload" | "generic";

export type IconStyle = "Outline" | "Solid" | "Duotone";
export type Complexity = "Simple" | "Balanced" | "Detailed";
export type CanvasSize = 16 | 20 | 24 | 32;
export type PreviewBackground = "light" | "dark" | "checkerboard";

export interface StyleProfile {
  name: string;
  canvas: CanvasSize;
  stroke: 1 | 1.5 | 2;
  strokeWidth: 1 | 1.5 | 2;
  cap: "Rounded" | "Square" | "Butt";
  strokeLinecap: "Rounded" | "Square" | "Butt";
  join: "Rounded" | "Miter" | "Bevel";
  strokeLinejoin: "Rounded" | "Miter" | "Bevel";
  fillMode: IconStyle;
  complexity: Complexity;
  density: "Airy" | "Balanced" | "Dense";
  corner: "Soft" | "Neutral" | "Sharp";
  weight: number;
  opticalWeight: number;
  geometric: "Organic" | "Geometric" | "Mixed";
}

export interface StyleReference {
  pathCount: number;
  viewBox: "0 0 24 24";
  svg: string;
}

export interface IconCandidate {
  id: string;
  name: string;
  label: string;
  svg: string;
  canvas: CanvasSize;
  stroke: number;
  style: IconStyle;
  complexity: Complexity;
  pathCount: number;
  weight: number;
}

export interface GenerationRequest {
  prompt: string;
  style: IconStyle;
  canvas: CanvasSize;
  stroke: 1 | 1.5 | 2;
  complexity: Complexity;
  color: "Current Color" | "Black" | "Custom";
  lockedStyle?: StyleProfile | null;
  styleReference?: StyleReference | null;
}

export interface IconSet {
  id: string;
  name: string;
  description?: string;
  icons: IconCandidate[];
  profile: StyleProfile;
  createdAt: string;
  updatedAt?: string;
}
