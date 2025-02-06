package com.kkunquizapp.QuizAppBackend.controller;

import com.kkunquizapp.QuizAppBackend.dto.AuthResponseDTO;
import com.kkunquizapp.QuizAppBackend.dto.UserRequestDTO;
import com.kkunquizapp.QuizAppBackend.dto.UserResponseDTO;
import com.kkunquizapp.QuizAppBackend.model.User;
import com.kkunquizapp.QuizAppBackend.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
public class AuthController {
    @Autowired
    private UserService service;


    @PostMapping("/register")
    public UserResponseDTO register(@RequestBody UserRequestDTO user) {
        return service.register(user);

    }

    @PostMapping("/login")
    public AuthResponseDTO login(@RequestBody UserRequestDTO user) {

        return service.verify(user);
    }
//    @PostMapping("/google")
//    public ResponseEntity<?> registerOrLoginWithGoogle(@RequestParam("token") String token) {
//        try {
//            // Gọi service để xử lý token từ Google
//            User user = authService.verifyAndRegisterGoogleUser(token);
//            return ResponseEntity.ok(user); // Trả về thông tin người dùng hoặc JWT
//        } catch (Exception e) {
//            return ResponseEntity.badRequest().body(e.getMessage());
//        }
//    }
}
