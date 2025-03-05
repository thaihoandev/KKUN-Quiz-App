package com.kkunquizapp.QuizAppBackend.service.impl;

import com.kkunquizapp.QuizAppBackend.dto.AuthResponseDTO;
import com.kkunquizapp.QuizAppBackend.dto.UserRequestDTO;
import com.kkunquizapp.QuizAppBackend.dto.UserResponseDTO;
import com.kkunquizapp.QuizAppBackend.exception.DuplicateEntityException;
import com.kkunquizapp.QuizAppBackend.exception.InvalidRequestException;
import com.kkunquizapp.QuizAppBackend.model.User;
import com.kkunquizapp.QuizAppBackend.model.UserPrincipal;
import com.kkunquizapp.QuizAppBackend.model.enums.UserRole;
import com.kkunquizapp.QuizAppBackend.repo.UserRepo;
import com.kkunquizapp.QuizAppBackend.service.AuthService;
import com.kkunquizapp.QuizAppBackend.service.CustomUserDetailsService;
import com.kkunquizapp.QuizAppBackend.service.JwtService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.apache.commons.lang3.RandomStringUtils;
import org.modelmapper.ModelMapper;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import static com.kkunquizapp.QuizAppBackend.helper.validateHelper.isEmailFormat;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {
    private final JwtService jwtService;
    private final UserRepo userRepo;
    private final BCryptPasswordEncoder encoder;
    private final AuthenticationManager authManager;
    private final ModelMapper modelMapper;

    private final CustomUserDetailsService customUserDetailsService;

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
        user.setPassword(encoder.encode(userRequestDTO.getPassword()));
        user.setRole(UserRole.USER);
        user.setActive(true);
        User savedUser = userRepo.save(user);

        return modelMapper.map(savedUser, UserResponseDTO.class);
    }

    @Override
    public AuthResponseDTO verify(UserRequestDTO userRequestDTO) {
        Authentication authentication = authManager.authenticate(
                new UsernamePasswordAuthenticationToken(userRequestDTO.getUsername(), userRequestDTO.getPassword())
        );

        if (authentication.isAuthenticated()) {
            UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();
            Map<String, String> tokens = jwtService.generateTokens(userPrincipal);

            return AuthResponseDTO.builder()
                    .accessToken(tokens.get("accessToken"))
                    .refreshToken(tokens.get("refreshToken"))
                    .type("Bearer")
                    .username(userPrincipal.getUsername())
                    .roles(userPrincipal.getAuthorities().stream()
                            .map(auth -> auth.getAuthority())
                            .collect(Collectors.toList()))
                    .build();
        }

        throw new IllegalArgumentException("Invalid username or password");
    }

    @Transactional
    @Override
    public AuthResponseDTO authenticateWithGoogle(String accessToken) {
        try {
            RestTemplate restTemplate = new RestTemplate();
            String googleUserInfoUrl = "https://www.googleapis.com/oauth2/v1/userinfo?access_token=" + accessToken;
            ResponseEntity<Map> response = restTemplate.getForEntity(googleUserInfoUrl, Map.class);

            if (!response.getStatusCode().is2xxSuccessful()) {
                throw new IllegalArgumentException("Invalid Google Access Token");
            }

            Map<String, Object> userInfo = response.getBody();
            String email = (String) userInfo.get("email");
            String name = (String) userInfo.get("name");
            String avatar = (String) userInfo.get("picture"); // Lấy avatar từ Google

            Optional<User> existingUser = userRepo.findByEmail(email);
            User user;

            if (existingUser.isPresent()) {
                user = existingUser.get();
                // Nếu avatar thay đổi, cập nhật lại
                if (avatar != null && !avatar.equals(user.getAvatar())) {
                    user.setAvatar(avatar);
                    userRepo.save(user);
                }
            } else {
                user = new User();
                user.setEmail(email);
                user.setUsername(email);
                user.setRole(UserRole.USER);
                user.setAvatar(avatar); // Lưu avatar vào database
                user.setActive(true);

                // Sinh mật khẩu ngẫu nhiên
                String randomPassword = RandomStringUtils.randomAlphanumeric(10);
                user.setPassword(encoder.encode(randomPassword));

                userRepo.save(user);
            }

            UserPrincipal userPrincipal = new UserPrincipal(user);
            Map<String, String> tokens = jwtService.generateTokens(userPrincipal);

            return AuthResponseDTO.builder()
                    .accessToken(tokens.get("accessToken"))
                    .refreshToken(tokens.get("refreshToken"))
                    .type("Bearer")
                    .username(userPrincipal.getUsername())
                    .roles(userPrincipal.getAuthorities().stream()
                            .map(auth -> auth.getAuthority())
                            .collect(Collectors.toList()))
                    .build();

        } catch (Exception e) {
            throw new IllegalArgumentException("Google authentication failed");
        }
    }

    public String getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication != null && authentication.getPrincipal() instanceof Jwt) {
            Jwt jwt = (Jwt) authentication.getPrincipal();
            return jwt.getClaim("userId"); // Lấy userId từ JWT claims
        }

        throw new IllegalStateException("Không thể lấy userId từ Access Token");
    }

    public String refreshAccessToken(String refreshToken) {
        if (refreshToken == null || refreshToken.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Refresh token is required");
        }

        try {
            // Giải mã refreshToken và lấy thông tin user
            Map<String, Object> userInfo = jwtService.getUserInfoFromToken(refreshToken);
            String username = (String) userInfo.get("username");

            // Tìm user từ database
            UserDetails userDetails = customUserDetailsService.loadUserByUsername(username);
            UserPrincipal userPrincipal = (UserPrincipal) userDetails;

            // Tạo Access Token mới
            return jwtService.generateTokens(userPrincipal).get("accessToken");
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid refresh token");
        }
    }
}
