package com.kkunquizapp.QuizAppBackend.controller;

// chat/controller/ChatController.java

import com.kkunquizapp.QuizAppBackend.dto.ConversationDTO;
import com.kkunquizapp.QuizAppBackend.dto.MessageDTO;
import com.kkunquizapp.QuizAppBackend.dto.SendMessageRequest;
import com.kkunquizapp.QuizAppBackend.service.ConversationService;
import com.kkunquizapp.QuizAppBackend.service.MessageService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/chat")
public class ChatController {

    private final ConversationService convService;
    private final MessageService msgService;

    public ChatController(ConversationService convService, MessageService msgService) {
        this.convService = convService;
        this.msgService = msgService;
    }

    @PostMapping("/conversations/direct")
    public ResponseEntity<ConversationDTO> getOrCreateDirect(@RequestParam UUID userA,
                                                             @RequestParam UUID userB) {
        return ResponseEntity.ok(convService.getOrCreateDirect(userA, userB));
    }

    @PostMapping("/conversations/group")
    public ResponseEntity<ConversationDTO> createGroup(@RequestParam String title,
                                                       @RequestBody List<UUID> memberIds,
                                                       @RequestParam UUID creatorId) {
        return ResponseEntity.ok(convService.createGroup(title, memberIds, creatorId));
    }

    @GetMapping("/conversations")
    public Page<ConversationDTO> myConversations(@RequestParam UUID me,
                                                 @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return convService.listMyConversations(me, pageable);
    }

    @PostMapping("/messages")
    public MessageDTO send(@RequestParam UUID senderId, @RequestBody SendMessageRequest req) {
        return msgService.sendMessage(senderId, req.getConversationId(), req.getContent(),
                req.getMediaIds(), req.getReplyToId(), req.getClientId());
    }

    @GetMapping("/messages")
    public Page<MessageDTO> list(@RequestParam UUID conversationId,
                                 @RequestParam(required = false) UUID beforeMessageId,
                                 @RequestParam UUID me,
                                 @PageableDefault(size = 30, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return msgService.getMessages(conversationId, beforeMessageId, pageable, me);
    }

    @PostMapping("/messages/{id}/read-up-to")
    public void readUpTo(@PathVariable("id") UUID lastMessageId,
                         @RequestParam UUID conversationId,
                         @RequestParam UUID readerId) {
        msgService.markReadUpTo(conversationId, readerId, lastMessageId);
    }

    @PostMapping("/messages/{id}/reactions")
    public void addReaction(@PathVariable("id") UUID messageId,
                            @RequestParam UUID userId,
                            @RequestParam String emoji) {
        msgService.addReaction(messageId, userId, emoji);
    }

    @DeleteMapping("/messages/{id}/reactions")
    public void removeReaction(@PathVariable("id") UUID messageId,
                               @RequestParam UUID userId,
                               @RequestParam String emoji) {
        msgService.removeReaction(messageId, userId, emoji);
    }
}
