package com.kkunquizapp.QuizAppBackend.auth.service.impl;

import com.kkunquizapp.QuizAppBackend.auth.model.RefreshToken;
import com.kkunquizapp.QuizAppBackend.auth.repository.RefreshTokenRepository;
import com.kkunquizapp.QuizAppBackend.auth.utils.TokenHashUtil;
import com.kkunquizapp.QuizAppBackend.common.exception.DuplicateEntityException;
import com.kkunquizapp.QuizAppBackend.common.exception.InvalidRequestException;
import com.kkunquizapp.QuizAppBackend.user.dto.UserRequestDTO;
import com.kkunquizapp.QuizAppBackend.user.dto.UserResponseDTO;
import com.kkunquizapp.QuizAppBackend.user.model.User;
import com.kkunquizapp.QuizAppBackend.user.model.UserPrincipal;
import com.kkunquizapp.QuizAppBackend.user.model.enums.UserRole;
import com.kkunquizapp.QuizAppBackend.user.repository.UserRepo;
import com.kkunquizapp.QuizAppBackend.auth.service.AuthService;
import com.kkunquizapp.QuizAppBackend.user.service.CustomUserDetailsService;
import com.kkunquizapp.QuizAppBackend.auth.service.JwtService;
import jakarta.annotation.PostConstruct;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.modelmapper.Converter;
import org.modelmapper.ModelMapper;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.*;

