package com.kkunquizapp.QuizAppBackend.common.config;

import com.kkunquizapp.QuizAppBackend.common.security.CookieJwtAuthConverter;
import com.kkunquizapp.QuizAppBackend.common.security.JwtToUserPrincipalConverter;
import com.kkunquizapp.QuizAppBackend.user.model.enums.UserRole;
import com.kkunquizapp.QuizAppBackend.user.service.CustomUserDetailsService;
import com.nimbusds.jose.jwk.*;
import com.nimbusds.jose.jwk.RSAKey;
import com.nimbusds.jose.jwk.source.*;
import com.nimbusds.jose.proc.SecurityContext;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.*;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
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

    public SecurityConfig(CustomUserDetailsService userDetailsService,
                          JwtToUserPrincipalConverter jwtToUserPrincipalConverter) {
        this.userDetailsService = userDetailsService;
        this.jwtToUserPrincipalConverter = jwtToUserPrincipalConverter;
    }

    // ===================== SECURITY FILTER CHAIN =====================
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(csrf -> csrf.disable())
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // WebSocket - public
                        .requestMatchers("/ws/**").permitAll()

                        // Auth endpoints - public
                        .requestMatchers(
                                "/api/auth/refresh-token",
                                "/api/auth/logout",
                                "/api/auth/login",
                                "/api/auth/register",
                                "/api/auth/login-success"
                        ).permitAll()

                        // Public quiz endpoints
                        .requestMatchers(
                                "/api/quizzes/published",
                                "/api/games/join",
                                "/api/games/{gameId}/answer"
                        ).permitAll()

                        // Email confirmation
                        .requestMatchers("/api/users/me/confirm-email-change").permitAll()

                        // Quiz, Questions, Articles - require USER or ADMIN
                        .requestMatchers(
                                "/api/quizzes/**",
                                "/api/questions/**",
                                "/api/files/upload/**",
                                "/api/articles/**"
                        ).hasAnyAuthority(UserRole.USER.name(), UserRole.ADMIN.name())

                        // Admin endpoints - ADMIN only
                        .requestMatchers("/api/admin/**").hasAuthority(UserRole.ADMIN.name())

                        // Profile endpoints - USER only
                        .requestMatchers("/api/profile/**").hasAuthority(UserRole.USER.name())

                        // User endpoints - require authenticated
                        .requestMatchers(
                                "/api/users/**",
                                "/api/games/create",
                                "/api/games/{gameId}/start",
                                "/api/games/{gameId}/end",
                                "/api/auth/change-password"
                        ).authenticated()

                        // Everything else - public
                        .anyRequest().permitAll()
                )
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
                .oauth2Login(oauth2 -> oauth2
                        .loginPage("/oauth2/authorization/google")
                        .defaultSuccessUrl("/api/auth/login-success", true)
                )
                .oauth2ResourceServer(rs -> rs
                        .bearerTokenResolver(new CookieJwtAuthConverter()) // ✅ đọc JWT từ cookie
                        .jwt(jwt -> jwt.jwtAuthenticationConverter(jwtToUserPrincipalConverter)) // ✅ map JWT -> UserPrincipal
                );

        return http.build();
    }

    // ===================== JWT DECODER =====================
    @Bean
    public JwtDecoder jwtDecoder(RSAPublicKey publicKey) {
        return NimbusJwtDecoder.withPublicKey(publicKey).build();
    }

    // ===================== JWT ENCODER =====================
    @Bean
    public JwtEncoder jwtEncoder(RSAPublicKey publicKey, RSAPrivateKey privateKey) {
        JWK jwk = new RSAKey.Builder(publicKey).privateKey(privateKey).build();
        JWKSource<SecurityContext> jwkSrc = new ImmutableJWKSet<>(new JWKSet(jwk));
        return new NimbusJwtEncoder(jwkSrc);
    }

    // ===================== PASSWORD ENCODER =====================
    @Bean
    public BCryptPasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    // ===================== AUTHENTICATION PROVIDER =====================
    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder());
        return provider;
    }

    // ===================== AUTHENTICATION MANAGER =====================
    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration cfg) throws Exception {
        return cfg.getAuthenticationManager();
    }

    // ===================== RSA PUBLIC KEY =====================
    @Bean
    public RSAPublicKey publicKey() throws Exception {
        if (publicKeyBase64 != null && !publicKeyBase64.isBlank()) {
            String key = publicKeyBase64.trim().replace("\\n", "\n");
            String pem = key
                    .replace("-----BEGIN PUBLIC KEY-----", "")
                    .replace("-----END PUBLIC KEY-----", "")
                    .replaceAll("\\s", "");
            byte[] decoded = Base64.getDecoder().decode(pem);
            X509EncodedKeySpec spec = new X509EncodedKeySpec(decoded);
            return (RSAPublicKey) KeyFactory.getInstance("RSA").generatePublic(spec);
        } else if (publicKeyPath != null && publicKeyPath.exists()) {
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
        throw new IllegalStateException("No public key configured!");
    }

    // ===================== RSA PRIVATE KEY =====================
    @Bean
    public RSAPrivateKey privateKey() throws Exception {
        if (privateKeyBase64 != null && !privateKeyBase64.isBlank()) {
            String key = privateKeyBase64.trim().replace("\\n", "\n");
            String pem = key
                    .replace("-----BEGIN PRIVATE KEY-----", "")
                    .replace("-----END PRIVATE KEY-----", "")
                    .replaceAll("\\s", "");
            byte[] decoded = Base64.getDecoder().decode(pem);
            PKCS8EncodedKeySpec spec = new PKCS8EncodedKeySpec(decoded);
            return (RSAPrivateKey) KeyFactory.getInstance("RSA").generatePrivate(spec);
        } else if (privateKeyPath != null && privateKeyPath.exists()) {
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
        throw new IllegalStateException("No private key configured!");
    }

    // ===================== CORS CONFIGURATION =====================
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration cfg = new CorsConfiguration();
        List<String> origins = Arrays.stream(allowedOriginsCsv.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toList();

        cfg.setAllowedOrigins(origins);
        cfg.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        cfg.setAllowedHeaders(List.of("Authorization", "Content-Type", "Accept", "Origin", "X-Requested-With"));
        cfg.setExposedHeaders(List.of("Set-Cookie"));
        cfg.setAllowCredentials(true);
        cfg.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource src = new UrlBasedCorsConfigurationSource();
        src.registerCorsConfiguration("/**", cfg);
        return src;
    }
}
