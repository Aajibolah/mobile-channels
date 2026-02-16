import { randomUUID } from "node:crypto";

export function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
}

export function uniqueSuffix(length = 8): string {
  return randomUUID().replace(/-/g, "").slice(0, length);
}

export function buildLinkSlug(source: string, campaign: string): string {
  const sourceSlug = slugify(source) || "src";
  const campaignSlug = slugify(campaign) || "cmp";
  return `${sourceSlug}-${campaignSlug}-${uniqueSuffix(6)}`;
}

