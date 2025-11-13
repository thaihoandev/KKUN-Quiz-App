package com.kkunquizapp.QuizAppBackend.user.service.impl;

import com.cloudinary.Cloudinary;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.kkunquizapp.QuizAppBackend.auth.dto.AuthResponseDTO;
import com.kkunquizapp.QuizAppBackend.auth.service.JwtService;
import com.kkunquizapp.QuizAppBackend.common.exception.*;
import com.kkunquizapp.QuizAppBackend.fileUpload.service.CloudinaryService;
import com.kkunquizapp.QuizAppBackend.notification.service.NotificationService;
import com.kkunquizapp.QuizAppBackend.user.dto.*;
import com.kkunquizapp.QuizAppBackend.user.model.*;
import com.kkunquizapp.QuizAppBackend.user.model.enums.*;
import com.kkunquizapp.QuizAppBackend.user.repository.*;
import com.kkunquizapp.QuizAppBackend.user.service.*;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.*;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.oauth2.jwt.Jwt;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

import static com.kkunquizapp.QuizAppBackend.common.helper.validateHelper.isEmailFormat;

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
    private final FriendRequestRepo friendRequestRepo;
    private final StringRedisTemplate redis;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final BCryptPasswordEncoder bCrypt = new BCryptPasswordEncoder();

    @Value("${app.emailChange.otpTTLMinutes:10}")
    private int otpTTLMinutes;

    @Value("${app.emailChange.otpMaxAttempts:5}")
    private int otpMaxAttempts;

    @Value("${app.emailChange.confirmBaseUrl:https://your-domain.com/api/users/me/confirm-email-change}")
    private String confirmBaseUrl;

    @Value("${app.emailChange.ttlMinutes:30}")
    private int ttlMinutes;

    @Value("${app.name:KKUN Quiz}")
    private String appName;

    @Value("${app.supportEmail:no-reply@kkun-quiz.local}")
    private String supportEmail;

    // ===================== Helpers =====================
    private String otpKeyForUser(UUID userId) {
        return "email:change:OTP:" + userId;
    }

    private User getUserOrThrow(UUID id) {
        return userRepo.findById(id)
                .orElseThrow(() -> new UserNotFoundException("User not found with ID: " + id));
    }

    // ===================== OAUTH2 LOGIN =====================
    @Override
    @Transactional
    public AuthResponseDTO createOrUpdateOAuth2User(String email, String name) {
        User user = userRepo.findByEmail(email).orElse(new User());

        if (user.getUserId() == null) {
            user.setEmail(email);
            user.setUsername(email.substring(0, email.indexOf('@')));
            user.setRole(UserRole.USER);
            user.setPassword(encoder.encode(UUID.randomUUID().toString()));
        }

        userRepo.save(user);
        UserDetails userDetails = customUserDetailsService.loadUserByUsername(user.getUsername());
        Map<String, String> tokens = jwtService.generateTokens((UserPrincipal) userDetails);

        return AuthResponseDTO.builder()
                .accessToken(tokens.get("accessToken"))
                .refreshToken(tokens.get("refreshToken"))
                .type("Bearer")
                .username(user.getUsername())
                .roles(List.of(user.getRole().name()))
                .build();
    }

    // ===================== ADMIN: GET ALL USERS =====================
    @Override
    @Transactional
    public Page<UserResponseDTO> getAllUsers(Pageable pageable) {
        Page<User> users = userRepo.findAll(pageable);
        return users.map(u -> modelMapper.map(u, UserResponseDTO.class));
    }

    // ===================== GET USER BY ID =====================
    @Override
    @Transactional(readOnly = true)
    public UserResponseDTO getUserById(String userId) {
        // ==== Lấy authentication từ SecurityContext ====
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String userIdFromToken = null;
        boolean isAdmin = false;

        if (authentication != null && authentication.getPrincipal() instanceof Jwt jwt) {
            userIdFromToken = jwt.getClaim("userId");
            List<String> roles = jwt.getClaim("roles");
            isAdmin = roles.contains(UserRole.ADMIN.name());
        }

        // ==== Lấy user trong DB ====
        User user = userRepo.findById(UUID.fromString(userId))
                .orElseThrow(() -> new UserNotFoundException("User not found with ID: " + userId));

        // ==== Map sang DTO đầy đủ ====
        UserResponseDTO dto = modelMapper.map(user, UserResponseDTO.class);

        // ==== Kiểm tra owner ====
        boolean isOwner = userIdFromToken != null && userIdFromToken.equals(userId);

        // ==== Nếu không phải admin và không phải owner → trả profile public ====
        if (!isAdmin && !isOwner) {
            dto.setEmail(null);
            dto.setRoles(null);
            dto.setUsername(null);
            dto.setIsActive(null);
            // bất cứ gì bạn muốn ẩn thêm thì thêm ở đây
        }

        return dto;
    }


    // ===================== UPDATE USER =====================
    @Override
    @Transactional
    public UserResponseDTO updateUser(UUID id, UserRequestDTO userRequestDTO) {
        User existingUser = getUserOrThrow(id);

        if (userRequestDTO.getEmail() != null && !isEmailFormat(userRequestDTO.getEmail())) {
            throw new InvalidRequestException("Invalid email format");
        }

        if (userRequestDTO.getEmail() != null && !userRequestDTO.getEmail().equals(existingUser.getEmail())) {
            userRepo.findByEmail(userRequestDTO.getEmail())
                    .ifPresent(u -> { throw new DuplicateEntityException("Email already in use"); });
            existingUser.setEmail(userRequestDTO.getEmail());
        }

        if (userRequestDTO.getUsername() != null) existingUser.setUsername(userRequestDTO.getUsername());
        if (userRequestDTO.getName() != null) existingUser.setName(userRequestDTO.getName());
        if (userRequestDTO.getSchool() != null) existingUser.setSchool(userRequestDTO.getSchool());
        if (userRequestDTO.getPassword() != null && !userRequestDTO.getPassword().isBlank()) {
            existingUser.setPassword(encoder.encode(userRequestDTO.getPassword()));
        }
        if (userRequestDTO.getRole() != null) {
            try {
                existingUser.setRole(UserRole.valueOf(userRequestDTO.getRole().toUpperCase()));
            } catch (IllegalArgumentException e) {
                throw new InvalidRequestException("Invalid role: " + userRequestDTO.getRole());
            }
        }

        existingUser.setUpdatedAt(LocalDateTime.now());
        userRepo.save(existingUser);
        return modelMapper.map(existingUser, UserResponseDTO.class);
    }

    @Override
    @Transactional
    public void changePassword(UUID userId, String currentPassword, String newPassword) {
        if (currentPassword == null || currentPassword.isBlank() ||
                newPassword == null || newPassword.isBlank()) {
            throw new InvalidRequestException("Password must not be blank");
        }

        if (newPassword.length() < 8) {
            throw new InvalidRequestException("New password must be at least 8 characters");
        }

        User user = userRepo.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("User not found with ID: " + userId));

        if (!encoder.matches(currentPassword, user.getPassword())) {
            throw new InvalidRequestException("Current password is incorrect");
        }

        user.setPassword(encoder.encode(newPassword));
        user.setUpdatedAt(LocalDateTime.now());
        userRepo.save(user);
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
            return; // Không làm gì nếu email mới trùng email cũ
        }

        emailChangeTokenRepo.deleteByUserId(me);

        String token = UUID.randomUUID().toString();
        EmailChangeToken ect = EmailChangeToken.builder()
                .userId(me)
                .newEmail(newEmail.trim())
                .token(token)
                .expiresAt(LocalDateTime.now().plusMinutes(ttlMinutes))
                .used(false)
                .build();
        emailChangeTokenRepo.save(ect);

        String verifyLink = confirmBaseUrl + "?token=" + token;
        String subject = "Xác nhận đổi địa chỉ email";
        String html = """
        <p>Xin chào,</p>
        <p>Bạn vừa yêu cầu đổi email đăng nhập. Nhấn vào nút bên dưới để xác nhận:</p>
        <p><a href="%s" style="display:inline-block;padding:10px 16px;border-radius:6px;background:#4f46e5;color:#fff;text-decoration:none;">Xác nhận đổi email</a></p>
        <p>Nếu nút không hoạt động, hãy copy link: <br/>%s</p>
        <p>Liên kết sẽ hết hạn sau %d phút.</p>
    """.formatted(verifyLink, verifyLink, ttlMinutes);

        mailService.sendEmail(newEmail, subject, html);
    }

    @Override
    @Transactional
    public void requestEmailChangeOtp(String newEmail) {
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
            return; // Không cần gửi OTP nếu email không đổi
        }

        // Tạo mã OTP 6 chữ số
        String code = String.format("%06d", new Random().nextInt(1_000_000));
        String codeHash = bCrypt.encode(code);

        // Lưu vào Redis
        EmailChangeOtpPayload payload = EmailChangeOtpPayload.builder()
                .newEmail(newEmail.trim())
                .codeHash(codeHash)
                .attempts(0)
                .build();

        try {
            String json = objectMapper.writeValueAsString(payload);
            redis.opsForValue().set(otpKeyForUser(me), json, otpTTLMinutes, TimeUnit.MINUTES);
        } catch (Exception e) {
            throw new RuntimeException("Cannot store OTP payload: " + e.getMessage(), e);
        }

        // Gửi email chứa mã OTP
        String subject = "Mã xác minh đổi email — " + appName;
        String html = """
        <p>Xin chào,</p>
        <p>Đây là mã xác thực để đổi email đăng nhập. Mã có hiệu lực trong <b>%d phút</b>.</p>
        <p style="font-size:22px; font-weight:bold; letter-spacing:6px;">%s</p>
        <p>Nếu bạn không yêu cầu thao tác này, vui lòng bỏ qua email này.</p>
    """.formatted(otpTTLMinutes, code);

        mailService.sendEmail(newEmail, subject, html);
    }


    // ===================== DELETE USER (ADMIN) =====================
    @Override
    public void deleteUser(UUID id) {
        if (!userRepo.existsById(id)) throw new UserNotFoundException("User not found: " + id);
        userRepo.deleteById(id);
    }

    // ===================== SOFT DELETE =====================
    @Override
    @Transactional
    public void deleteSoftUser(UUID id, String password) {
        User user = getUserOrThrow(id);
        if (!bCrypt.matches(password, user.getPassword())) {
            throw new UnauthorizedException("Invalid password");
        }
        user.setActive(false);
        user.setUpdatedAt(LocalDateTime.now());
        userRepo.save(user);
    }

    @Override
    @Transactional
    public void restoreUser(UUID id) {
        User user = userRepo.findById(id)
                .orElseThrow(() -> new UserNotFoundException("User not found with ID: " + id));

        if (user.isActive()) return; // đã active thì bỏ qua

        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getAuthorities().stream().noneMatch(a -> a.getAuthority().equals("ADMIN"))) {
            throw new SecurityException("Only ADMIN can restore users");
        }
        user.setActive(true);
        user.setUpdatedAt(LocalDateTime.now());
        userRepo.save(user);
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

            // Kiểm tra số lần nhập sai
            if (payload.getAttempts() >= otpMaxAttempts) {
                redis.delete(key);
                throw new InvalidRequestException("Too many attempts. Please request a new code.");
            }

            // So khớp mã OTP
            boolean ok = bCrypt.matches(code, payload.getCodeHash());
            if (!ok) {
                payload.setAttempts(payload.getAttempts() + 1);
                redis.opsForValue().set(
                        key,
                        objectMapper.writeValueAsString(payload),
                        redis.getExpire(key),
                        TimeUnit.SECONDS
                );
                throw new InvalidRequestException("Invalid code");
            }

            // Check trùng email
            userRepo.findByEmail(payload.getNewEmail()).ifPresent(u -> {
                redis.delete(key);
                throw new DuplicateEntityException("Email already in use");
            });

            // Cập nhật email
            User user = userRepo.findById(me)
                    .orElseThrow(() -> new UserNotFoundException("User not found: " + me));

            user.setEmail(payload.getNewEmail());
            user.setUpdatedAt(LocalDateTime.now());
            userRepo.save(user);

            // Xóa OTP sau khi xác nhận
            redis.delete(key);

        } catch (InvalidRequestException | DuplicateEntityException e) {
            throw e; // ném lại lỗi rõ ràng
        } catch (Exception e) {
            throw new RuntimeException("OTP verification failed: " + e.getMessage(), e);
        }
    }


    // ===================== UPDATE AVATAR =====================
    @Override
    @Transactional
    public UserResponseDTO updateUserAvatar(UUID id, MultipartFile file) {
        User user = getUserOrThrow(id);
        try {
            Map result = cloudinaryService.uploadWithPublicId(file, "user_avatars/" + id);
            String avatarUrl = (String) result.get("secure_url");
            user.setAvatar(avatarUrl);
            user.setUpdatedAt(LocalDateTime.now());
            userRepo.save(user);
            return modelMapper.map(user, UserResponseDTO.class);
        } catch (IOException e) {
            throw new RuntimeException("Upload failed: " + e.getMessage(), e);
        }
    }

    // ===================== FRIEND REQUESTS & FRIENDS =====================
    @Override
    @Transactional
    public void sendFriendRequest(UUID requesterId, UUID targetUserId) {
        if (requesterId.equals(targetUserId))
            throw new InvalidRequestException("Cannot add yourself");

        User requester = getUserOrThrow(requesterId);
        User target = getUserOrThrow(targetUserId);

        boolean alreadyFriends = requester.getFriends().stream()
                .anyMatch(f -> f.getUserId().equals(targetUserId));
        if (alreadyFriends) return;

        Optional<FriendRequest> reverse = friendRequestRepo
                .findByRequesterAndReceiverAndStatus(target, requester, FriendRequest.Status.PENDING);

        if (reverse.isPresent()) {
            FriendRequest req = reverse.get();
            req.setStatus(FriendRequest.Status.ACCEPTED);
            requester.addFriend(target);
            userRepo.saveAll(List.of(requester, target));
            return;
        }

        FriendRequest fr = FriendRequest.builder()
                .requester(requester)
                .receiver(target)
                .status(FriendRequest.Status.PENDING)
                .createdAt(LocalDateTime.now())
                .build();

        friendRequestRepo.save(fr);
        notificationService.createNotification(
                target.getUserId(),
                requester.getUserId(),
                "FRIEND_REQUEST_SENT",
                "FRIEND_REQUEST",
                fr.getId(),
                requester.getName() + " đã gửi lời mời kết bạn"
        );
    }

    @Override
    @Transactional
    public void acceptFriendRequest(UUID receiverId, UUID requestId) {
        FriendRequest fr = friendRequestRepo.findById(requestId)
                .orElseThrow(() -> new InvalidRequestException("Friend request not found"));
        if (!fr.getReceiver().getUserId().equals(receiverId))
            throw new UnauthorizedException("Not your request");

        fr.setStatus(FriendRequest.Status.ACCEPTED);
        fr.setUpdatedAt(LocalDateTime.now());
        friendRequestRepo.save(fr);

        User requester = fr.getRequester();
        User receiver = fr.getReceiver();
        requester.addFriend(receiver);
        userRepo.saveAll(List.of(requester, receiver));

        notificationService.createNotification(
                requester.getUserId(),
                receiver.getUserId(),
                "FRIEND_REQUEST_ACCEPTED",
                "FRIEND_REQUEST",
                fr.getId(),
                receiver.getName() + " đã chấp nhận lời mời kết bạn"
        );
    }

    @Override
    @Transactional
    public void declineFriendRequest(UUID receiverId, UUID requestId) {
        FriendRequest fr = friendRequestRepo.findById(requestId)
                .orElseThrow(() -> new InvalidRequestException("Request not found"));
        if (!fr.getReceiver().getUserId().equals(receiverId))
            throw new UnauthorizedException("Not your request");
        fr.setStatus(FriendRequest.Status.DECLINED);
        fr.setUpdatedAt(LocalDateTime.now());
        friendRequestRepo.save(fr);
    }

    @Override
    @Transactional
    public void cancelFriendRequest(UUID requesterId, UUID requestId) {
        FriendRequest fr = friendRequestRepo.findById(requestId)
                .orElseThrow(() -> new InvalidRequestException("Request not found"));
        if (!fr.getRequester().getUserId().equals(requesterId))
            throw new UnauthorizedException("Cannot cancel this request");
        fr.setStatus(FriendRequest.Status.CANCELED);
        fr.setUpdatedAt(LocalDateTime.now());
        friendRequestRepo.save(fr);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<FriendRequestDTO> getIncomingRequestsPaged(UUID userId, Pageable pageable) {
        User me = getUserOrThrow(userId);
        return friendRequestRepo.findAllByReceiverAndStatus(me, FriendRequest.Status.PENDING, pageable)
                .map(this::toDto);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<FriendRequestDTO> getOutgoingRequestsPaged(UUID userId, Pageable pageable) {
        User me = getUserOrThrow(userId);
        return friendRequestRepo.findAllByRequesterAndStatus(me, FriendRequest.Status.PENDING, pageable)
                .map(this::toDto);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<FriendSuggestionDTO> getFriendSuggestions(UUID currentUserId, Pageable pageable) {
        User me = userRepo.findById(currentUserId)
                .orElseThrow(() -> new UserNotFoundException("User not found with ID: " + currentUserId));

        // Lấy danh sách ID bạn bè hiện tại
        Set<UUID> myFriendIds = me.getFriends().stream()
                .map(User::getUserId)
                .collect(Collectors.toSet());

        // Loại trừ bản thân và bạn bè
        Set<UUID> excluded = new HashSet<>(myFriendIds);
        excluded.add(currentUserId);

        // Loại trừ các lời mời đang chờ (PENDING)
        friendRequestRepo.findAllByRequesterAndStatus(me, FriendRequest.Status.PENDING)
                .forEach(fr -> excluded.add(fr.getReceiver().getUserId()));
        friendRequestRepo.findAllByReceiverAndStatus(me, FriendRequest.Status.PENDING)
                .forEach(fr -> excluded.add(fr.getRequester().getUserId()));

        // Truy vấn bạn bè tiềm năng (repository có thể dùng native query)
        Page<User> candidates = userRepo.findSuggestions(
                currentUserId,
                excluded,
                excluded.isEmpty(),
                pageable
        );

        // Map sang DTO + tính mutual friends
        List<FriendSuggestionDTO> content = candidates.getContent().stream()
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
                .toList();

        return new PageImpl<>(content, pageable, candidates.getTotalElements());
    }


    @Override
    @Transactional(readOnly = true)
    public Page<UserResponseDTO> getFriendsOf(UUID userId, Pageable pageable) {
        Page<User> friends = userRepo.findFriendsOf(userId, pageable);
        return friends.map(u -> modelMapper.map(u, UserResponseDTO.class));
    }

    @Override
    @Transactional(readOnly = true)
    public FriendshipStatusResponseDTO getFriendshipStatus(UUID me, UUID targetId) {
        if (me.equals(targetId)) {
            return FriendshipStatusResponseDTO.builder()
                    .status(FriendshipStatus.NONE)
                    .requestId(null)
                    .build();
        }

        User meUser = userRepo.findById(me)
                .orElseThrow(() -> new UserNotFoundException("User not found: " + me));
        User target = userRepo.findById(targetId)
                .orElseThrow(() -> new UserNotFoundException("User not found: " + targetId));

        // Đã là bạn bè?
        if (meUser.isFriendsWith(targetId)) {
            return FriendshipStatusResponseDTO.builder()
                    .status(FriendshipStatus.FRIEND)
                    .requestId(null)
                    .build();
        }

        // Có lời mời đang tới từ target không?
        Optional<FriendRequest> incoming = friendRequestRepo
                .findByRequesterAndReceiverAndStatus(target, meUser, FriendRequest.Status.PENDING);
        if (incoming.isPresent()) {
            return FriendshipStatusResponseDTO.builder()
                    .status(FriendshipStatus.INCOMING)
                    .requestId(incoming.get().getId())
                    .build();
        }

        // Có lời mời đang gửi tới target không?
        Optional<FriendRequest> outgoing = friendRequestRepo
                .findByRequesterAndReceiverAndStatus(meUser, target, FriendRequest.Status.PENDING);
        if (outgoing.isPresent()) {
            return FriendshipStatusResponseDTO.builder()
                    .status(FriendshipStatus.REQUESTED)
                    .requestId(outgoing.get().getId())
                    .build();
        }

        // Không có mối quan hệ nào
        return FriendshipStatusResponseDTO.builder()
                .status(FriendshipStatus.NONE)
                .requestId(null)
                .build();
    }


    private FriendRequestDTO toDto(FriendRequest fr) {
        return FriendRequestDTO.builder()
                .id(fr.getId())
                .status(fr.getStatus().name())
                .createdAt(fr.getCreatedAt())
                .requesterId(fr.getRequester().getUserId())
                .requesterName(fr.getRequester().getName())
                .receiverId(fr.getReceiver().getUserId())
                .receiverName(fr.getReceiver().getName())
                .build();
    }

    // ===================== CURRENT USER =====================
    @Override
    public String getCurrentUserId() {
        throw new UnsupportedOperationException("Use @AuthenticationPrincipal instead of manual call");
    }
    @Override
    @Transactional(readOnly = true)
    public User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        if (auth == null || !auth.isAuthenticated()) {
            throw new UnauthorizedException("User is not authenticated");
        }

        if (auth.getPrincipal() instanceof UserPrincipal principal) {
            UUID id = principal.getUserId();
            return userRepo.findById(id)
                    .orElseThrow(() -> new UserNotFoundException("User not found with ID: " + id));
        }

        throw new UnauthorizedException("Invalid authentication principal");
    }

    @Override
    @Transactional(readOnly = true)
    public UserSummaryDto getPublicById(UUID userId) {
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("User not found with ID: " + userId));

        // Chỉ trả về thông tin công khai
        return UserSummaryDto.builder()
                .userId(user.getUserId())
                .name(user.getName())
                .username(user.getUsername())
                .avatar(user.getAvatar())
                .build();
    }

}
