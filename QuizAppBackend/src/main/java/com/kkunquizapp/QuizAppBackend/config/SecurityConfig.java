package com.kkunquizapp.QuizAppBackend.config;

import com.kkunquizapp.QuizAppBackend.model.enums.UserRole;
import com.nimbusds.jose.jwk.JWK;
import com.nimbusds.jose.jwk.JWKSet;
import com.nimbusds.jose.jwk.RSAKey;
import com.nimbusds.jose.jwk.source.ImmutableJWKSet;
import com.nimbusds.jose.jwk.source.JWKSource;
import com.nimbusds.jose.proc.SecurityContext;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletRequestWrapper;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.access.AccessDeniedHandlerImpl;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.security.web.authentication.preauth.AbstractPreAuthenticatedProcessingFilter;
import org.springframework.security.web.util.matcher.AntPathRequestMatcher;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.security.KeyFactory;
import java.security.interfaces.RSAPrivateKey;
import java.security.interfaces.RSAPublicKey;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.spec.X509EncodedKeySpec;
import java.util.Arrays;
import java.util.Base64;
import java.util.Collections;
import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Value("${jwt.public-key-path}")
    private Resource publicKeyPath;

    @Value("${jwt.private-key-path}")
    private Resource privateKeyPath;

    private final UserDetailsService userDetailsService;

    public SecurityConfig(UserDetailsService userDetailsService) {
        this.userDetailsService = userDetailsService;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(cs -> cs.disable())
                .sessionManagement(sm -> sm
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/ws/**").permitAll()
                        .requestMatchers(
                                "/api/auth/refresh-token",
                                "/api/auth/logout",
                                "/api/games/join",
                                "/api/games/{gameId}/answer",
                                "/api/quizzes/published"
                        ).permitAll()
                        .requestMatchers("/api/quizzes/**", "/api/questions/**", "/api/files/upload/**")
                        .hasAnyAuthority(UserRole.USER.name(), UserRole.ADMIN.name())
                        .requestMatchers("/api/admin/**")
                        .hasAuthority(UserRole.ADMIN.name())
                        .requestMatchers("/api/profile/**")
                        .hasAuthority(UserRole.USER.name())
                        .requestMatchers(
                                "/api/users/**",
                                "/api/users/me",
                                "/api/games/create",
                                "/api/games/{gameId}/start",
                                "/api/games/{gameId}/end"
                        ).authenticated()
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
                        .jwt(jwt -> jwt.jwtAuthenticationConverter(jwtAuthenticationConverter()))
                )
                .addFilterBefore(new CookieJwtFilter(),
                        AbstractPreAuthenticatedProcessingFilter.class);

        return http.build();
    }

    /**
     * Filter để lấy accessToken từ cookie và gắn vào header Authorization
     */
    public static class CookieJwtFilter extends AbstractPreAuthenticatedProcessingFilter {
        @Override
        public void doFilter(jakarta.servlet.ServletRequest request, jakarta.servlet.ServletResponse response, FilterChain filterChain)
                throws ServletException, IOException {
            HttpServletRequest httpRequest = (HttpServletRequest) request;
            HttpServletResponse httpResponse = (HttpServletResponse) response;

            // Bỏ qua bộ lọc cho /ws/**
            if (httpRequest.getRequestURI().startsWith("/ws/")) {
                filterChain.doFilter(request, response);
                return;
            }

            String accessToken = null;
            Cookie[] cookies = httpRequest.getCookies();
            if (cookies != null) {
                for (Cookie cookie : cookies) {
                    if ("accessToken".equals(cookie.getName())) {
                        accessToken = cookie.getValue();
                        break;
                    }
                }
            }

            HttpServletRequest wrappedRequest = accessToken != null && !accessToken.isEmpty()
                    ? new AuthHeaderRequestWrapper(httpRequest, "Bearer " + accessToken)
                    : httpRequest;

            filterChain.doFilter(wrappedRequest, httpResponse);
        }

        @Override
        protected Object getPreAuthenticatedPrincipal(HttpServletRequest request) {
            return null;
        }

        @Override
        protected Object getPreAuthenticatedCredentials(HttpServletRequest request) {
            return null;
        }
    }

    /**
     * Wrapper để trả về header Authorization từ cookie
     */
    private static class AuthHeaderRequestWrapper extends HttpServletRequestWrapper {
        private final String authHeader;

        AuthHeaderRequestWrapper(HttpServletRequest request, String authHeader) {
            super(request);
            this.authHeader = authHeader;
        }

        @Override
        public String getHeader(String name) {
            if ("Authorization".equalsIgnoreCase(name)) {
                return authHeader;
            }
            return super.getHeader(name);
        }

        @Override
        public java.util.Enumeration<String> getHeaders(String name) {
            if ("Authorization".equalsIgnoreCase(name)) {
                return Collections.enumeration(Arrays.asList(authHeader));
            }
            return super.getHeaders(name);
        }

        @Override
        public java.util.Enumeration<String> getHeaderNames() {
            List<String> names = Collections.list(super.getHeaderNames());
            names.add("Authorization");
            return Collections.enumeration(names);
        }
    }

    @Bean
    public RSAPublicKey publicKey() throws Exception {
        try (InputStream is = publicKeyPath.getInputStream()) {
            String pem = new String(is.readAllBytes(), StandardCharsets.UTF_8)
                    .replace("-----BEGIN PUBLIC KEY-----", "")
                    .replace("-----END PUBLIC KEY-----", "")
                    .replaceAll("\\s", "");
            byte[] bytes = Base64.getDecoder().decode(pem);
            X509EncodedKeySpec spec = new X509EncodedKeySpec(bytes);
            return (RSAPublicKey) KeyFactory.getInstance("RSA").generatePublic(spec);
        }
    }

    @Bean
    public RSAPrivateKey privateKey() throws Exception {
        try (InputStream is = privateKeyPath.getInputStream()) {
            String pem = new String(is.readAllBytes(), StandardCharsets.UTF_8)
                    .replace("-----BEGIN PRIVATE KEY-----", "")
                    .replace("-----END PRIVATE KEY-----", "")
                    .replaceAll("\\s", "");
            byte[] bytes = Base64.getDecoder().decode(pem);
            PKCS8EncodedKeySpec spec = new PKCS8EncodedKeySpec(bytes);
            return (RSAPrivateKey) KeyFactory.getInstance("RSA").generatePrivate(spec);
        }
    }

    @Bean
    public JwtDecoder jwtDecoder(RSAPublicKey publicKey) {
        return NimbusJwtDecoder.withPublicKey(publicKey).build();
    }

    @Bean
    public JwtEncoder jwtEncoder(RSAPublicKey publicKey, RSAPrivateKey privateKey) {
        JWK jwk = new RSAKey.Builder(publicKey)
                .privateKey(privateKey)
                .build();
        JWKSource<SecurityContext> jwkSrc = new ImmutableJWKSet<>(new JWKSet(jwk));
        return new NimbusJwtEncoder(jwkSrc);
    }

    @Bean
    public JwtAuthenticationConverter jwtAuthenticationConverter() {
        JwtGrantedAuthoritiesConverter gaConverter = new JwtGrantedAuthoritiesConverter();
        gaConverter.setAuthorityPrefix("");
        gaConverter.setAuthoritiesClaimName("roles");
        JwtAuthenticationConverter conv = new JwtAuthenticationConverter();
        conv.setJwtGrantedAuthoritiesConverter(gaConverter);
        return conv;
    }

    @Bean
    public BCryptPasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder());
        return provider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration cfg) throws Exception {
        return cfg.getAuthenticationManager();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration cfg = new CorsConfiguration();
        cfg.setAllowedOrigins(List.of("http://localhost:3000"));
        cfg.setAllowedMethods(List.of("GET","POST","PUT","PATCH","DELETE","OPTIONS"));
        cfg.setAllowedHeaders(List.of("*"));
        cfg.setExposedHeaders(List.of("Authorization"));
        cfg.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource src = new UrlBasedCorsConfigurationSource();
        src.registerCorsConfiguration("/**", cfg);
        return src;
    }
}
