package com.kkunquizapp.QuizAppBackend.common.config;

import com.kkunquizapp.QuizAppBackend.common.security.JwtToUserPrincipalConverter;
import com.kkunquizapp.QuizAppBackend.user.model.enums.UserRole;
import com.kkunquizapp.QuizAppBackend.user.service.CustomUserDetailsService;
import com.nimbusds.jose.jwk.*;
import com.nimbusds.jose.jwk.RSAKey;
import com.nimbusds.jose.jwk.source.*;
import com.nimbusds.jose.proc.SecurityContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.*;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.*;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.*;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.security.oauth2.server.resource.authentication.*;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.access.AccessDeniedHandlerImpl;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.security.web.util.matcher.AntPathRequestMatcher;
import org.springframework.web.cors.*;

import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.security.KeyFactory;
import java.security.interfaces.*;
import java.security.spec.*;
import java.util.*;

@Configuration
@EnableWebSecurity
@EnableAspectJAutoProxy
@RequiredArgsConstructor
@Slf4j
public class SecurityConfig {

    @Value("${jwt.public-key:}")
    private String publicKeyBase64;

    @Value("${jwt.private-key:}")
    private String privateKeyBase64;

    @Value("${jwt.public-key-path:}")
    private Resource publicKeyPath;

    @Value("${jwt.private-key-path:}")
    private Resource privateKeyPath;

    @Value("${app.cors.allowed-origins:https://kkun-quiz.vercel.app}")
    private String allowedOriginsCsv;

    private final CustomUserDetailsService userDetailsService;
    private final JwtToUserPrincipalConverter jwtToUserPrincipalConverter;

    // ===================== SECURITY FILTER CHAIN =====================
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        log.info("Configuring Security Filter Chain");

