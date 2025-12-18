package com.kkunquizapp.QuizAppBackend.common.config;

import com.fasterxml.jackson.annotation.JsonAutoDetect;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.fasterxml.jackson.annotation.PropertyAccessor;
import com.fasterxml.jackson.databind.*;
import com.fasterxml.jackson.databind.jsontype.impl.LaissezFaireSubTypeValidator;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import io.lettuce.core.ClientOptions;
import io.lettuce.core.SocketOptions;
import io.lettuce.core.protocol.ProtocolVersion;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.connection.RedisStandaloneConfiguration;
import org.springframework.data.redis.connection.lettuce.LettuceClientConfiguration;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.*;

import javax.net.ssl.SSLParameters;
import java.time.Duration;

@Configuration
@EnableCaching
@Slf4j
public class RedisConfig {

    @Value("${spring.data.redis.host}")
    private String redisHost;

    @Value("${spring.data.redis.port:6379}")
    private int redisPort;

    @Value("${spring.data.redis.password:}")
    private String redisPassword;

    @Value("${spring.data.redis.database:0}")
    private int database;

    @Value("${spring.data.redis.ssl.enabled:true}")
    private boolean sslEnabled;



    // ==================== 2. ObjectMapper RIÊNG cho Redis (có default typing) ====================
    @Bean("redisObjectMapper") // ← có tên rõ ràng, KHÔNG @Primary
    public ObjectMapper redisObjectMapper() {
        ObjectMapper mapper = new ObjectMapper();
        mapper.registerModule(new JavaTimeModule());
        mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

        // Bật default typing chỉ cho Redis → lưu được entity phức tạp, có quan hệ, inheritance
        mapper.activateDefaultTyping(
                LaissezFaireSubTypeValidator.instance,
                ObjectMapper.DefaultTyping.NON_FINAL,
                JsonTypeInfo.As.PROPERTY
        );

        mapper.setVisibility(PropertyAccessor.ALL, JsonAutoDetect.Visibility.ANY);
        mapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);

        log.info("redisObjectMapper created with polymorphic typing (only for Redis)");
        return mapper;
    }

    // ==================== 3. Redis Connection Factory – tối ưu cho Upstash ====================
    @Bean
    public RedisConnectionFactory redisConnectionFactory() {
        log.info("Connecting to Redis: {}:{} | SSL: {} | DB: {}", redisHost, redisPort, sslEnabled, database);

        RedisStandaloneConfiguration config = new RedisStandaloneConfiguration();
        config.setHostName(redisHost);
        config.setPort(redisPort);
        config.setDatabase(database);
        if (redisPassword != null && !redisPassword.isBlank()) {
            config.setPassword(redisPassword);
        }

        LettuceClientConfiguration.LettuceClientConfigurationBuilder builder = LettuceClientConfiguration.builder()
                .commandTimeout(Duration.ofSeconds(10))
                .shutdownTimeout(Duration.ZERO);

        if (sslEnabled) {
            builder.useSsl().disablePeerVerification(); // Upstash bắt buộc

            ClientOptions clientOptions = ClientOptions.builder()
                    .socketOptions(SocketOptions.builder()
                            .connectTimeout(Duration.ofSeconds(10))
                            .keepAlive(true)
                            .build())
                    .autoReconnect(true)
                    .protocolVersion(ProtocolVersion.RESP2)
                    .build();
            builder.clientOptions(clientOptions);
        }

        LettuceConnectionFactory factory = new LettuceConnectionFactory(config, builder.build());
        factory.setValidateConnection(true);
        factory.setShareNativeConnection(true);
        factory.afterPropertiesSet();

        log.info("RedisConnectionFactory (Upstash compatible) created successfully");
        return factory;
    }

    // ==================== 4. RedisTemplate chính – dùng redisObjectMapper ====================
    @Bean
    @Primary
    public RedisTemplate<String, Object> redisTemplate(
            RedisConnectionFactory factory,
            @Qualifier("redisObjectMapper") ObjectMapper redisObjectMapper) {

        RedisTemplate<String, Object> template = new RedisTemplate<>();
        template.setConnectionFactory(factory);

        GenericJackson2JsonRedisSerializer jsonSerializer =
                new GenericJackson2JsonRedisSerializer(redisObjectMapper);
        StringRedisSerializer stringSerializer = new StringRedisSerializer();

        template.setKeySerializer(stringSerializer);
        template.setValueSerializer(jsonSerializer);
        template.setHashKeySerializer(stringSerializer);
        template.setHashValueSerializer(jsonSerializer);

        template.afterPropertiesSet();
        log.info("RedisTemplate configured with polymorphic JSON serializer");
        return template;
    }

    // ==================== 6. CacheManager với TTL riêng & dùng redisObjectMapper ====================
    @Bean
    public CacheManager cacheManager(
            RedisConnectionFactory factory,
            @Qualifier("redisObjectMapper") ObjectMapper redisObjectMapper) {

        GenericJackson2JsonRedisSerializer serializer =
                new GenericJackson2JsonRedisSerializer(redisObjectMapper);

        RedisCacheConfiguration defaultConfig = RedisCacheConfiguration.defaultCacheConfig()
                .entryTtl(Duration.ofMinutes(10))
                .serializeKeysWith(RedisSerializationContext.SerializationPair.fromSerializer(new StringRedisSerializer()))
                .serializeValuesWith(RedisSerializationContext.SerializationPair.fromSerializer(serializer))
                .disableCachingNullValues();

        RedisCacheManager cacheManager = RedisCacheManager.builder(factory)
                .cacheDefaults(defaultConfig)
                .withCacheConfiguration("quiz", defaultConfig.entryTtl(Duration.ofHours(2)))
                .withCacheConfiguration("games", defaultConfig.entryTtl(Duration.ofMinutes(15)))
                .withCacheConfiguration("leaderboard", defaultConfig.entryTtl(Duration.ofSeconds(30)))
                .withCacheConfiguration("participants", defaultConfig.entryTtl(Duration.ofMinutes(5)))
                .transactionAware()
                .build();

        log.info("RedisCacheManager configured with custom TTLs");
        return cacheManager;
    }
}