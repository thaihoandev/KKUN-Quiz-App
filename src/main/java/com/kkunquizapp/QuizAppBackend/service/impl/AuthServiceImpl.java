//package com.kkunquizapp.QuizAppBackend.service.impl;
//
//package com.kkunquizapp.QuizAppBackend.service;
//
//import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
//import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
//import com.google.api.client.json.jackson2.JacksonFactory;
//import com.google.api.client.http.javanet.NetHttpTransport;
//import com.kkunquizapp.QuizAppBackend.model.User;
//import com.kkunquizapp.QuizAppBackend.repo.UserRepo;
//import com.kkunquizapp.QuizAppBackend.service.AuthService;
//import org.springframework.beans.factory.annotation.Value;
//import org.springframework.stereotype.Service;
//
//import java.util.Collections;
//
//@Service
//public class AuthServiceImpl implements AuthService {
//
//    @Value("${google.client-id}")
//    private String googleClientId;
//
//    private final UserRepo userRepo;
//
//    public AuthServiceImpl(UserRepo userRepo) {
//        this.userRepo = userRepo;
//    }
//
//    public User verifyAndRegisterGoogleUser(String idTokenString) throws Exception {
//        // Xác minh token từ Google
//        GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(new NetHttpTransport(), new JacksonFactory())
//                .setAudience(Collections.singletonList(googleClientId))
//                .build();
//
//        GoogleIdToken idToken = verifier.verify(idTokenString);
//        if (idToken != null) {
//            GoogleIdToken.Payload payload = idToken.getPayload();
//
//            // Lấy thông tin từ token
//            String email = payload.getEmail();
//            String name = (String) payload.get("name");
//
//            // Kiểm tra người dùng đã tồn tại
//            User user = userRepo.findByEmail(email);
//            if (user == null) {
//                // Tạo tài khoản mới nếu chưa tồn tại
//                user = new User();
//                user.setEmail(email);
//                user.setName(name);
//                userRepo.save(user);
//            }
//            return user;
//        } else {
//            throw new Exception("Invalid Google ID Token");
//        }
//    }
//}
