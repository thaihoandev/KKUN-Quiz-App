import { ArticleDto } from "./article";

export interface SeriesDto {
  id?: string; // cho phép undefined
  title?: string;
  slug?: string;
  description?: string;
  thumbnailUrl?: string;
  authorName?: string;
  articles?: ArticleDto[];
}

export interface SeriesSummaryDto {
  id?: string; // cho phép undefined
  title?: string;
  slug?: string;
  description?: string;
  thumbnailUrl?: string;
}