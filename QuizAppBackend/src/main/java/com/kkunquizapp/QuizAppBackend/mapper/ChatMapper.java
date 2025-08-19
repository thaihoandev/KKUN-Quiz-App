package com.kkunquizapp.QuizAppBackend.mapper;

// chat/mapper/ChatMapper.java

import com.kkunquizapp.QuizAppBackend.dto.*;
import com.kkunquizapp.QuizAppBackend.model.Media;
import com.kkunquizapp.QuizAppBackend.model.User;
import com.kkunquizapp.QuizAppBackend.model.*;

import java.util.*;
import java.util.stream.Collectors;

public class ChatMapper {

    public static UserBriefDTO toUserBrief(User u) {
        if (u == null) return null;
        return UserBriefDTO.builder()
                .userId(u.getUserId())
                .name(u.getName())
                .username(u.getUsername())
                .avatar(u.getAvatar())
                .build();
    }

    public static MediaBriefDTO toMediaBrief(Media m) {
        if (m == null) return null;
        return MediaBriefDTO.builder()
                .mediaId(m.getMediaId())
                .url(m.getUrl())
                .thumbnailUrl(m.getThumbnailUrl())
                .mimeType(m.getMimeType())
                .width(m.getWidth())
                .height(m.getHeight())
                .sizeBytes(m.getSizeBytes())
                .build();
    }

    public static MessageDTO toMessageDTO(Message e, UUID me, List<ChatReaction> reactionList) {
        Map<String, Integer> rx = reactionList == null ? Map.of() :
                reactionList.stream().collect(Collectors.groupingBy(r -> r.getId().getEmoji(), Collectors.summingInt(r -> 1)));

        boolean reactedByMe = reactionList != null && reactionList.stream().anyMatch(r ->
                r.getId().getUserId().equals(me));

        List<MediaBriefDTO> atts = e.getAttachments().stream()
                .sorted(Comparator.comparing(a -> Optional.ofNullable(a.getDisplayOrder()).orElse(Integer.MAX_VALUE)))
                .map(a -> toMediaBrief(a.getMedia()))
                .collect(Collectors.toList());

        return MessageDTO.builder()
                .id(e.getId())
                .conversationId(e.getConversation().getId())
                .clientId(e.getClientId())
                .sender(toUserBrief(e.getSender()))
                .content(e.getContent())
                .replyToId(e.getReplyTo() != null ? e.getReplyTo().getId() : null)
                .createdAt(e.getCreatedAt())
                .editedAt(e.getEditedAt())
                .deleted(e.getDeletedAt() != null)
                .attachments(atts)
                .reactions(rx)
                .reactedByMe(reactedByMe)
                .build();
    }

    public static ParticipantDTO toParticipantDTO(ConversationParticipant p) {
        return ParticipantDTO.builder()
                .userId(p.getUser().getUserId())
                .role(p.getRole().name())
                .nickname(p.getNickname())
                .joinedAt(p.getJoinedAt())
                .user(toUserBrief(p.getUser()))
                .build();
    }

    public static ConversationDTO toConversationDTO(Conversation c, List<ParticipantDTO> parts,
                                                    MessageDTO lastMsg, long unread) {
        return ConversationDTO.builder()
                .id(c.getId())
                .type(c.getType().name())
                .title(c.getTitle())
                .createdAt(c.getCreatedAt())
                .participants(parts)
                .lastMessage(lastMsg)
                .unreadCount(unread)
                .build();
    }
}
