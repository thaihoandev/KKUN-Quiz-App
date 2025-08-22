
export interface PageResponse<T> {
  content: T[];
  pageable: Pageable;
  totalPages: number;
  totalElements: number;
  last: boolean;
  size: number;              // page size
  number: number;            // current page index (0-based)
  sort: PageSort;
  first: boolean;
  numberOfElements: number;  // items in current page
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


export interface User {
    id: string;
    username: string;
    email: string;
    accessToken: string;
    refreshToken: string;
    avatar?: string;
    name: string;
}

export interface UserResponseDTO {
  userId: string;
  username: string;
  email: string;
  school: string;
  name: string;
  avatar: string;
  roles: string[];
  createdAt: string;
  isActive: boolean;
}

export interface UserRequestDTO {
  username: string;
  email: string;
  password?: string;
  school?: string;
  name: string;
  avatar?: string;
  role?: string;
}

export interface UserProfile {
  userId: string;
  email?: string;
}
export interface Option {
    optionId: string;
    optionText: string;
    correct: boolean;
    value?: boolean;
    correctAnswer?: string;
}

export interface Question {
    questionId: string;
    questionType:
        | "SINGLE_CHOICE"
        | "MULTIPLE_CHOICE"
        | "TRUE_FALSE"
        | "FILL_IN_THE_BLANK";
    questionText: string;
    options: Option[];
    timeLimit: number;
    points: number;
    imageUrl?: string;
}

export interface Host {
    userId: string;
    name: string;
    avatar: string | null;
}

export interface CreateGameSessionResponse {
  gameId: string;
  quizId: string;
  hostId: string;
  pinCode: string;
  status: "WAITING" | "IN_PROGRESS" | "COMPLETED" | "CANCELED";
  startTime: string;
  endTime: string | null;
}
export interface PlayerResponse {
  playerId: string;
  nickname: string;
  gameId: string;
  score: number;
  inGame: boolean;
  userId?: string;
  avatar?: string;
  joinedAt?: string;
}


// Định nghĩa interface cho PlayerRequestDTO
export interface PlayerRequestDTO {
  playerSession: string | null;
  nickname: string;
  isAnonymous: boolean;
  score: number;
}

// Định nghĩa interface cho PlayerResponseDTO
export interface PlayerResponseDTO {
  playerId: string;
  gameId: string;
  userId?: string | null;
  nickname: string;
  score: number;
  anonymous: boolean;
  inGame: boolean;
}

// Định nghĩa interface cho GameResponseDTO
export interface GameResponseDTO {
  gameId: string;
  quizId: string;
  hostId: string;
  pinCode: string;
  status: "WAITING" | "IN_PROGRESS" | "COMPLETED" | "CANCELED";
  startTime: string;
  endTime: string | null;
}

// Định nghĩa interface cho GameDetailsResponseDTO
export interface GameDetailsResponseDTO {
  game: GameResponseDTO;
  players: PlayerResponseDTO[];
  title: string; // Thêm trường title nếu cần
}
export interface GameResponseDTO {
  gameId: string;
  quizId: string;
  hostId: string;
  pinCode: string;
  status: "WAITING" | "IN_PROGRESS" | "COMPLETED" | "CANCELED";
  startTime: string;
  endTime: string | null;
}

export interface PlayerResponseDTO {
  playerId: string;
  nickname: string;
  gameId: string;
  score: number;
  inGame: boolean;
  userId?: string | null;
  isAnonymous: boolean;
}

export interface OptionResponseDTO {
  optionId: string;
  optionText: string;
  isCorrect?: boolean;
}

export interface QuestionResponseDTO {
  questionId: string;
  questionText: string;
  imageUrl?: string;
  options: OptionResponseDTO[];
  timeLimit: number;
  points: number;
  questionType: "MULTIPLE_CHOICE" | "SINGLE_CHOICE" | "TRUE_FALSE" | "FILL_IN_THE_BLANK";
}

export interface GameDetailsResponseDTO {
  game: GameResponseDTO;
  players: PlayerResponseDTO[];
  title: string;
}

export interface ApiResponseDTO {
  success: boolean;
  message: string;
}


export interface LeaderboardEntryDTO {
  leaderboardId: string;
  gameId: string;
  playerId: string;
  rank: number;
  totalScore: number;
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

export interface Quiz {
  quizId: string;
  title: string;
  description?: string;
  host: UserDto;
  createdAt: string;
  updatedAt: string;
  status: QuizStatus;
  viewers: UserDto[];
  editors: UserDto[];
  questions: Question[];
  recommendationScore: number;
  category?: string; // Added for category-based filtering
  duration?: string; // Added for display
  image?: string; // Added for quiz thumbnail
}


export interface Comment {
  id: string;
  content: string;
  createdAt: Date;
}
