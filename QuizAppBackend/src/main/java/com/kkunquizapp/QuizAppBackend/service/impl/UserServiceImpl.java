package com.kkunquizapp.QuizAppBackend.service.impl;

import com.cloudinary.Cloudinary;
import com.kkunquizapp.QuizAppBackend.dto.UserRequestDTO;
import com.kkunquizapp.QuizAppBackend.dto.UserResponseDTO;
import com.kkunquizapp.QuizAppBackend.dto.AuthResponseDTO;
import com.kkunquizapp.QuizAppBackend.exception.DuplicateEntityException;
import com.kkunquizapp.QuizAppBackend.exception.InvalidRequestException;
import com.kkunquizapp.QuizAppBackend.exception.UserNotFoundException;
import com.kkunquizapp.QuizAppBackend.model.User;
import com.kkunquizapp.QuizAppBackend.model.UserPrincipal;
import com.kkunquizapp.QuizAppBackend.model.enums.UserRole;
import com.kkunquizapp.QuizAppBackend.repo.UserRepo;
import com.kkunquizapp.QuizAppBackend.service.CloudinaryService;
import com.kkunquizapp.QuizAppBackend.service.CustomUserDetailsService;
import com.kkunquizapp.QuizAppBackend.service.JwtService;
import com.kkunquizapp.QuizAppBackend.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import org.springframework.web.multipart.MultipartFile;

// imports cần thêm
import com.kkunquizapp.QuizAppBackend.dto.FriendSuggestionDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;


import java.io.IOException;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

