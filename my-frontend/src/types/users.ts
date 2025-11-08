
export interface UserAuth {
    id: string;
    username: string;
    email: string;
    accessToken: string;
    refreshToken: string;
    avatar?: string;
    name: string;
}

export interface User {
    userId: string;
    username: string;
    email: string;
    school: string;
    name: string;
    avatar: string;
    phone?: string;
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
