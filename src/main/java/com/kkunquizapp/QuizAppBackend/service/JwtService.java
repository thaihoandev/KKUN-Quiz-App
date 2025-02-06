package com.kkunquizapp.QuizAppBackend.service;

import com.kkunquizapp.QuizAppBackend.model.UserPrincipal;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.stream.Collectors;

@Service
public class JwtService {
    private final JwtEncoder jwtEncoder;

    public JwtService(JwtEncoder jwtEncoder) {
        this.jwtEncoder = jwtEncoder;
    }

    public String generateToken(UserPrincipal userPrincipal) {
        Instant now = Instant.now();
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .subject(userPrincipal.getUsername())
                .issuedAt(now)
                .expiresAt(now.plus(1, ChronoUnit.HOURS))
                .claim("userId", userPrincipal.getUserId().toString())
                .claim("roles", userPrincipal.getAuthorities().stream()
                        .map(auth -> auth.getAuthority())
                        .collect(Collectors.toList()))
                .build();

        return jwtEncoder.encode(JwtEncoderParameters.from(claims)).getTokenValue();
    }
    public String getUserIdFromToken(String token) {
        try {
            // Giải mã token (NimbusJwtDecoder xử lý chữ ký trong SecurityConfig)
            var signedJWT = com.nimbusds.jwt.SignedJWT.parse(token);
            var claimsSet = signedJWT.getJWTClaimsSet();

            // Trích xuất userId từ claims
            return claimsSet.getStringClaim("userId");
        } catch (Exception e) {
            throw new IllegalArgumentException("Error decoding JWT: " + e.getMessage(), e);
        }
    }
}

