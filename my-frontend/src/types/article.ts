import { SeriesSummaryDto } from "./series";

export interface ArticleCategoryDto {
  id: string;
  name: string;
  description?: string;
  active: boolean;
}

export interface TagDto {
  id: string;
  name: string;
}

export interface ArticleDto {
  id: string;
  title: string;
  slug: string;
  description: string;
  // ✅ Nội dung
  contentMarkdown: string;
  contentHtml: string;

  // ✅ Thumbnail (tùy chọn)
  thumbnailUrl?: string;

  // ✅ Danh mục
  category: ArticleCategoryDto;

  // ✅ Series mà bài viết thuộc về (nếu có)
  series: SeriesSummaryDto;
  orderIndex?: number;

  // ✅ Độ khó
  difficulty: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";

  // ✅ Tác giả
  authorId: string;
  authorName?: string;
  authorAvatar?: string;

  // ✅ Trạng thái
  published: boolean;

  // ✅ Thông tin bổ sung
  readingTime?: number;
  views?: number;
  createdAt: string;
  updatedAt?: string;

  // ✅ Tags
  tags?: TagDto[];
}