import static com.kkunquizapp.QuizAppBackend.helper.validateHelper.isEmailFormat;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final JwtEncoder jwtEncoder;
    private final UserRepo userRepo;
    private final ModelMapper modelMapper;
    private final BCryptPasswordEncoder encoder;
    private final CustomUserDetailsService customUserDetailsService;
    private final JwtService jwtService;
    private final Cloudinary cloudinary;
    private final CloudinaryService cloudinaryService;
    private final BCryptPasswordEncoder passwordEncoder;
    @Override
    @Transactional
    public AuthResponseDTO createOrUpdateOAuth2User(String email, String name) {
        User user = userRepo.findByEmail(email)
                .orElse(new User());

        if (user.getUserId() == null) {
            user.setEmail(email);
            user.setUsername(email.substring(0, email.indexOf('@')));
            user.setRole(UserRole.USER);
            user.setPassword(encoder.encode(UUID.randomUUID().toString()));
        }

        User savedUser = userRepo.save(user);
        UserDetails userDetails = customUserDetailsService.loadUserByUsername(savedUser.getUsername());
        Map<String, String> tokens = jwtService.generateTokens((UserPrincipal) userDetails);

        return AuthResponseDTO.builder()
                .accessToken(tokens.get("accessToken"))
                .refreshToken(tokens.get("refreshToken"))
                .type("Bearer")
                .username(savedUser.getUsername())
                .roles(List.of(savedUser.getRole().name()))
                .build();
    }

    @Override
    public List<UserResponseDTO> getAllUsers(String token) {
        Map<String, Object> userInfo = jwtService.getUserInfoFromToken(token.replace("Bearer ", ""));
        boolean isAdmin = ((List<?>) userInfo.get("roles")).contains("ROLE_ADMIN");

        // Nếu không phải admin, trả về lỗi 403
        if (!isAdmin) {
            throw new SecurityException("Bạn không có quyền truy cập");
        }

        // Chỉ admin mới truy vấn danh sách người dùng
        return userRepo.findAll().stream()
                .map(user -> modelMapper.map(user, UserResponseDTO.class))
                .collect(Collectors.toList());
    }

    @Override
    public UserResponseDTO getUserById(String userId, String token) {
        String userIdFromToken = null;
        boolean isAdmin = false;

        // Nếu có token, lấy thông tin user từ token
        if (token != null) {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication != null && authentication.getPrincipal() instanceof Jwt jwt) {
                userIdFromToken = jwt.getClaim("userId");
                List<String> roles = jwt.getClaim("roles");
                isAdmin = roles.contains(UserRole.ADMIN.name());
            }
        }

        // Lấy thông tin người dùng
        User user = userRepo.findById(UUID.fromString(userId))
                .orElseThrow(() -> new UserNotFoundException("User not found with ID: " + userId));

        // Map to DTO
        UserResponseDTO dto = modelMapper.map(user, UserResponseDTO.class);

        // Nếu không phải owner hoặc admin, ẩn thông tin nhạy cảm (như email)
        boolean isOwner = userIdFromToken != null && userIdFromToken.equals(userId);
        if (!isAdmin && !isOwner) {
            dto.setEmail(null); // Ẩn email
            dto.setRoles(null);
            dto.setUsername(null);
            // Có thể ẩn thêm fields nhạy cảm khác nếu cần
        }

        return dto;
    }

    @Override
    @Transactional
    public void restoreUser(UUID id) {
        // Lấy user cần restore
        User user = userRepo.findById(id)
                .orElseThrow(() -> new UserNotFoundException("User not found with ID: " + id));

        // Chỉ admin mới được restore
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (!(authentication != null && authentication.getPrincipal() instanceof Jwt jwt)) {
            throw new SecurityException("Invalid Access Token");
        }

        @SuppressWarnings("unchecked")
        List<String> roles = jwt.getClaim("roles");
        boolean isAdmin = roles != null && roles.contains(UserRole.ADMIN.name());
        if (!isAdmin) {
            throw new SecurityException("You do not have permission to restore this user");
        }

        // Nếu đã active rồi thì idempotent
        if (user.isActive()) {
            return;
        }

        user.setActive(true);
        user.setUpdatedAt(LocalDateTime.now());
        userRepo.save(user);
    }

    @Override
    @Transactional
    public UserResponseDTO updateUser(UUID id, UserRequestDTO userRequestDTO) {
        User existingUser = userRepo.findById(id)
                .orElseThrow(() -> new UserNotFoundException("User not found with ID: " + id));

        // Validate email format
        if (userRequestDTO.getEmail() != null && !isEmailFormat(userRequestDTO.getEmail())) {
            throw new InvalidRequestException("Invalid email format");
        }

        // Check for duplicate email (if changed)
        if (userRequestDTO.getEmail() != null && !userRequestDTO.getEmail().equals(existingUser.getEmail())) {
            if (userRepo.findByEmail(userRequestDTO.getEmail()).isPresent()) {
                throw new DuplicateEntityException("Email already in use");
            }
            existingUser.setEmail(userRequestDTO.getEmail());
        }

        // Update fields if provided
        if (userRequestDTO.getUsername() != null && !userRequestDTO.getUsername().isEmpty()) {
            existingUser.setUsername(userRequestDTO.getUsername());
        }
        if (userRequestDTO.getName() != null) {
            existingUser.setName(userRequestDTO.getName());
        }
        if (userRequestDTO.getSchool() != null) {
            existingUser.setSchool(userRequestDTO.getSchool());
        }
        if (userRequestDTO.getPassword() != null && !userRequestDTO.getPassword().isEmpty()) {
            existingUser.setPassword(encoder.encode(userRequestDTO.getPassword()));
        }
        if (userRequestDTO.getRole() != null) {
            try {
                UserRole role = UserRole.valueOf(userRequestDTO.getRole().toUpperCase());
                existingUser.setRole(role);
            } catch (IllegalArgumentException e) {
                throw new InvalidRequestException("Invalid role: " + userRequestDTO.getRole());
            }
        }

        // Save updated user
        User updatedUser = userRepo.save(existingUser);
        return modelMapper.map(updatedUser, UserResponseDTO.class);
    }

    @Override
    public void deleteUser(UUID id) {
        if (!userRepo.existsById(id)) {
            throw new UserNotFoundException("User not found with ID: " + id);
        }
        userRepo.deleteById(id);
    }

    @Override
    @Transactional
    public void deleteSoftUser(UUID id, String password) {
        // Lấy user cần xóa
        User user = userRepo.findById(id)
                .orElseThrow(() -> new UserNotFoundException("User not found with ID: " + id));

        // Kiểm tra quyền: admin hoặc chính chủ
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (!(authentication != null && authentication.getPrincipal() instanceof Jwt jwt)) {
            throw new SecurityException("Invalid Access Token");
        }

        String userIdFromToken = jwt.getClaim("userId");
        @SuppressWarnings("unchecked")
        List<String> roles = jwt.getClaim("roles");
        boolean isAdmin = roles != null && roles.contains(UserRole.ADMIN.name());

        if (!isAdmin && !id.toString().equals(userIdFromToken)) {
            throw new SecurityException("You do not have permission to delete this user");
        }

        // ✅ Kiểm tra mật khẩu (bắt buộc nếu không phải admin)
        if (!isAdmin) {
            if (password == null || password.isBlank()) {
                throw new IllegalArgumentException("Password is required to delete account");
            }
            if (!passwordEncoder.matches(password, user.getPassword())) {
                throw new SecurityException("Invalid password");
            }
        }

        // Đã soft-delete trước đó thì thôi (idempotent)
        if (!user.isActive()) {
            return;
        }

        // Thực hiện soft delete
        user.setActive(false);
        user.setUpdatedAt(LocalDateTime.now());
        userRepo.save(user);
    }


    @Override
    @Transactional
    public UserResponseDTO updateUserAvatar(UUID id, MultipartFile file, String token) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (!(authentication.getPrincipal() instanceof Jwt jwt)) {
            throw new SecurityException("Invalid Access Token");
        }
        String userIdFromToken = jwt.getClaim("userId");
        List<String> roles = jwt.getClaim("roles");
        boolean isAdmin = roles.contains(UserRole.ADMIN.name());
        if (!isAdmin && !userIdFromToken.equals(id.toString())) {
            throw new SecurityException("You do not have permission to update this user's avatar");
        }

        User user = userRepo.findById(id)
                .orElseThrow(() -> new UserNotFoundException("User not found with ID: " + id));

        try {
            if (file == null || file.isEmpty()) {
                throw new IllegalArgumentException("Avatar file cannot be empty");
            }

            // public_id cố định để luôn overwrite
            String publicId = "user_avatars/" + id;
            Map uploadResult = cloudinaryService.upload(file, publicId);

            String avatarUrl = (String) uploadResult.get("secure_url"); // sẽ có /v1234567890/ trong URL
            user.setAvatar(avatarUrl);
            user.setUpdatedAt(LocalDateTime.now());

            User updatedUser = userRepo.save(user);
            return modelMapper.map(updatedUser, UserResponseDTO.class);
        } catch (IOException e) {
            throw new RuntimeException("Failed to upload avatar to Cloudinary: " + e.getMessage(), e);
        }
    }

    // ==================== NEW: changePassword ====================
    @Override
    @Transactional
    public void changePassword(UUID userId, String currentPassword, String newPassword) {
        if (currentPassword == null || currentPassword.isBlank()
                || newPassword == null || newPassword.isBlank()) {
            throw new InvalidRequestException("Password must not be blank");
        }

        // (tuỳ chọn) chính sách độ mạnh
        if (newPassword.length() < 8) {
            throw new InvalidRequestException("New password must be at least 8 characters");
        }

        User user = userRepo.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("User not found with ID: " + userId));

        // Kiểm tra mật khẩu hiện tại đúng không
        if (!encoder.matches(currentPassword, user.getPassword())) {
            throw new InvalidRequestException("Current password is incorrect");
        }

        // Đặt mật khẩu mới (setter đã tự encode)
        user.setPassword(newPassword);
        user.setUpdatedAt(LocalDateTime.now());
        userRepo.save(user);

        // (tuỳ chọn) Invalidate refresh tokens nếu bạn có cơ chế lưu token
        // jwtService.revokeTokensForUser(userId); // ví dụ
    }

    @Override
    public String getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof UserPrincipal) {
            UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();
            return userPrincipal.getUserId().toString(); // Assuming getUserId() returns UUID or String
        }

        // Fallback to request attribute set by JwtInterceptor
        HttpServletRequest request = ((ServletRequestAttributes) RequestContextHolder.currentRequestAttributes()).getRequest();
        String userId = (String) request.getAttribute("currentUserId");
        if (userId != null) {
            return userId;
        }

        throw new IllegalStateException("Cannot get userId from Access Token or request");
    }

    @Override
    @Transactional(readOnly = true)
    public List<FriendSuggestionDTO> getFriendSuggestions(UUID currentUserId, int page, int size) {
        User me = userRepo.findById(currentUserId)
                .orElseThrow(() -> new UserNotFoundException("User not found with ID: " + currentUserId));

        // Tập bạn bè hiện tại để loại khỏi gợi ý
        Set<UUID> myFriendIds = me.getFriends().stream()
                .map(User::getUserId)
                .collect(Collectors.toSet());

        // có thể loại thêm: chính mình
        Set<UUID> excluded = new java.util.HashSet<>(myFriendIds);
        // (không cần add currentUserId vì query đã <> currentId, nhưng add cũng không sao)
        excluded.add(currentUserId);

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));

        Page<User> candidates = userRepo.findSuggestions(
                currentUserId,
                excluded,
                excluded.isEmpty(), // nếu true -> bỏ điều kiện NOT IN
                pageable
        );

        // Tính mutual friends (đếm giao giữa friends của candidate và friends của mình)
        // Lưu ý: có thể xảy ra N+1, nhưng page nhỏ (10/20) thì OK. Cần tối ưu có thể dùng query phức tạp hơn.
        return candidates.getContent().stream().map(u -> {
                    int mutual = (int) u.getFriends().stream()
                            .map(User::getUserId)
                            .filter(myFriendIds::contains)
                            .count();

                    return new FriendSuggestionDTO(
                            u.getUserId(),
                            u.getName(),
                            u.getUsername(),
                            u.getAvatar(),
                            mutual
                    );
                })
                // Sắp xếp giảm dần theo mutual, cùng mutual thì theo createdAt desc (đã sort sẵn từ pageable)
                .sorted((a, b) -> Integer.compare(b.getMutualFriends(), a.getMutualFriends()))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void addFriend(UUID requesterId, UUID targetUserId) {
        if (requesterId.equals(targetUserId)) {
            throw new InvalidRequestException("You cannot add yourself as a friend");
        }

        // Kiểm tra quyền: requesterId phải trùng userId trong token hoặc admin
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (!(authentication != null && authentication.getPrincipal() instanceof Jwt jwt)) {
            throw new SecurityException("Invalid Access Token");
        }

        String userIdFromToken = jwt.getClaim("userId");
        @SuppressWarnings("unchecked")
        List<String> roles = jwt.getClaim("roles");
        boolean isAdmin = roles != null && roles.contains(UserRole.ADMIN.name());

        if (!isAdmin && !requesterId.toString().equals(userIdFromToken)) {
            throw new SecurityException("You do not have permission to add friends for this user");
        }

        User me = userRepo.findById(requesterId)
                .orElseThrow(() -> new UserNotFoundException("Requester not found: " + requesterId));
        User target = userRepo.findById(targetUserId)
                .orElseThrow(() -> new UserNotFoundException("User to add not found: " + targetUserId));

        if (!me.isActive() || !target.isActive()) {
            throw new InvalidRequestException("Inactive accounts cannot make friend connections");
        }

        // Nếu đã là bạn rồi -> idempotent
        if (me.getFriends().stream().anyMatch(f -> f.getUserId().equals(targetUserId))) {
            return;
        }

        // Thêm bạn 2 chiều (hàm addFriend của entity đã đảm bảo 2 chiều)
        me.addFriend(target);

        // Lưu chủ sở hữu quan hệ (User là owning side của @ManyToMany vì không có mappedBy)
        userRepo.save(me);
        // (không bắt buộc) lưu target để chắc chắn đồng bộ (thường không cần)
        userRepo.save(target);
    }

}