import com.kkunquizapp.QuizAppBackend.model.chat.ConversationParticipant;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ConversationParticipantRepository extends JpaRepository<ConversationParticipant, ConversationParticipant.ConversationParticipantId> {
  List<ConversationParticipant> findByUser_UserId(UUID userId);
  List<ConversationParticipant> findByConversation_Id(UUID conversationId);
  boolean existsByConversation_IdAndUser_UserId(UUID conversationId, UUID userId);
}