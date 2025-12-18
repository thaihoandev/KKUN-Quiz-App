// src/main/java/com/kkunquizapp/QuizAppBackend/redis/service/RedisService.java

package com.kkunquizapp.QuizAppBackend.redis.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.*;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RedisService {

    private final RedisTemplate<String, Object> redisTemplate;

    // Lazily get operations — no need to inject them separately
    private ValueOperations<String, Object> valueOps() {
        return redisTemplate.opsForValue();
    }

    private SetOperations<String, Object> setOps() {
        return redisTemplate.opsForSet();
    }

    private ZSetOperations<String, Object> zSetOps() {
        return redisTemplate.opsForZSet();
    }

    // ===================== GENERIC METHODS =====================

    public <T> void save(String prefix, UUID id, T data, Duration ttl) {
        valueOps().set(prefix + id, data, ttl);
    }

    public <T> void save(String prefix, UUID id, T data) {
        save(prefix, id, data, Duration.ofDays(7));
    }

    public <T> T get(String prefix, UUID id, Class<T> clazz) {
        Object obj = valueOps().get(prefix + id);
        return obj == null ? null : clazz.cast(obj);
    }

    public void evict(String prefix, UUID id) {
        redisTemplate.delete(prefix + id);
    }

    public void evictAll(Collection<String> keys) {
        redisTemplate.delete(keys);
    }

    // ===================== QUIZ MODULE =====================
    public void saveQuiz(UUID quizId, Object quiz) {
        save("quiz:", quizId, quiz, Duration.ofDays(2));
    }

    public <T> T getQuiz(UUID quizId, Class<T> clazz) {
        return get("quiz:", quizId, clazz);
    }

    public void evictQuiz(UUID quizId) {
        evict("quiz:", quizId);
    }

    // ===================== GAME MODULE =====================
    public void saveGameState(UUID gameId, Object state) {
        save("game:", gameId, state, Duration.ofHours(24));
    }

    public <T> T getGameState(UUID gameId, Class<T> clazz) {
        return get("game:", gameId, clazz);
    }

    // ===================== LEADERBOARD =====================
    public void addToLeaderboard(UUID gameId, UUID participantId, double score) {
        zSetOps().add("lb:" + gameId, participantId.toString(), score);
    }

    public void updateLeaderboardScore(UUID gameId, UUID participantId, double newScore) {
        zSetOps().add("lb:" + gameId, participantId.toString(), newScore); // overwrites
    }

    public List<Map.Entry<String, Double>> getTopLeaderboard(UUID gameId, int limit) {
        Set<ZSetOperations.TypedTuple<Object>> tuples =
                zSetOps().reverseRangeWithScores("lb:" + gameId, 0, limit - 1);

        if (tuples == null || tuples.isEmpty()) return List.of();

        return tuples.stream()
                .map(t -> Map.entry((String) t.getValue(), t.getScore()))
                .collect(Collectors.toList());
    }

    public Long getPlayerRank(UUID gameId, UUID participantId) {
        Long rank = zSetOps().reverseRank("lb:" + gameId, participantId.toString());
        return rank == null ? null : rank + 1; // convert 0-based → 1-based rank
    }

    // ===================== CLEANUP =====================
    public void removeGameData(UUID gameId) {
        redisTemplate.delete(List.of("game:" + gameId, "lb:" + gameId));
    }

    // ===================== USER ONLINE STATUS =====================
    public void markUserOnline(UUID userId) {
        setOps().add("online:users", userId.toString());
        valueOps().set("user:online:" + userId, "1", Duration.ofMinutes(5));
    }

    public void markUserOffline(UUID userId) {
        setOps().remove("online:users", userId.toString());
        redisTemplate.delete("user:online:" + userId);
    }

    public Set<String> getOnlineUsers() {
        return setOps().members("online:users")
                .stream()
                .map(Object::toString)
                .collect(Collectors.toSet());
    }

    public boolean isUserOnline(UUID userId) {
        return Boolean.TRUE.equals(redisTemplate.hasKey("user:online:" + userId));
    }
}