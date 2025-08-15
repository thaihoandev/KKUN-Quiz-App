package com.kkunquizapp.QuizAppBackend.service.impl;

import com.cloudinary.Cloudinary;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.kkunquizapp.QuizAppBackend.dto.*;
import com.kkunquizapp.QuizAppBackend.exception.DuplicateEntityException;
import com.kkunquizapp.QuizAppBackend.exception.InvalidRequestException;
import com.kkunquizapp.QuizAppBackend.exception.UserNotFoundException;
import com.kkunquizapp.QuizAppBackend.model.*;
import com.kkunquizapp.QuizAppBackend.model.enums.FriendshipStatus;
import com.kkunquizapp.QuizAppBackend.model.enums.UserRole;
import com.kkunquizapp.QuizAppBackend.repo.EmailChangeTokenRepo;
import com.kkunquizapp.QuizAppBackend.repo.FriendRequestRepo;
import com.kkunquizapp.QuizAppBackend.repo.UserRepo;
import com.kkunquizapp.QuizAppBackend.service.*;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import org.springframework.web.multipart.MultipartFile;

// imports cần thêm
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;


import java.io.IOException;
import java.time.LocalDateTime;
import java.time.Year;
import java.util.*;
import java.util.concurrent.TimeUnit;
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
    private final NotificationService notificationService;

    private final EmailChangeTokenRepo emailChangeTokenRepo;
    private final MailService mailService;

    private final BCryptPasswordEncoder passwordEncoder;

    private final FriendRequestRepo friendRequestRepo;

    private final StringRedisTemplate redis;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final BCryptPasswordEncoder bCrypt = new BCryptPasswordEncoder();

    @Value("${app.emailChange.otpTTLMinutes:10}")
    private int otpTTLMinutes;

    @Value("${app.emailChange.otpMaxAttempts:5}")
    private int otpMaxAttempts;

    @org.springframework.beans.factory.annotation.Value("${app.emailChange.confirmBaseUrl:https://your-domain.com/api/users/me/confirm-email-change}")
    private String confirmBaseUrl;

    @org.springframework.beans.factory.annotation.Value("${app.emailChange.ttlMinutes:30}")
    private int ttlMinutes;

    private String otpKeyForUser(UUID userId) {
        return "email:change:OTP:" + userId;
    }
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

        // Loại bạn bè hiện tại
        Set<UUID> myFriendIds = me.getFriends().stream()
                .map(User::getUserId)
                .collect(Collectors.toSet());

        // Loại chính mình
        Set<UUID> excluded = new HashSet<>(myFriendIds);
        excluded.add(currentUserId);

        // ===== Loại các user đang có PENDING (incoming + outgoing) =====
        // Outgoing: mình đã gửi yêu cầu cho họ
        friendRequestRepo.findAllByRequesterAndStatus(me, FriendRequest.Status.PENDING)
                .forEach(fr -> excluded.add(fr.getReceiver().getUserId()));

        // Incoming: họ đã gửi yêu cầu cho mình
        friendRequestRepo.findAllByReceiverAndStatus(me, FriendRequest.Status.PENDING)
                .forEach(fr -> excluded.add(fr.getRequester().getUserId()));
        // ===============================================================

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));

        // Giữ nguyên query custom của bạn (đã nhận excluded + cờ skip nếu rỗng)
        Page<User> candidates = userRepo.findSuggestions(
                currentUserId,
                excluded,
                excluded.isEmpty(),   // nếu true -> bỏ điều kiện NOT IN
                pageable
        );

        // Tính mutual friends rồi sort theo mutual desc (giữ nguyên logic cũ)
        return candidates.getContent().stream()
                .map(u -> {
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

    @Override
    @Transactional
    public void requestEmailChange(String newEmail) {
        UUID me = UUID.fromString(getCurrentUserId());

        if (newEmail == null || newEmail.isBlank()) {
            throw new InvalidRequestException("Email must not be blank");
        }
        if (!isEmailFormat(newEmail)) {
            throw new InvalidRequestException("Invalid email format");
        }

        userRepo.findByEmail(newEmail).ifPresent(u -> {
            throw new DuplicateEntityException("Email already in use");
        });

        User current = userRepo.findById(me)
                .orElseThrow(() -> new UserNotFoundException("User not found: " + me));

        if (newEmail.equalsIgnoreCase(current.getEmail())) {
            return; // idempotent: trùng email hiện tại -> bỏ qua
        }

        // Chỉ giữ 1 token cho 1 user
        emailChangeTokenRepo.deleteByUserId(me);

        String token = java.util.UUID.randomUUID().toString();
        EmailChangeToken ect = EmailChangeToken.builder()
                .userId(me)
                .newEmail(newEmail.trim())
                .token(token)
                .expiresAt(LocalDateTime.now().plusMinutes(ttlMinutes))
                .used(false)
                .build();
        emailChangeTokenRepo.save(ect);

        // FE-first confirm
        String verifyLink = confirmBaseUrl + "?token=" + token;
        String subject = "Xác nhận đổi địa chỉ email";
        String html = """
        <p>Xin chào,</p>
        <p>Bạn vừa yêu cầu đổi email đăng nhập. Nhấn vào nút bên dưới để xác nhận:</p>
        <p><a href="%s" style="display:inline-block;padding:10px 16px;border-radius:6px;background:#4f46e5;color:#fff;text-decoration:none;">Xác nhận đổi email</a></p>
        <p>Nếu nút không hoạt động, hãy copy link: <br/>%s</p>
        <p>Liên kết sẽ hết hạn sau %d phút. Nếu bạn không yêu cầu, hãy bỏ qua email này.</p>
    """.formatted(verifyLink, verifyLink, ttlMinutes);

        mailService.sendEmail(newEmail, subject, html);
    }

    @Override
    @Transactional
    public void confirmEmailChange(String token) {
        if (token == null || token.isBlank()) {
            throw new InvalidRequestException("Token is required");
        }
        EmailChangeToken ect = emailChangeTokenRepo.findByToken(token)
                .orElseThrow(() -> new InvalidRequestException("Invalid or expired token"));

        if (ect.isUsed() || ect.isExpired()) {
            emailChangeTokenRepo.delete(ect);
            throw new InvalidRequestException("Invalid or expired token");
        }

        userRepo.findByEmail(ect.getNewEmail()).ifPresent(u -> {
            throw new DuplicateEntityException("Email already in use");
        });

        User user = userRepo.findById(ect.getUserId())
                .orElseThrow(() -> new UserNotFoundException("User not found: " + ect.getUserId()));

        user.setEmail(ect.getNewEmail());
        user.setUpdatedAt(LocalDateTime.now());
        userRepo.save(user);

        ect.setUsed(true);
        emailChangeTokenRepo.save(ect);
        emailChangeTokenRepo.deleteByUserId(user.getUserId());
    }


    @Value("${app.name:KKUN Quiz}")
    private String appName;

    @Value("${app.supportEmail:no-reply@kkun-quiz.local}")
    private String supportEmail;

    @Override
    @Transactional
    public void requestEmailChangeOtp(String newEmail) {
        UUID me = UUID.fromString(getCurrentUserId());

        // Validate cơ bản
        if (newEmail == null || newEmail.isBlank()) {
            throw new InvalidRequestException("Email must not be blank");
        }
        if (!isEmailFormat(newEmail)) {
            throw new InvalidRequestException("Invalid email format");
        }
        userRepo.findByEmail(newEmail).ifPresent(u -> {
            throw new DuplicateEntityException("Email already in use");
        });

        User current = userRepo.findById(me)
                .orElseThrow(() -> new UserNotFoundException("User not found: " + me));
        if (newEmail.equalsIgnoreCase(current.getEmail())) {
            return; // idempotent
        }

        // Tạo mã 6 số
        String code = String.format("%06d", new java.util.Random().nextInt(1_000_000));
        String codeHash = bCrypt.encode(code);

        // Lưu Redis (ghi đè bên cũ)
        EmailChangeOtpPayload payload = EmailChangeOtpPayload.builder()
                .newEmail(newEmail.trim())
                .codeHash(codeHash)
                .attempts(0)
                .build();
        try {
            String json = objectMapper.writeValueAsString(payload);
            redis.opsForValue().set(otpKeyForUser(me), json, otpTTLMinutes, java.util.concurrent.TimeUnit.MINUTES);
        } catch (Exception e) {
            throw new RuntimeException("Cannot store OTP payload: " + e.getMessage(), e);
        }

        // ===== GỬI EMAIL OTP (HTML đẹp, tương thích email client) =====
        String subject = "Mã xác minh đổi email — " + appName;

        String html = """
    <!doctype html>
    <html lang="vi">
    <head>
      <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
      <title>%1$s - Xác minh email</title>
    </head>
    <body style="margin:0;padding:0;background:#f4f5f7;">
      <table role="presentation" width="100%%" cellspacing="0" cellpadding="0" style="background:#f4f5f7;">
        <tr>
          <td align="center" style="padding:24px;">
            <table role="presentation" width="600" cellspacing="0" cellpadding="0"
                   style="background:#ffffff;border-radius:12px;overflow:hidden;">
              <tr>
                <td style="padding:20px 24px;background:#111827;color:#ffffff;">
                  <div style="font-size:18px;font-weight:700;line-height:1.4;">%1$s</div>
                  <div style="font-size:13px;opacity:.8;margin-top:4px;">Mã xác minh đổi email</div>
                </td>
              </tr>

              <tr>
                <td style="padding:24px;">
                  <p style="margin:0 0 12px 0;font-size:16px;color:#111827;">Xin chào,</p>
                  <p style="margin:0 0 16px 0;font-size:14px;color:#374151;">
                    Đây là mã xác thực để đổi email đăng nhập. Vui lòng nhập mã trong vòng
                    <strong>%2$d phút</strong>.
                  </p>

                  <div style="text-align:center;margin:24px 0;">
                    <span style="
                      display:inline-block;
                      padding:12px 16px;
                      font-size:28px;
                      font-weight:700;
                      letter-spacing:6px;
                      color:#111827;
                      background:#f9fafb;
                      border:1px solid #e5e7eb;
                      border-radius:10px;">
                      %3$s
                    </span>
                  </div>

                  <p style="margin:0 0 16px 0;font-size:13px;color:#6b7280;">
                    Nếu bạn không yêu cầu thao tác này, bạn có thể bỏ qua email.
                  </p>

                  <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />

                  <p style="margin:0;font-size:12px;color:#9ca3af;">
                    %1$s • %4$s
                  </p>
                </td>
              </tr>
            </table>

            <p style="margin:16px 0 0 0;font-size:12px;color:#9ca3af;">
              © %5$d %1$s. All rights reserved.
            </p>
          </td>
        </tr>
      </table>
    </body>
    </html>
    """.formatted(
                appName,                           // %1$s
                otpTTLMinutes,                     // %2$d
                code,                              // %3$s
                supportEmail,                      // %4$s
                Year.now().getValue()              // %5$d
        );

        mailService.sendEmail(newEmail, subject, html);
    }

    @Override
    @Transactional
    public void verifyEmailChangeOtp(String code) {
        UUID me = UUID.fromString(getCurrentUserId());
        if (code == null || code.isBlank()) {
            throw new InvalidRequestException("Code is required");
        }

        String key = otpKeyForUser(me);
        String json = redis.opsForValue().get(key);
        if (json == null) {
            throw new InvalidRequestException("OTP not found or expired");
        }

        try {
            EmailChangeOtpPayload payload = objectMapper.readValue(json, EmailChangeOtpPayload.class);

            if (payload.getAttempts() >= otpMaxAttempts) {
                redis.delete(key);
                throw new InvalidRequestException("Too many attempts. Please request a new code.");
            }

            boolean ok = bCrypt.matches(code, payload.getCodeHash());
            if (!ok) {
                payload.setAttempts(payload.getAttempts() + 1);
                redis.opsForValue().set(key, objectMapper.writeValueAsString(payload),
                        redis.getExpire(key), TimeUnit.SECONDS); // giữ nguyên TTL còn lại
                throw new InvalidRequestException("Invalid code");
            }

            // Code hợp lệ -> cập nhật email
            userRepo.findByEmail(payload.getNewEmail()).ifPresent(u -> {
                // race condition: email vừa bị ai đó chiếm
                redis.delete(key);
                throw new DuplicateEntityException("Email already in use");
            });

            User user = userRepo.findById(me)
                    .orElseThrow(() -> new UserNotFoundException("User not found: " + me));

            user.setEmail(payload.getNewEmail());
            user.setUpdatedAt(LocalDateTime.now());
            userRepo.save(user);

            // Cleanup
            redis.delete(key);

        } catch (InvalidRequestException | DuplicateEntityException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("OTP verification failed: " + e.getMessage(), e);
        }
    }

    @Override
    @Transactional
    public void sendFriendRequest(UUID requesterId, UUID targetUserId) {
        if (requesterId.equals(targetUserId)) {
            throw new InvalidRequestException("You cannot add yourself as a friend");
        }

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (!(authentication != null && authentication.getPrincipal() instanceof Jwt jwt)) {
            throw new SecurityException("Invalid Access Token");
        }
        String userIdFromToken = jwt.getClaim("userId");
        List<String> roles = jwt.getClaim("roles");
        boolean isAdmin = roles != null && roles.contains(UserRole.ADMIN.name());
        if (!isAdmin && !requesterId.toString().equals(userIdFromToken)) {
            throw new SecurityException("You do not have permission to send requests for this user");
        }

        User requester = userRepo.findById(requesterId)
                .orElseThrow(() -> new UserNotFoundException("Requester not found"));
        User target = userRepo.findById(targetUserId)
                .orElseThrow(() -> new UserNotFoundException("Target not found"));

        if (!requester.isActive() || !target.isActive()) {
            throw new InvalidRequestException("Inactive accounts cannot make friend connections");
        }

        // Đã là bạn rồi → idempotent
        if (requester.getFriends().stream().anyMatch(f -> f.getUserId().equals(targetUserId))) return;

        // Nếu có PENDING ngược chiều => auto-accept
        Optional<FriendRequest> reversePending = friendRequestRepo
                .findByRequesterAndReceiverAndStatus(target, requester, FriendRequest.Status.PENDING);
        if (reversePending.isPresent()) {
            FriendRequest req = reversePending.get();
            req.setStatus(FriendRequest.Status.ACCEPTED);
            req.setUpdatedAt(LocalDateTime.now());
            friendRequestRepo.save(req);

            requester.addFriend(target);
            userRepo.save(requester);
            userRepo.save(target);
            return;
        }

        // Tồn tại bản ghi giữa 2 bên? -> chỉ UPDATE về PENDING
        FriendRequest fr = friendRequestRepo.findByRequesterAndReceiver(requester, target)
                .orElseGet(() -> FriendRequest.builder()
                        .requester(requester)
                        .receiver(target)
                        .status(FriendRequest.Status.PENDING)
                        .createdAt(LocalDateTime.now())
                        .build());

        // Nếu đã PENDING rồi -> idempotent
        if (fr.getId() != null && fr.getStatus() == FriendRequest.Status.PENDING) return;

        fr.setStatus(FriendRequest.Status.PENDING);
        fr.setUpdatedAt(LocalDateTime.now());
        friendRequestRepo.save(fr);
        notificationService.createNotification(
                target.getUserId(),                // người nhận noti
                requester.getUserId(),             // tác nhân
                "FRIEND_REQUEST_SENT",             // verb
                "FRIEND_REQUEST",                  // targetType
                fr.getId(),                        // targetId
                requester.getName() + " sent you a friend request"
        );
    }


    @Override
    @Transactional
    public void acceptFriendRequest(UUID receiverId, UUID requestId) {
        // quyền: receiverId == user trong JWT hoặc admin
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (!(auth != null && auth.getPrincipal() instanceof Jwt jwt)) {
            throw new SecurityException("Invalid Access Token");
        }
        String userIdFromToken = jwt.getClaim("userId");
        List<String> roles = jwt.getClaim("roles");
        boolean isAdmin = roles != null && roles.contains(UserRole.ADMIN.name());
        if (!isAdmin && !receiverId.toString().equals(userIdFromToken)) {
            throw new SecurityException("You do not have permission to accept this request");
        }

        FriendRequest fr = friendRequestRepo.findById(requestId)
                .orElseThrow(() -> new InvalidRequestException("Friend request not found"));

        if (!fr.getReceiver().getUserId().equals(receiverId)) {
            throw new SecurityException("This request does not belong to you");
        }
        if (fr.getStatus() != FriendRequest.Status.PENDING) {
            return; // idempotent
        }

        fr.setStatus(FriendRequest.Status.ACCEPTED);
        fr.setUpdatedAt(LocalDateTime.now());
        friendRequestRepo.save(fr);

        User requester = fr.getRequester();
        User receiver  = fr.getReceiver();

        // Nếu đã là bạn rồi thì bỏ qua (idempotent)
        boolean alreadyFriends = requester.getFriends().stream()
                .anyMatch(u -> u.getUserId().equals(receiver.getUserId()));
        if (!alreadyFriends) {
            requester.addFriend(receiver);   // ➜ add 2 chiều (method entity của bạn làm 2 chiều)
            userRepo.save(requester);
            userRepo.save(receiver);
        }

        // Dọn các request giữa 2 bên còn PENDING (cùng chiều / ngược chiều) -> set ACCEPTED
        friendRequestRepo.findByRequesterAndReceiver(requester, receiver)
                .filter(r -> r.getStatus() == FriendRequest.Status.PENDING)
                .ifPresent(r -> {
                    r.setStatus(FriendRequest.Status.ACCEPTED);
                    r.setUpdatedAt(LocalDateTime.now());
                    friendRequestRepo.save(r);
                });

        friendRequestRepo.findByRequesterAndReceiver(receiver, requester)
                .filter(r -> r.getStatus() == FriendRequest.Status.PENDING)
                .ifPresent(r -> {
                    r.setStatus(FriendRequest.Status.ACCEPTED);
                    r.setUpdatedAt(LocalDateTime.now());
                    friendRequestRepo.save(r);
                });

        // ===== Notifications (per-user) =====
        // 1) Báo cho người gửi: lời mời đã được chấp nhận
        notificationService.createNotification(
                requester.getUserId(),                 // người nhận noti (người đã gửi)
                receiver.getUserId(),                  // tác nhân (người chấp nhận)
                "FRIEND_REQUEST_ACCEPTED",             // verb
                "FRIEND_REQUEST",                      // targetType
                fr.getId(),                            // targetId
                (receiver.getName() != null ? receiver.getName() : receiver.getUsername())
                        + " đã chấp nhận lời mời kết bạn của bạn"
        );

        // 2) (khuyến nghị) Báo “đã trở thành bạn bè” cho CẢ 2 phía để FE cập nhật danh sách bạn
        notificationService.createNotification(
                receiver.getUserId(),                  // người nhận
                requester.getUserId(),                 // tác nhân
                "FRIEND_ADDED",
                "FRIEND",
                requester.getUserId(),
                "Bạn và " + (requester.getName() != null ? requester.getName() : requester.getUsername())
                        + " đã trở thành bạn bè"
        );

        notificationService.createNotification(
                requester.getUserId(),                 // người nhận
                receiver.getUserId(),                  // tác nhân
                "FRIEND_ADDED",
                "FRIEND",
                receiver.getUserId(),
                "Bạn và " + (receiver.getName() != null ? receiver.getName() : receiver.getUsername())
                        + " đã trở thành bạn bè"
        );
    }


    @Override
    @Transactional
    public void declineFriendRequest(UUID receiverId, UUID requestId) {
        FriendRequest fr = friendRequestRepo.findById(requestId)
                .orElseThrow(() -> new InvalidRequestException("Friend request not found"));
        if (!fr.getReceiver().getUserId().equals(receiverId)) {
            throw new SecurityException("This request does not belong to you");
        }
        if (fr.getStatus() != FriendRequest.Status.PENDING) return; // idempotent
        fr.setStatus(FriendRequest.Status.DECLINED);
        fr.setUpdatedAt(LocalDateTime.now());
        friendRequestRepo.save(fr);
        notificationService.createNotification(
                fr.getRequester().getUserId(), // người nhận noti (người đã gửi)
                fr.getReceiver().getUserId(),  // tác nhân (người từ chối)
                "FRIEND_REQUEST_DECLINED",
                "FRIEND_REQUEST",
                fr.getId(),
                fr.getReceiver().getName() + " đã từ chối lời mời kết bạn của bạn"
        );
    }

    @Override
    @Transactional
    public void cancelFriendRequest(UUID requesterId, UUID requestId) {
        FriendRequest fr = friendRequestRepo.findById(requestId)
                .orElseThrow(() -> new InvalidRequestException("Friend request not found"));
        if (!fr.getRequester().getUserId().equals(requesterId)) {
            throw new SecurityException("You cannot cancel this request");
        }
        if (fr.getStatus() != FriendRequest.Status.PENDING) return;

        // Chỉ đổi trạng thái (không xóa) → để lần sau gửi lại chỉ cần UPDATE về PENDING
        fr.setStatus(FriendRequest.Status.CANCELED);
        fr.setUpdatedAt(LocalDateTime.now());
        friendRequestRepo.save(fr);
        notificationService.createNotification(
                fr.getReceiver().getUserId(),  // người nhận noti (người bị mời trước đó)
                fr.getRequester().getUserId(), // tác nhân (người hủy)
                "FRIEND_REQUEST_CANCELED",
                "FRIEND_REQUEST",
                fr.getId(),
                fr.getRequester().getName() + " đã hủy lời mời kết bạn"
        );
    }


    @Override
    @Transactional(readOnly = true)
    public PageResponse<FriendRequestDTO> getIncomingRequestsPaged(UUID userId, int page, int size) {
        User me = userRepo.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("User not found: " + userId));

        Pageable pageable = PageRequest.of(Math.max(0, page), Math.min(Math.max(1, size), 50),
                Sort.by(Sort.Direction.DESC, "createdAt"));

        Page<FriendRequestDTO> dtoPage = friendRequestRepo
                .findAllByReceiverAndStatus(me, FriendRequest.Status.PENDING, pageable)
                .map(this::toDto);

        return toPageResponse(dtoPage);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<FriendRequestDTO> getOutgoingRequestsPaged(UUID userId, int page, int size) {
        User me = userRepo.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("User not found: " + userId));

        Pageable pageable = PageRequest.of(Math.max(0, page), Math.min(Math.max(1, size), 50),
                Sort.by(Sort.Direction.DESC, "createdAt"));

        Page<FriendRequestDTO> dtoPage = friendRequestRepo
                .findAllByRequesterAndStatus(me, FriendRequest.Status.PENDING, pageable)
                .map(this::toDto);

        return toPageResponse(dtoPage);
    }

    @Override
    @Transactional(readOnly = true)
    public FriendshipStatusResponseDTO getFriendshipStatus(UUID me, UUID targetId) {
        if (me.equals(targetId)) {
            // chính mình -> coi như không cần nút friend
            return FriendshipStatusResponseDTO.builder()
                    .status(FriendshipStatus.NONE)
                    .requestId(null)
                    .build();
        }

        User meUser = userRepo.findById(me)
                .orElseThrow(() -> new UserNotFoundException("User not found: " + me));
        User target = userRepo.findById(targetId)
                .orElseThrow(() -> new UserNotFoundException("User not found: " + targetId));

        // 1) Đã là bạn?
        if (meUser.isFriendsWith(targetId)) {
            return FriendshipStatusResponseDTO.builder()
                    .status(FriendshipStatus.FRIEND)
                    .requestId(null)
                    .build();
        }

        // 2) Có pending ngược chiều (họ mời mình)?
        Optional<FriendRequest> incoming = friendRequestRepo
                .findByRequesterAndReceiverAndStatus(target, meUser, FriendRequest.Status.PENDING);
        if (incoming.isPresent()) {
            return FriendshipStatusResponseDTO.builder()
                    .status(FriendshipStatus.INCOMING)
                    .requestId(incoming.get().getId())
                    .build();
        }

        // 3) Có pending cùng chiều (mình đã mời họ)?
        Optional<FriendRequest> outgoing = friendRequestRepo
                .findByRequesterAndReceiverAndStatus(meUser, target, FriendRequest.Status.PENDING);
        if (outgoing.isPresent()) {
            return FriendshipStatusResponseDTO.builder()
                    .status(FriendshipStatus.REQUESTED)
                    .requestId(outgoing.get().getId())
                    .build();
        }

        // 4) Không có gì
        return FriendshipStatusResponseDTO.builder()
                .status(FriendshipStatus.NONE)
                .requestId(null)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserResponseDTO> getFriendsOf(UUID userId) {
        User u = userRepo.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("User not found: " + userId));

        return u.getFriends().stream()
                .map(friend -> modelMapper.map(friend, UserResponseDTO.class))
                .collect(Collectors.toList());
    }


    private FriendRequestDTO toDto(FriendRequest fr) {
        return FriendRequestDTO.builder()
                .id(fr.getId())
                .status(fr.getStatus().name())
                .createdAt(fr.getCreatedAt())

                .requesterId(fr.getRequester().getUserId())
                .requesterName(fr.getRequester().getName())
                .requesterUsername(fr.getRequester().getUsername())
                .requesterAvatar(fr.getRequester().getAvatar())

                .receiverId(fr.getReceiver().getUserId())
                .receiverName(fr.getReceiver().getName())
                .receiverUsername(fr.getReceiver().getUsername())
                .receiverAvatar(fr.getReceiver().getAvatar())
                .build();
    }

    private <T> PageResponse<T> toPageResponse(Page<T> page) {
        return PageResponse.<T>builder()
                .content(page.getContent())
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .hasNext(page.hasNext())
                .hasPrev(page.hasPrevious())
                .build();
    }

}