import static com.kkunquizapp.QuizAppBackend.common.helper.validateHelper.isEmailFormat;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthServiceImpl implements AuthService {

    // ========== DEPENDENCIES ==========
    private final JwtService jwtService;
    private final UserRepo userRepo;
    private final AuthenticationManager authManager;
    private final ModelMapper modelMapper;
    private final CustomUserDetailsService customUserDetailsService;
    private final PasswordEncoder passwordEncoder;
    private final RefreshTokenRepository refreshTokenRepository;

    // ========== INIT MODELMAPPER ==========
    @PostConstruct
    public void initModelMapper() {
        Converter<UserRole, List<String>> roleToListConverter = ctx ->
                ctx.getSource() != null ? Collections.singletonList(ctx.getSource().name()) : null;

        modelMapper.typeMap(User.class, UserResponseDTO.class)
                .addMappings(mapper -> mapper.using(roleToListConverter)
                        .map(User::getRole, UserResponseDTO::setRoles));
    }

    // ============================================================
    // REGISTER
    // ============================================================
    @Override
    @Transactional
    public UserResponseDTO register(UserRequestDTO userRequestDTO) {
        log.info("Registering user: {}", userRequestDTO.getUsername());

        // 1️⃣ Validate username format
        if (isEmailFormat(userRequestDTO.getUsername())) {
            throw new InvalidRequestException("Username cannot be in email format: " + userRequestDTO.getUsername());
        }

        // 2️⃣ Check email exists
        if (userRepo.existsByEmail(userRequestDTO.getEmail())) {
            throw new DuplicateEntityException("Email already exists: " + userRequestDTO.getEmail());
        }

        // 3️⃣ Check username exists
        if (userRepo.existsByUsername(userRequestDTO.getUsername())) {
            throw new DuplicateEntityException("Username already exists: " + userRequestDTO.getUsername());
        }

        // 4️⃣ Create new user
        User user = modelMapper.map(userRequestDTO, User.class);
        user.setPassword(passwordEncoder.encode(userRequestDTO.getPassword()));
        user.setRole(UserRole.USER);
        user.setActive(true);

        // 5️⃣ Save user
        User savedUser = userRepo.save(user);
        log.info("User registered successfully: {}", savedUser.getUsername());

        return modelMapper.map(savedUser, UserResponseDTO.class);
    }

    // ============================================================
    // VERIFY & GENERATE TOKENS (USERNAME/PASSWORD LOGIN)
    // ============================================================
    @Override
    @Transactional
    public Map<String, Object> verifyAndGenerateTokens(UserRequestDTO userRequestDTO) {
        log.info("Authenticating user: {}", userRequestDTO.getUsername());

        try {
            // 1️⃣ Authenticate with username/password
            Authentication authentication = authManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            userRequestDTO.getUsername(),
                            userRequestDTO.getPassword()
                    )
            );

            UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();

            // 2️⃣ Generate tokens
            Map<String, String> tokens = jwtService.generateTokens(userPrincipal);

            // 3️⃣ Find user & check active
            Optional<User> userOpt = userRepo.findByUsername(userPrincipal.getUsername());
            if (userOpt.isEmpty() || !userOpt.get().isActive()) {
                throw new InvalidRequestException("This account is deactivated or not found");
            }

            User user = userOpt.get();

            // 4️⃣ Save refresh token to DB
            saveRefreshToken(user.getUserId(), tokens.get("refreshToken"));

            // 5️⃣ Map to DTO & return
            UserResponseDTO userResponse = modelMapper.map(user, UserResponseDTO.class);

            log.info("User authenticated successfully: {}", user.getUsername());

            // ✅ FIXED: Trả về cả refreshToken để Controller có thể set cookie
            return Map.of(
                    "accessToken", tokens.get("accessToken"),
                    "refreshToken", tokens.get("refreshToken"),
                    "user", userResponse
            );

        } catch (BadCredentialsException e) {
            log.warn("Bad credentials for user: {}", userRequestDTO.getUsername());
            throw new InvalidRequestException("Invalid username or password");
        }
    }

    // ============================================================
    // GOOGLE LOGIN
    // ============================================================
    @Override
    @Transactional
    public Map<String, Object> authenticateWithGoogleAndGenerateTokens(String googleAccessToken) {
        log.info("Authenticating with Google token");

        try {
            // 1️⃣ Verify Google token & get user info
            RestTemplate restTemplate = new RestTemplate();
            String googleUserInfoUrl = "https://www.googleapis.com/oauth2/v1/userinfo?access_token=" + googleAccessToken;
            ResponseEntity<Map> response = restTemplate.getForEntity(googleUserInfoUrl, Map.class);

            if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
                throw new IllegalArgumentException("Invalid Google Access Token");
            }

            Map<String, Object> userInfo = response.getBody();
            String email = (String) userInfo.get("email");
            String name = (String) userInfo.get("name");
            String picture = (String) userInfo.get("picture");

            if (email == null || email.isBlank()) {
                throw new IllegalArgumentException("Google account has no email");
            }

            // 2️⃣ Find or create user
            User user = userRepo.findByEmail(email).orElse(null);

            if (user == null) {
                log.info("Creating new user from Google account: {}", email);
                user = new User();
                user.setEmail(email);
                user.setUsername(generateUniqueUsernameFromEmail(email));
                user.setRole(UserRole.USER);
                user.setName(name);
                user.setAvatar(picture);
                user.setActive(true);

                // Random password for Google users
                String randomPassword = org.apache.commons.lang3.RandomStringUtils.randomAlphanumeric(12);
                user.setPassword(passwordEncoder.encode(randomPassword));

                user = userRepo.save(user);
            } else {
                // Update avatar if needed
                if ((user.getAvatar() == null || user.getAvatar().isBlank())
                        && picture != null && !picture.isBlank()) {
                    user.setAvatar(picture);
                    userRepo.save(user);
                }
            }

            // 3️⃣ Generate tokens
            UserPrincipal principal = new UserPrincipal(user);
            Map<String, String> tokens = jwtService.generateTokens(principal);

            // 4️⃣ Save refresh token to DB
            saveRefreshToken(user.getUserId(), tokens.get("refreshToken"));

            // 5️⃣ Map to DTO & return
            UserResponseDTO userResponse = modelMapper.map(user, UserResponseDTO.class);

            log.info("Google authentication successful for: {}", email);

            // ✅ Trả về cả refreshToken để Controller có thể set cookie
            return Map.of(
                    "accessToken", tokens.get("accessToken"),
                    "refreshToken", tokens.get("refreshToken"),
                    "user", userResponse
            );

        } catch (Exception e) {
            log.error("Google authentication failed", e);
            throw new IllegalArgumentException("Google authentication failed: " + e.getMessage());
        }
    }

    // ============================================================
    // GENERATE TOKENS FOR USER (USED IN REGISTER/LOGIN)
    // ============================================================
    @Override
    @Transactional
    public Map<String, String> generateTokensForUser(String username) {
        log.info("Generating tokens for user: {}", username);

        // 1️⃣ Load user details
        UserDetails userDetails = customUserDetailsService.loadUserByUsername(username);
        UserPrincipal userPrincipal = (UserPrincipal) userDetails;

        // 2️⃣ Generate tokens
        Map<String, String> tokens = jwtService.generateTokens(userPrincipal);

        // 3️⃣ Save refresh token to DB
        saveRefreshToken(userPrincipal.getUserId(), tokens.get("refreshToken"));

        log.info("Tokens generated successfully for: {}", username);

        return tokens;
    }

    // ============================================================
    // REFRESH ACCESS TOKEN (WITH RTR - REFRESH TOKEN ROTATION)
    // ============================================================
    @Override
    @Transactional
    public Map<String, String> refreshAccessToken(String oldRefreshToken) {
        log.info("Refreshing access token");

        if (oldRefreshToken == null || oldRefreshToken.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Refresh token is required");
        }

        try {
            // 1️⃣ Hash the refresh token
            String tokenHash = TokenHashUtil.hashToken(oldRefreshToken);

            // 2️⃣ Find token in DB
            RefreshToken tokenEntity = refreshTokenRepository.findByTokenHash(tokenHash)
                    .orElseThrow(() -> {
                        log.warn("Refresh token not found in DB");
                        return new JwtException("Invalid refresh token");
                    });

            // 3️⃣ Check if token is valid (not revoked & not expired)
            if (!tokenEntity.isValid()) {
                log.warn("Refresh token is invalid - revoked: {}, expired: {}",
                        tokenEntity.isRevoked(), tokenEntity.isExpired());
                throw new JwtException("Refresh token expired or revoked");
            }

            // 4️⃣ Get user info from JWT token
            Map<String, Object> userInfo = jwtService.getUserInfoFromToken(oldRefreshToken);
            String username = (String) userInfo.get("username");

            // 5️⃣ Load user details
            UserDetails userDetails = customUserDetailsService.loadUserByUsername(username);
            UserPrincipal userPrincipal = (UserPrincipal) userDetails;

            // 6️⃣ Generate new tokens
            Map<String, String> newTokens = jwtService.generateTokens(userPrincipal);

            // 7️⃣ ❗ INVALIDATE OLD TOKEN (RTR - Refresh Token Rotation)
            tokenEntity.setRevokedAt(LocalDateTime.now());
            refreshTokenRepository.save(tokenEntity);
            log.info("Old refresh token revoked");

            // 8️⃣ SAVE NEW REFRESH TOKEN TO DB
            saveRefreshToken(userPrincipal.getUserId(), newTokens.get("refreshToken"));

            log.info("Access token refreshed successfully for: {}", username);

            // ✅ TRẢ VỀ CẢ HAI TOKEN
            return Map.of(
                    "accessToken", newTokens.get("accessToken"),
                    "refreshToken", newTokens.get("refreshToken")
            );

        } catch (JwtException e) {
            log.error("JWT exception during token refresh", e);
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid refresh token");
        } catch (Exception e) {
            log.error("Error refreshing token", e);
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Token refresh failed");
        }
    }


    // ============================================================
    // LOGOUT - REVOKE REFRESH TOKEN
    // ============================================================
    @Override
    @Transactional
    public void logout(String refreshToken) {
        log.info("Logging out user");

        if (refreshToken == null || refreshToken.isBlank()) {
            log.warn("Logout called with empty refresh token");
            return;
        }

        try {
            String tokenHash = TokenHashUtil.hashToken(refreshToken);

            refreshTokenRepository.findByTokenHash(tokenHash).ifPresentOrElse(
                    token -> {
                        if (!token.isRevoked()) {
                            token.setRevokedAt(LocalDateTime.now());
                            refreshTokenRepository.save(token);
                            log.info("Refresh token revoked during logout");
                        }
                    },
                    () -> log.warn("Refresh token not found during logout")
            );
        } catch (Exception e) {
            log.error("Error during logout", e);
        }
    }

    // ============================================================
    // GET CURRENT USER ID FROM SECURITY CONTEXT
    // ============================================================
    @Override
    public String getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()) {
            throw new IllegalStateException("No authenticated user");
        }

        Object principal = authentication.getPrincipal();

        if (principal instanceof Jwt jwt) {
            return jwt.getClaim("userId");
        } else if (principal instanceof UserPrincipal userPrincipal) {
            return userPrincipal.getUserId().toString();
        }

        throw new IllegalStateException("Unsupported principal type: " + principal.getClass().getSimpleName());
    }

    // ============================================================
    // HELPER: SAVE REFRESH TOKEN TO DB
    // ============================================================
    private void saveRefreshToken(UUID userId, String refreshToken) {
        String tokenHash = TokenHashUtil.hashToken(refreshToken);

        RefreshToken entity = RefreshToken.builder()
                .userId(userId)
                .tokenHash(tokenHash)
                .expiresAt(LocalDateTime.now().plusDays(7))
                .build();

        refreshTokenRepository.save(entity);
    }

    // ============================================================
    // HELPER: GENERATE UNIQUE USERNAME FROM EMAIL
    // ============================================================
    private String generateUniqueUsernameFromEmail(String email) {
        String base = email.substring(0, email.indexOf('@')).replaceAll("[^a-zA-Z0-9._-]", "");
        if (base.isBlank()) base = "user";

        String candidate = base;
        int i = 1;

        while (userRepo.findByUsername(candidate).isPresent()) {
            candidate = base + i++;
        }

        return candidate;
    }
}