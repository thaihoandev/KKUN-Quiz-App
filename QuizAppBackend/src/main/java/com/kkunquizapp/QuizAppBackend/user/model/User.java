package com.kkunquizapp.QuizAppBackend.user.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.kkunquizapp.QuizAppBackend.user.model.enums.UserRole;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Entity
@Table(name = "users")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@ToString(onlyExplicitlyIncluded = true)
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(updatable = false, nullable = false, unique = true)
    @EqualsAndHashCode.Include
    @ToString.Include
    private UUID userId;

    @Column(nullable = false, unique = true, length = 100)
    @ToString.Include
    private String username;

    @Column(nullable = false, length = 100)
    @ToString.Include
    private String name;

    @Column(nullable = false, unique = true, length = 255)
    private String email;

    /**
     * Password đã/ sẽ encode ở service.
     */
    @Column(nullable = false, length = 255)
    @JsonIgnore
    private String password;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private UserRole role;

    @Column(name = "avatar", length = 500)
    private String avatar;

    @Column(length = 255)
    private String school;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();

    @Column(nullable = false)
    private boolean isActive = true;

    // Tự tham chiếu: KHÔNG serialize để tránh kéo cả graph
    @ManyToMany
    @JoinTable(
            name = "user_friends",
            joinColumns = @JoinColumn(name = "user_id"),
            inverseJoinColumns = @JoinColumn(name = "friend_id"),
            uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "friend_id"})
    )
    @JsonIgnore
    @ToString.Exclude
    private Set<User> friends = new HashSet<>();

    // ======= Quan hệ bạn bè =======
    public void addFriend(User other) {
        if (this.friends.contains(other)) return;
        this.friends.add(other);
        other.getFriends().add(this);
    }

    public void removeFriend(User friend) {
        this.friends.remove(friend);
        friend.getFriends().remove(this);
    }

    public boolean isFriendsWith(UUID otherId) {
        return friends.stream().anyMatch(u -> u.getUserId().equals(otherId));
    }

    // ======= Lifecycle =======
    @PrePersist
    public void prePersist() {
        this.createdAt = this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
