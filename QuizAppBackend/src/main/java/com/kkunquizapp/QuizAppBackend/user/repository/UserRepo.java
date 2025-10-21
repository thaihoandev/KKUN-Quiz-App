package com.kkunquizapp.QuizAppBackend.user.repository;

import com.kkunquizapp.QuizAppBackend.user.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.Set;
import java.util.UUID;

@Repository
public interface UserRepo extends JpaRepository<User, UUID> {

    Optional<User> findByUsername(String username);
    Optional<User> findByEmail(String email);
    Optional<User> findByUsernameOrEmail(String username, String email);

    boolean existsByEmail(String email);
    boolean existsByUsername(String username);

    @Query("""
        SELECT CASE WHEN COUNT(f) > 0 THEN true ELSE false END
        FROM User u
        JOIN u.friends f
        WHERE u.userId = :userId AND f.userId = :friendId
    """)
    boolean existsFriendship(@Param("userId") UUID userId, @Param("friendId") UUID friendId);

    Page<User> findByIsActiveTrueAndUserIdNot(UUID currentId, Pageable pageable);

    /**
     * Gợi ý bạn bè có phân trang.
     * Tham số skipExcluded = true để bỏ điều kiện NOT IN khi excluded rỗng (tránh "NOT IN ()").
     */
    @Query("""
        SELECT u FROM User u
        WHERE u.userId <> :currentUserId
          AND (:skipExcluded = true OR u.userId NOT IN :excluded)
          AND u.isActive = true
    """)
    Page<User> findSuggestions(
            @Param("currentUserId") UUID currentUserId,
            @Param("excluded") Set<UUID> excluded,
            @Param("skipExcluded") boolean skipExcluded,
            Pageable pageable
    );

    /**
     * Danh sách bạn bè (phân trang) của 1 user.
     * Giả định mapping ManyToMany chuẩn: User.friends.
     */
    @Query("""
        SELECT f FROM User u
        JOIN u.friends f
        WHERE u.userId = :userId
    """)
    Page<User> findFriendsOf(@Param("userId") UUID userId, Pageable pageable);
}
