package com.kkunquizapp.QuizAppBackend.service.impl;

import com.kkunquizapp.QuizAppBackend.dto.AuthResponseDTO;
import com.kkunquizapp.QuizAppBackend.model.User;
import com.kkunquizapp.QuizAppBackend.model.UserPrincipal;
import com.kkunquizapp.QuizAppBackend.model.enums.UserRole;
import com.kkunquizapp.QuizAppBackend.repo.UserRepo;
import com.kkunquizapp.QuizAppBackend.service.AuthService;
import com.kkunquizapp.QuizAppBackend.service.JwtService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.RandomStringUtils;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class AuthServiceImpl implements AuthService {
    private final JwtService jwtService;
    private final UserRepo userRepo;
    private final BCryptPasswordEncoder encoder;

    public AuthServiceImpl(JwtService jwtService, UserRepo userRepo) {
        this.jwtService = jwtService;
        this.userRepo = userRepo;
        this.encoder = new BCryptPasswordEncoder(12); // Sử dụng BCrypt với độ mạnh 12
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

            // Kiểm tra xem user đã tồn tại chưa
            Optional<User> existingUser = userRepo.findByEmail(email);
            User user;
            if (existingUser.isPresent()) {
                user = existingUser.get();
            } else {
                // Nếu chưa có user, tạo mới
                user = new User();
                user.setEmail(email);
                user.setUsername(email);
//                user.setAuthProvider("GOOGLE"); // Đánh dấu là tài khoản Google
                user.setRole(UserRole.USER);
                // Sinh mật khẩu ngẫu nhiên
                String randomPassword = RandomStringUtils.randomAlphanumeric(10);
                user.setPassword(encoder.encode(randomPassword));

                userRepo.save(user);
            }

            // Lấy UserPrincipal từ User
            UserPrincipal userPrincipal = new UserPrincipal(user);

            // Tạo JWT từ backend
            String token = jwtService.generateToken(userPrincipal);

            return AuthResponseDTO.builder()
                    .token(token)
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

}
