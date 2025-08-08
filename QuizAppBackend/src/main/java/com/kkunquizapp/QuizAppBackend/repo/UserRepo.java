package com.kkunquizapp.QuizAppBackend.repo;


import com.kkunquizapp.QuizAppBackend.model.User;
import io.lettuce.core.dynamic.annotation.Param;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepo extends JpaRepository<User, UUID> {

    Optional<User> findByUsername(String username);
    Optional<User> findByEmail(String email);
    Optional<User> findByUsernameOrEmail(String username, String email);

    boolean existsByEmail(String email);

    boolean existsByUsername(String username);

    @Query("SELECT COUNT(*) > 0 FROM User u JOIN u.friends f WHERE u.userId = :userId AND f.userId = :friendId")
    boolean existsFriendship(@Param("userId") UUID userId, @Param("friendId") UUID friendId);
}
