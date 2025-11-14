package com.kkunquizapp.QuizAppBackend.auth.service;

import com.kkunquizapp.QuizAppBackend.user.model.UserPrincipal;
import com.nimbusds.jwt.SignedJWT;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;

import java.security.interfaces.RSAPublicKey;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class JwtService {
    private final JwtEncoder jwtEncoder;
    private final RSAPublicKey publicKey;

    public JwtService(JwtEncoder jwtEncoder, RSAPublicKey publicKey) {
        this.jwtEncoder = jwtEncoder;
        this.publicKey = publicKey;
    }

    /**
     * Tạo Access Token và Refresh Token
     */
    public Map<String, String> generateTokens(UserPrincipal userPrincipal) {
        Instant now = Instant.now();

        // Tạo Access Token (Hết hạn sau 1 giờ)
        JwtClaimsSet accessTokenClaims = JwtClaimsSet.builder()
                .subject(userPrincipal.getUsername())
                .issuedAt(now)
                .expiresAt(now.plus(1, ChronoUnit.HOURS))
                .claim("userId", userPrincipal.getUserId().toString())
                .claim("roles", userPrincipal.getAuthorities().stream()
                        .map(auth -> auth.getAuthority())
                        .collect(Collectors.toList()))
                .build();
        String accessToken = jwtEncoder.encode(JwtEncoderParameters.from(accessTokenClaims)).getTokenValue();

        // Tạo Refresh Token (Hết hạn sau 7 ngày)
        JwtClaimsSet refreshTokenClaims = JwtClaimsSet.builder()
                .subject(userPrincipal.getUsername())
                .issuedAt(now)
                .expiresAt(now.plus(7, ChronoUnit.DAYS))
                .claim("userId", userPrincipal.getUserId().toString())
                .id(UUID.randomUUID().toString())
                .build();
        String refreshToken = jwtEncoder.encode(JwtEncoderParameters.from(refreshTokenClaims)).getTokenValue();

        // Trả về Access Token & Refresh Token
        Map<String, String> tokens = new HashMap<>();
        tokens.put("accessToken", accessToken);
        tokens.put("refreshToken", refreshToken);
        return tokens;
    }

    /**
     * Lấy userId từ token bằng cách xác thực chữ ký bằng Public Key
     */
    public String getUserIdFromToken(String token) {
        try {
            // Giải mã JWT
            SignedJWT signedJWT = SignedJWT.parse(token);

            // Kiểm tra chữ ký bằng Public Key (RSA)
            if (!signedJWT.verify(new com.nimbusds.jose.crypto.RSASSAVerifier(publicKey))) {
                throw new IllegalArgumentException("Invalid JWT signature");
            }

            return signedJWT.getJWTClaimsSet().getStringClaim("userId");
        } catch (Exception e) {
            throw new IllegalArgumentException("Error decoding JWT: " + e.getMessage(), e);
        }
    }

    /**
     * Lấy toàn bộ thông tin người dùng từ JWT
     */
    public Map<String, Object> getUserInfoFromToken(String token) {
        try {
            // Giải mã JWT
            SignedJWT signedJWT = SignedJWT.parse(token);

            // Kiểm tra chữ ký bằng Public Key
            if (!signedJWT.verify(new com.nimbusds.jose.crypto.RSASSAVerifier(publicKey))) {
                throw new IllegalArgumentException("Invalid JWT signature");
            }

            var claimsSet = signedJWT.getJWTClaimsSet();

            Map<String, Object> userInfo = new HashMap<>();
            userInfo.put("userId", claimsSet.getStringClaim("userId"));
            userInfo.put("username", claimsSet.getSubject());
            userInfo.put("roles", claimsSet.getClaim("roles"));
            return userInfo;
        } catch (Exception e) {
            throw new IllegalArgumentException("Error decoding JWT: " + e.getMessage(), e);
        }
    }
}
