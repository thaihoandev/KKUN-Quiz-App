package com.kkunquizapp.QuizAppBackend.auth.service.impl;

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
import org.modelmapper.Converter;
import org.modelmapper.ModelMapper;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;

import java.util.*;

import static com.kkunquizapp.QuizAppBackend.common.helper.validateHelper.isEmailFormat;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {
    private final JwtService jwtService;
    private final UserRepo userRepo;
    private final AuthenticationManager authManager;
    private final ModelMapper modelMapper;
    private final CustomUserDetailsService customUserDetailsService;
    private final PasswordEncoder passwordEncoder;   // ✅ Thêm PasswordEncoder

    @PostConstruct
    public void initModelMapper() {
        Converter<UserRole, List<String>> roleToListConverter = ctx ->
                ctx.getSource() != null ? Collections.singletonList(ctx.getSource().name()) : null;

        modelMapper.typeMap(User.class, UserResponseDTO.class)
                .addMappings(mapper -> mapper.using(roleToListConverter)
                        .map(User::getRole, UserResponseDTO::setRoles));
    }

    @Override
    @Transactional
    public UserResponseDTO register(UserRequestDTO userRequestDTO) {
        if (isEmailFormat(userRequestDTO.getUsername())) {
            throw new InvalidRequestException("Username cannot be in email format: " + userRequestDTO.getUsername());
        }

        if (userRepo.existsByEmail(userRequestDTO.getEmail())) {
            throw new DuplicateEntityException("Email already exists: " + userRequestDTO.getEmail());
        }

        if (userRepo.existsByUsername(userRequestDTO.getUsername())) {
            throw new DuplicateEntityException("Username already exists: " + userRequestDTO.getUsername());
        }

        User user = modelMapper.map(userRequestDTO, User.class);
        // ✅ Encode password
        user.setPassword(passwordEncoder.encode(userRequestDTO.getPassword()));
        user.setRole(UserRole.USER);
        user.setActive(true);
        User savedUser = userRepo.save(user);

        return modelMapper.map(savedUser, UserResponseDTO.class);
    }

    @Override
    public Map<String, Object> verifyAndGenerateTokens(UserRequestDTO userRequestDTO) {
        Authentication authentication = authManager.authenticate(
                new UsernamePasswordAuthenticationToken(userRequestDTO.getUsername(), userRequestDTO.getPassword())
        );

        if (authentication.isAuthenticated()) {
            UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();
            Map<String, String> tokens = jwtService.generateTokens(userPrincipal);

            Optional<User> userOpt = userRepo.findByUsername(userPrincipal.getUsername());
            if (userOpt.isEmpty()) {
                throw new IllegalStateException("User not found after authentication");
            }

            UserResponseDTO userResponse = modelMapper.map(userOpt.get(), UserResponseDTO.class);

            Map<String, Object> result = new HashMap<>();
            result.put("accessToken", tokens.get("accessToken"));
            result.put("refreshToken", tokens.get("refreshToken"));
            result.put("userData", userResponse);

            return result;
        }

        throw new IllegalArgumentException("Invalid username or password");
    }

    @Override
    @Transactional
    public Map<String, Object> authenticateWithGoogleAndGenerateTokens(String accessToken) {
        try {
            RestTemplate restTemplate = new RestTemplate();
            String googleUserInfoUrl =
                    "https://www.googleapis.com/oauth2/v1/userinfo?access_token=" + accessToken;
            ResponseEntity<Map> response = restTemplate.getForEntity(googleUserInfoUrl, Map.class);

            if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
                throw new IllegalArgumentException("Invalid Google Access Token");
            }

            Map<String, Object> userInfo = response.getBody();
            String email   = (String) userInfo.get("email");
            String name    = (String) userInfo.get("name");
            String picture = (String) userInfo.get("picture");

            if (email == null || email.isBlank()) {
                throw new IllegalArgumentException("Google account has no email");
            }

            User user = userRepo.findByEmail(email).orElse(null);

            if (user == null) {
                user = new User();
                user.setEmail(email);

                String uniqueUsername = generateUniqueUsernameFromEmail(email);
                user.setUsername(uniqueUsername);

                user.setRole(UserRole.USER);
                user.setName(name);
                user.setAvatar(picture);
                user.setActive(true);

                // ✅ Encode random password
                String randomPassword = org.apache.commons.lang3.RandomStringUtils.randomAlphanumeric(12);
                user.setPassword(passwordEncoder.encode(randomPassword));

                user = userRepo.save(user);
            } else {
                if ((user.getAvatar() == null || user.getAvatar().isBlank()) && picture != null && !picture.isBlank()) {
                    user.setAvatar(picture);
                    userRepo.save(user);
                }
            }

            UserResponseDTO userResponse = modelMapper.map(user, UserResponseDTO.class);
            UserPrincipal principal = new UserPrincipal(user);
            Map<String, String> tokens = jwtService.generateTokens(principal);

            Map<String, Object> result = new HashMap<>();
            result.put("accessToken", tokens.get("accessToken"));
            result.put("refreshToken", tokens.get("refreshToken"));
            result.put("userData", userResponse);
            return result;

        } catch (Exception e) {
            throw new IllegalArgumentException("Google authentication failed");
        }
    }

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

    @Override
    public Map<String, String> generateTokensForUser(String username) {
        UserDetails userDetails = customUserDetailsService.loadUserByUsername(username);
        UserPrincipal userPrincipal = (UserPrincipal) userDetails;
        return jwtService.generateTokens(userPrincipal);
    }

    @Override
    public String refreshAccessToken(String refreshToken) {
        if (refreshToken == null || refreshToken.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Refresh token is required");
        }

        try {
            Map<String, Object> userInfo = jwtService.getUserInfoFromToken(refreshToken);
            String username = (String) userInfo.get("username");

            UserDetails userDetails = customUserDetailsService.loadUserByUsername(username);
            UserPrincipal userPrincipal = (UserPrincipal) userDetails;

            return jwtService.generateTokens(userPrincipal).get("accessToken");
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid refresh token");
        }
    }

    @Override
    public String getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication != null && authentication.getPrincipal() instanceof Jwt) {
            Jwt jwt = (Jwt) authentication.getPrincipal();
            return jwt.getClaim("userId");
        }

        throw new IllegalStateException("Cannot get userId from Access Token");
    }
}
