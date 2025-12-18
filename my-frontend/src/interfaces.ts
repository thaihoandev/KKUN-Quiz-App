export interface PageResponse<T> {
    content: T[];
    pageable: Pageable;
    totalPages: number;
    totalElements: number;
    last: boolean;
    size: number; // page size
    number: number; // current page index (0-based)
    sort: PageSort;
    first: boolean;
    numberOfElements: number; // items in current page
    empty: boolean;
}

export interface Pageable {
    pageNumber: number;
    pageSize: number;
    sort: PageSort;
    offset: number;
    paged: boolean;
    unpaged: boolean;
}

export interface PageSort {
    empty: boolean;
    sorted: boolean;
    unsorted: boolean;
}

// Define types matching your Java model
export interface UserDto {
    userId: string;
    name: string;
    avatar: string;
    email: string;
}

export enum GameStatus {
    WAITING = "WAITING",
    IN_PROGRESS = "IN_PROGRESS",
    COMPLETED = "COMPLETED",
}
export enum QuizStatus {
    PUBLISHED = "PUBLISHED",
    DRAFT = "DRAFT",
    CLOSED = "CLOSED",
    ARCHIVED = "ARCHIVED",
}

export interface Comment {
    id: string;
    content: string;
    createdAt: Date;
}
