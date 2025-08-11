package com.kkunquizapp.QuizAppBackend.model;

import com.kkunquizapp.QuizAppBackend.model.enums.UserRole;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Entity
@Data
@Table(name = "users")
@EqualsAndHashCode(callSuper = false)
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(updatable = false, nullable = false, unique = true)
    private UUID userId;

    @Column(nullable = false, unique = true, length = 100)
    private String username;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, unique = true, length = 255)
    private String email;

    @Column(nullable = false, length = 255)
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

    @Column(nullable = true)
    private boolean isActive = true;

    @ManyToMany
    @JoinTable(
            name = "user_friends",
            joinColumns = @JoinColumn(name = "user_id"),
            inverseJoinColumns = @JoinColumn(name = "friend_id")
    )
    private Set<User> friends = new HashSet<>();

    public void addFriend(User friend) {
        friends.add(friend);
        friend.friends.add(this); // Ensure bidirectional relationship
    }

    public void removeFriend(User friend) {
        friends.remove(friend);
        friend.friends.remove(this);
    }

    @Transient
    private BCryptPasswordEncoder passwordEncoder;

    public User() {
        this.passwordEncoder = new BCryptPasswordEncoder();
    }

    public void setPassword(String password) {
        this.password = passwordEncoder.encode(password);
    }

    @PrePersist
    public void prePersist() { this.createdAt = this.updatedAt = LocalDateTime.now(); }

    @PreUpdate
    public void preUpdate()  { this.updatedAt = LocalDateTime.now(); }
}