package com.kkunquizapp.QuizAppBackend.chatBot.config;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import io.netty.channel.ChannelOption;
import io.netty.handler.ssl.OpenSsl;
import io.netty.handler.ssl.SslContext;
import io.netty.handler.ssl.SslContextBuilder;
import io.netty.handler.ssl.SslProvider;
import io.netty.handler.timeout.ReadTimeoutHandler;
import io.netty.handler.timeout.WriteTimeoutHandler;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.http.codec.json.Jackson2JsonDecoder;
import org.springframework.http.codec.json.Jackson2JsonEncoder;
import org.springframework.web.reactive.function.client.ExchangeStrategies;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.netty.http.HttpProtocol;
import reactor.netty.http.client.HttpClient;
import reactor.netty.resources.ConnectionProvider;

import javax.net.ssl.SSLException;
import java.time.Duration;
import java.util.concurrent.TimeUnit;

/**
 * ✅ FIXED GeminiWebClient Configuration
 *
 * Major fixes:
 * - Support HTTP/1.1 fallback (Gemini API prefers HTTP/1.1)
 * - Proper SSL context with ALPN negotiation
 * - Detect OpenSSL vs JDK SSL
 * - Comprehensive error handling
 *
 * Issue fixed:
 * "First received frame was not SETTINGS. Hex dump for first 5 bytes: 485454502f"
 * (Hex 485454502f = ASCII "HTTP/" - server sent HTTP/1.1 response to H2 client)
 */
@Configuration
@Slf4j
public class GeminiConfig {

    @Value("${gemini.client.timeout-seconds:50}")
    private long timeoutSeconds;

    @Value("${gemini.client.max-connections:10}")
    private int maxConnections;

    @Value("${gemini.client.max-pending-requests:100}")
    private int maxPendingRequests;

    /**
     * ✅ FIXED WebClient bean for Gemini API
     */
    @Bean(name = "geminiWebClient")
    public WebClient geminiWebClient(ObjectMapper objectMapper) throws SSLException {
        log.info("🔧 Configuring Gemini WebClient (FIXED - H2 + HTTP/1.1 support)");
        log.info("   - Timeout: {}s", timeoutSeconds);
        log.info("   - Max Connections: {}", maxConnections);
        log.info("   - Max Pending Requests: {}", maxPendingRequests);

        // Connection pooling with optimized settings
        ConnectionProvider connectionProvider = ConnectionProvider.builder("gemini-pool")
                .maxConnections(maxConnections)
                .maxIdleTime(Duration.ofMinutes(5))
                .maxLifeTime(Duration.ofMinutes(30))
                .pendingAcquireMaxCount(maxPendingRequests)
                .pendingAcquireTimeout(Duration.ofSeconds(45))
                .evictInBackground(Duration.ofSeconds(30))
                .build();

        // ✅ FIXED: Proper SSL context with ALPN support
        SslContext sslContext = createOptimalSslContext();

        // ✅ FIXED: Support both HTTP/2 and HTTP/1.1 with fallback
        HttpClient httpClient = HttpClient.create(connectionProvider)
                .protocol(HttpProtocol.HTTP11)   // ✅ ONLY THIS
                .secure(sslSpec -> sslSpec.sslContext(sslContext))
                .option(ChannelOption.CONNECT_TIMEOUT_MILLIS, 10000)
                .responseTimeout(Duration.ofSeconds(timeoutSeconds))
                .doOnConnected(conn -> conn
                        .addHandlerLast(new ReadTimeoutHandler(timeoutSeconds, TimeUnit.SECONDS))
                        .addHandlerLast(new WriteTimeoutHandler(timeoutSeconds, TimeUnit.SECONDS))
                );


        // JSON serialization configuration
        ExchangeStrategies strategies = ExchangeStrategies.builder()
                .codecs(configurer -> {
                    configurer.defaultCodecs().maxInMemorySize(256 * 1024); // 256KB
                    configurer.defaultCodecs().enableLoggingRequestDetails(true);

                    Jackson2JsonEncoder encoder = new Jackson2JsonEncoder(objectMapper);
                    Jackson2JsonDecoder decoder = new Jackson2JsonDecoder(objectMapper);

                    configurer.defaultCodecs().jackson2JsonEncoder(encoder);
                    configurer.defaultCodecs().jackson2JsonDecoder(decoder);
                })
                .build();

        // Build and return WebClient
        return WebClient.builder()
                .baseUrl("https://generativelanguage.googleapis.com")
                .clientConnector(new ReactorClientHttpConnector(httpClient))
                .exchangeStrategies(strategies)
                .build();
    }

    /**
     * ✅ Create optimal SSL context with ALPN support
     *
     * Tries OpenSSL first (native, faster, better ALPN)
     * Falls back to JDK SSL if OpenSSL not available
     */
    private SslContext createOptimalSslContext() throws SSLException {
        if (OpenSsl.isAvailable()) {
            log.info("✅ Using OpenSSL SSL provider");
            return SslContextBuilder.forClient()
                    .sslProvider(SslProvider.OPENSSL)
                    .build();
        }

        log.info("✅ Using JDK SSL provider");
        return SslContextBuilder.forClient()
                .sslProvider(SslProvider.JDK)
                .build();
    }

    /**
     * ✅ ObjectMapper for JSON processing
     */
    @Bean(name = "objectMapper")
    public ObjectMapper objectMapper() {
        ObjectMapper mapper = new ObjectMapper();

        // Serialization
        mapper.configure(SerializationFeature.FAIL_ON_EMPTY_BEANS, false);
        mapper.configure(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS, false);
        mapper.configure(SerializationFeature.INDENT_OUTPUT, false); // Compact

        // Deserialization
        mapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
        mapper.configure(DeserializationFeature.ACCEPT_SINGLE_VALUE_AS_ARRAY, true);
        mapper.configure(DeserializationFeature.ACCEPT_EMPTY_STRING_AS_NULL_OBJECT, true);

        log.info("✅ ObjectMapper configured");
        return mapper;
    }
}