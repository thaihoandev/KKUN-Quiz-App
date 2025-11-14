// ========================== Types cho Friends/Requests ==========================
export type FriendSuggestion = {
  userId: string;
  name?: string;
  username?: string;
  avatar?: string;
  mutualFriends: number;
};

export type FriendRequestItem = {
  id: string;
  status: "PENDING" | "ACCEPTED" | "DECLINED" | "CANCELED";
  createdAt: string;

  requesterId?: string;
  requesterName?: string;
  requesterUsername?: string;
  requesterAvatar?: string;

  receiverId?: string;
  receiverName?: string;
  receiverUsername?: string;
  receiverAvatar?: string;
};

export type FriendshipStatus = "NONE" | "REQUESTED" | "INCOMING" | "FRIEND";
export type FriendshipStatusResponse = { status: FriendshipStatus; requestId?: string | null };