        http
                // ========== CORS ==========
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))

                // ========== CSRF - Disable for stateless API ==========
                .csrf(csrf -> csrf.disable())

                // ========== SESSION - STATELESS MODE ==========
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                // ========== AUTHORIZATION RULES ==========
                .authorizeHttpRequests(auth -> auth
                        // Public endpoints
                        .requestMatchers("/ws/**", "/api/auth/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/games/join-anonymous").permitAll()

                        // Participant actions (không cần auth, chỉ cần participantId header)
                        .requestMatchers(HttpMethod.POST, "/api/games/*/leave").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/games/{gameId}/answer").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/games/{gameId}/skip").permitAll()

                        // Public read-only
                        .requestMatchers(
                                "/api/quizzes/published",
                                "/api/quizzes/users/**",
                                "/api/articles", "/api/articles/**",
                                "/api/article-categories/**", "/api/tags/**", "/api/search/**",
                                "/api/games/join", "/api/games/pin/**",
                                "/api/games/{gameId}/participants", "/api/games/{gameId}/details",
                                "/api/games/{gameId}/leaderboard", "/api/games/{gameId}/final-leaderboard",
                                "/api/games/{gameId}"
                        ).permitAll()

                        // ✅ OPTIONS permit all - đặt trước anyRequest
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                        // Authenticated endpoints
                        .requestMatchers("/api/users/me/**", "/api/ai/**", "/api/quizzes/**").hasAnyAuthority(UserRole.USER.name(), UserRole.ADMIN.name())

                        // Admin
                        .requestMatchers("/api/admin/**").hasAuthority(UserRole.ADMIN.name())

                        // Default
                        .anyRequest().authenticated()
                )

                // ========== EXCEPTION HANDLING - 401/403 ==========
                .exceptionHandling(ex -> ex
                        .defaultAuthenticationEntryPointFor(
                                new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED),
                                new AntPathRequestMatcher("/api/**")
                        )
                        .defaultAccessDeniedHandlerFor(
                                new AccessDeniedHandlerImpl(),
                                new AntPathRequestMatcher("/api/**")
                        )
                )

                // ========== JWT RESOURCE SERVER - BEARER TOKEN AUTH ==========
                .oauth2ResourceServer(rs -> rs
                        .jwt(jwt -> jwt.jwtAuthenticationConverter(jwtToUserPrincipalConverter))
                );

        log.info("Security Filter Chain configured successfully");
        return http.build();
    }

    // ===================== JWT DECODER =====================
    @Bean
    public JwtDecoder jwtDecoder(RSAPublicKey publicKey) {
        log.info("Creating JWT Decoder with RSA Public Key");
        return NimbusJwtDecoder.withPublicKey(publicKey).build();
    }

    // ===================== JWT ENCODER =====================
    @Bean
    public JwtEncoder jwtEncoder(RSAPublicKey publicKey, RSAPrivateKey privateKey) {
        log.info("Creating JWT Encoder with RSA Keys");
        JWK jwk = new RSAKey.Builder(publicKey).privateKey(privateKey).build();
        JWKSource<SecurityContext> jwkSrc = new ImmutableJWKSet<>(new JWKSet(jwk));
        return new NimbusJwtEncoder(jwkSrc);
    }

    // ===================== PASSWORD ENCODER =====================
    @Bean
    public BCryptPasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    // ===================== AUTH PROVIDER =====================
    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder());
        return provider;
    }

    // ===================== AUTH MANAGER =====================
    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration cfg) throws Exception {
        return cfg.getAuthenticationManager();
    }

    // ===================== RSA KEYS =====================
    @Bean
    public RSAPublicKey publicKey() throws Exception {
        log.info("Loading RSA Public Key");

        if (publicKeyBase64 != null && !publicKeyBase64.isBlank()) {
            log.info("Loading public key from environment variable (JWT_PUBLIC_KEY)");
            String key = publicKeyBase64.trim().replace("\\n", "\n");
            String pem = key
                    .replace("-----BEGIN PUBLIC KEY-----", "")
                    .replace("-----END PUBLIC KEY-----", "")
                    .replaceAll("\\s", "");
            byte[] decoded = Base64.getDecoder().decode(pem);
            X509EncodedKeySpec spec = new X509EncodedKeySpec(decoded);
            return (RSAPublicKey) KeyFactory.getInstance("RSA").generatePublic(spec);
        } else if (publicKeyPath != null && publicKeyPath.exists()) {
            log.info("Loading public key from file: {}", publicKeyPath.getFilename());
            try (InputStream is = publicKeyPath.getInputStream()) {
                String pem = new String(is.readAllBytes(), StandardCharsets.UTF_8)
                        .replace("-----BEGIN PUBLIC KEY-----", "")
                        .replace("-----END PUBLIC KEY-----", "")
                        .replaceAll("\\s", "");
                byte[] decoded = Base64.getDecoder().decode(pem);
                return (RSAPublicKey) KeyFactory.getInstance("RSA")
                        .generatePublic(new X509EncodedKeySpec(decoded));
            }
        }

        throw new IllegalStateException("No public key configured! Set JWT_PUBLIC_KEY env var or jwt.public-key-path property");
    }

    @Bean
    public RSAPrivateKey privateKey() throws Exception {
        log.info("Loading RSA Private Key");

        if (privateKeyBase64 != null && !privateKeyBase64.isBlank()) {
            log.info("Loading private key from environment variable (JWT_PRIVATE_KEY)");
            String key = privateKeyBase64.trim().replace("\\n", "\n");
            String pem = key
                    .replace("-----BEGIN PRIVATE KEY-----", "")
                    .replace("-----END PRIVATE KEY-----", "")
                    .replaceAll("\\s", "");
            byte[] decoded = Base64.getDecoder().decode(pem);
            PKCS8EncodedKeySpec spec = new PKCS8EncodedKeySpec(decoded);
            return (RSAPrivateKey) KeyFactory.getInstance("RSA").generatePrivate(spec);
        } else if (privateKeyPath != null && privateKeyPath.exists()) {
            log.info("Loading private key from file: {}", privateKeyPath.getFilename());
            try (InputStream is = privateKeyPath.getInputStream()) {
                String pem = new String(is.readAllBytes(), StandardCharsets.UTF_8)
                        .replace("-----BEGIN PRIVATE KEY-----", "")
                        .replace("-----END PRIVATE KEY-----", "")
                        .replaceAll("\\s", "");
                byte[] decoded = Base64.getDecoder().decode(pem);
                return (RSAPrivateKey) KeyFactory.getInstance("RSA")
                        .generatePrivate(new PKCS8EncodedKeySpec(decoded));
            }
        }

        throw new IllegalStateException("No private key configured! Set JWT_PRIVATE_KEY env var or jwt.private-key-path property");
    }

    // ===================== CORS CONFIGURATION =====================
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        log.info("Configuring CORS");

        CorsConfiguration cfg = new CorsConfiguration();
        List<String> origins = Arrays.stream(allowedOriginsCsv.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toList();

        log.info("Allowed Origins: {}", origins);

        cfg.setAllowedOrigins(origins);
        cfg.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        cfg.setAllowedHeaders(List.of("Authorization", "Content-Type", "Accept", "Origin", "X-Requested-With","X-Participant-Id"));
        cfg.setExposedHeaders(List.of("Set-Cookie")); // ✅ IMPORTANT: Expose Set-Cookie header for refresh token
        cfg.setAllowCredentials(true); // ✅ IMPORTANT: Allow credentials (cookies)
        cfg.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource src = new UrlBasedCorsConfigurationSource();
        src.registerCorsConfiguration("/**", cfg);

        log.info("CORS configured successfully");
        return src;
    }
}