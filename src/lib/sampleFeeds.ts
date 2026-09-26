import sampleFeedsData from "../../data/sample-feeds.json";
import type { FeedFormat } from "./types";

export interface SampleFeedEntry {
  title: string;
  feedUrl: string;
  siteUrl: string;
  description: string;
  format: FeedFormat;
}

export interface SampleCategoryEntry {
  name: string;
  feeds: SampleFeedEntry[];
}

export function getSampleCategories(): SampleCategoryEntry[] {
  return sampleFeedsData.categories as SampleCategoryEntry[];
}
