// com.kkunquizapp.QuizAppBackend.repo.FriendRequestRepo.java
package com.kkunquizapp.QuizAppBackend.user.repository;

import com.kkunquizapp.QuizAppBackend.user.model.FriendRequest;
import com.kkunquizapp.QuizAppBackend.user.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface FriendRequestRepo extends JpaRepository<FriendRequest, UUID> {

    Optional<FriendRequest> findByRequesterAndReceiver(User requester, User receiver);

    // Tìm pending giữa 2 bên theo cả 2 chiều
    Optional<FriendRequest> findByRequesterAndReceiverAndStatus(User r, User v, FriendRequest.Status status);

    // ===== cũ: list full (nếu còn dùng)
    List<FriendRequest> findAllByReceiverAndStatus(User receiver, FriendRequest.Status status);
    List<FriendRequest> findAllByRequesterAndStatus(User requester, FriendRequest.Status status);

    // ===== mới: phân trang + sort theo createdAt desc
    Page<FriendRequest> findAllByReceiverAndStatus(User receiver,
                                                   FriendRequest.Status status,
                                                   Pageable pageable);

    Page<FriendRequest> findAllByRequesterAndStatus(User requester,
                                                    FriendRequest.Status status,
                                                    Pageable pageable);
}
