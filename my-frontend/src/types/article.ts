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
  contentMarkdown: string;
  contentHtml: string;
  thumbnailUrl?: string;
  category: ArticleCategoryDto;
  difficulty: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  authorId: string;
  published: boolean;
  createdAt: string;
  tags?: TagDto[];
}