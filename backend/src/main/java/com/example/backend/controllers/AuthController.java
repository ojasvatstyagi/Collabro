package com.example.backend.controllers;

import com.example.backend.dto.*;
import com.example.backend.models.User;
import com.example.backend.security.JwtTokenProvider;
import com.example.backend.services.AccountService;
import com.example.backend.services.LoginThrottle;
import com.example.backend.services.PasswordService;
import com.example.backend.services.ProfileService;
import com.example.backend.services.RefreshTokenService;
import com.example.backend.services.UserService;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import java.util.Objects;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Slf4j
public class AuthController {

    private final UserService userService;
    private final PasswordEncoder passwordEncoder;
    private final ProfileService profileService;
    private final JwtTokenProvider jwtTokenProvider;
    private final RefreshTokenService refreshTokenService;
    private final PasswordService passwordService;
    private final AccountService accountService;
    private final LoginThrottle loginThrottle;
    private final ModelMapper modelMapper;

    // Checked against when the username is unknown, so a missing user costs the same time as a wrong password
    private volatile String dummyPasswordHash;

    @Value("${jwt.cookie.name}")
    private String refreshTokenCookieName;
    
    @Value("${jwt.cookie.max-age}")
    private int refreshTokenCookieMaxAge;

    // Behind a TLS-terminating proxy the request itself looks insecure, so production sets this explicitly
    @Value("${jwt.cookie.secure:false}")
    private boolean refreshTokenCookieSecure;

    @Value("${jwt.cookie.same-site:Lax}")
    private String refreshTokenCookieSameSite;

    @Value("${jwt.access-token-expiration}")
    private long jwtExpirationMs;
    private static final String MESSAGE_KEY = "message";

    @Transactional
    @PostMapping("/register")
    @Operation(summary = "Register User", description = "Registers a new user and sends OTP for email verification")
    public ResponseEntity<Map<String, String>> register(@Valid @RequestBody RegisterRequest registerRequest) {
        if (userService.findUserByUsername(registerRequest.getUsername()).isPresent())
            return ResponseEntity.badRequest().body(Map.of(MESSAGE_KEY, "Username already exists"));

        if (userService.findUserByEmail(registerRequest.getEmail()).isPresent())
            return ResponseEntity.badRequest().body(Map.of(MESSAGE_KEY, "Email already exists"));

        log.info("Registering user: {}", registerRequest.getUsername());
        // Encode password and saveProfile user
        registerRequest.setPassword(passwordEncoder.encode(registerRequest.getPassword()));
        User savedUser = userService.saveUser(registerRequest);
        // Generate email verification OTP
        passwordService.generateEmailVerificationOtp(Objects.requireNonNull(registerRequest.getEmail()));

        // Create and saveProfile empty profile for the user
        profileService.saveProfile(profileService.createEmptyProfile(savedUser));
        log.info("User registered successfully: {}", savedUser.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(MESSAGE_KEY, "Registration successful"));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest loginRequest, HttpServletRequest request,
            HttpServletResponse response) {
        log.info("Attempting login for user: {}", loginRequest.getUsername());
        // Before any password check, so a locked-out client learns nothing about whether the password was right
        String clientAddress = request.getRemoteAddr();
        loginThrottle.checkAllowed(loginRequest.getUsername(), clientAddress);
        Optional<User> userOpt = userService.findUserByUsername(loginRequest.getUsername());
        if (userOpt.isEmpty()) {
            passwordEncoder.matches(loginRequest.getPassword(), dummyHash());
            loginThrottle.recordFailure(loginRequest.getUsername(), clientAddress);
            log.warn("Invalid credentials for user: {}", loginRequest.getUsername());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of(MESSAGE_KEY, "Invalid credentials"));
        }
        if (!passwordEncoder.matches(loginRequest.getPassword(), userOpt.get().getPassword())) {
            loginThrottle.recordFailure(loginRequest.getUsername(), clientAddress);
            log.warn("Invalid credentials for user: {}", loginRequest.getUsername());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of(MESSAGE_KEY, "Invalid credentials"));
        }
        loginThrottle.recordSuccess(loginRequest.getUsername(), clientAddress);
        User user = userOpt.get();
        if (!user.isVerified()) {
            log.warn("Email not verified for user: {}", loginRequest.getUsername());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of(MESSAGE_KEY, "Email not verified"));
        }

        // Generate access and refresh tokens; the refresh token is stored hashed, replacing any previous one
        String accessToken = jwtTokenProvider.generateAccessToken(user.getUsername());
        String refreshToken = refreshTokenService.issue(user);
        response.addHeader(HttpHeaders.SET_COOKIE, refreshCookie(refreshToken, request).toString());

        log.info("Login successful for user: {}", loginRequest.getUsername());
        UserDto dto = convertToDto(user);

        return ResponseEntity.ok(Map.of(
            "user", dto,
            "accessToken", accessToken,
            "tokenType", "Bearer",
            "expiresIn", accessTokenLifetimeSeconds()
        ));
    }

    private String dummyHash() {
        if (dummyPasswordHash == null) {
            dummyPasswordHash = passwordEncoder.encode(java.util.UUID.randomUUID().toString());
        }
        return dummyPasswordHash;
    }

    private long accessTokenLifetimeSeconds() {
        return jwtExpirationMs / 1000;
    }

    private ResponseCookie refreshCookie(String value, HttpServletRequest request) {
        boolean secure = refreshTokenCookieSecure || request.isSecure();
        // Browsers drop SameSite=None cookies that are not Secure, so fall back to Lax in that case
        String sameSite = !secure && "None".equalsIgnoreCase(refreshTokenCookieSameSite) ? "Lax"
                : refreshTokenCookieSameSite;
        return ResponseCookie.from(Objects.requireNonNull(refreshTokenCookieName), Objects.requireNonNull(value))
                .httpOnly(true)
                .secure(secure)
                .path("/")
                .maxAge(value.isEmpty() ? 0 : refreshTokenCookieMaxAge)
                .sameSite(sameSite)
                .build();
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(HttpServletRequest request) {
        String jwt = parseJwt(request);
        if (jwt != null && jwtTokenProvider.validateAccessToken(jwt)) {
            String username = jwtTokenProvider.getUsernameFromToken(jwt);
            Optional<User> userOpt = userService.findUserByUsername(username);
            if (userOpt.isPresent()) {
                return ResponseEntity.ok(Map.of("user", convertToDto(userOpt.get())));
            }
        }
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of(MESSAGE_KEY, "Unauthorized"));
    }
    
    @PostMapping("/refresh")
    public ResponseEntity<?> refreshToken(@CookieValue(name = "refreshToken", required = false) String refreshToken,
            HttpServletRequest request, HttpServletResponse response) {
        if (refreshToken == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("error", "Refresh token not found"));
        }

        // Single-use refresh token: validates it, swaps in a new one, and rejects replays
        RefreshTokenService.Rotation rotation = refreshTokenService.rotate(refreshToken);
        if (rotation.refreshToken() != null) {
            response.addHeader(HttpHeaders.SET_COOKIE, refreshCookie(rotation.refreshToken(), request).toString());
        }

        return ResponseEntity.ok(Map.of(
            "accessToken", rotation.accessToken(),
            "tokenType", "Bearer",
            "expiresIn", accessTokenLifetimeSeconds()
        ));
    }

    private String parseJwt(HttpServletRequest request) {
        String headerAuth = request.getHeader("Authorization");

        if (org.springframework.util.StringUtils.hasText(headerAuth) && headerAuth.startsWith("Bearer ")) {
            return headerAuth.substring(7);
        }
        return null;
    }

    private UserDto convertToDto(User user) {
        UserDto dto = modelMapper.map(user, UserDto.class);
        if (user.getProfile() != null) {
            dto.setFirstname(user.getProfile().getFirstname());
            dto.setLastname(user.getProfile().getLastname());

            // Transform internal file path to public URL
            String path = user.getProfile().getProfilePictureUrl();
            if (path != null && !path.isEmpty()) {
                if (!path.startsWith("http") && path.contains("profile-pictures/")) {
                    String filename = path.substring(path.lastIndexOf("/") + 1);
                    dto.setProfilePictureUrl("/api/profile/picture/" + filename);
                } else {
                    dto.setProfilePictureUrl(path);
                }
            } else {
                dto.setProfilePictureUrl(null);
            }

            dto.setProfileComplete(user.getProfile().isProfileComplete());
        }
        if (user.getRole() != null) {
            dto.setRole(user.getRole().getRoleName());
        }
        return dto;
    }

    @PostMapping("/logout")
    public ResponseEntity<Map<String, String>> logout(
            @CookieValue(name = "refreshToken", required = false) String refreshToken,
            HttpServletRequest request, 
            HttpServletResponse response) {
        
        // Delete refresh token from database
        if (refreshToken != null) {
            refreshTokenService.revoke(refreshToken);
        }

        // Clear refresh token cookie
        response.setHeader(HttpHeaders.SET_COOKIE, refreshCookie("", request).toString());
        
        return ResponseEntity.ok(Map.of(MESSAGE_KEY, "Logout successful"));
    }

    // Needs a logged-in user even though /api/auth/** is public: SecurityConfig requires authentication for this path
    @PutMapping("/change-password")
    @Operation(summary = "Change password", description = "Changes the current user's password and signs out their other sessions")
    public ResponseEntity<Map<String, String>> changePassword(@Valid @RequestBody ChangePasswordRequest changeRequest,
            HttpServletRequest request, HttpServletResponse response) {
        User user = userService.getCurrentUser();
        accountService.changePassword(user, changeRequest.getCurrentPassword(), changeRequest.getNewPassword());

        // Every other session of this user ends; this device gets a fresh one so it stays signed in
        String refreshToken = refreshTokenService.issue(user);
        response.addHeader(HttpHeaders.SET_COOKIE, refreshCookie(refreshToken, request).toString());
        return ResponseEntity.ok(Map.of(MESSAGE_KEY, "Password changed"));
    }

    @PostMapping("/forgot-password")
    @Operation(summary = "Forgot Password", description = "Sends a password reset OTP to the user's registered email")
    public ResponseEntity<Map<String, String>> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        passwordService.generateResetOtp(Objects.requireNonNull(request.getEmail()));
        return ResponseEntity.ok(Map.of(MESSAGE_KEY, "OTP sent to email"));
    }

    @PostMapping("/verify-otp")
    @Operation(summary = "Verify OTP", description = "Validates the provided OTP for password reset")
    public ResponseEntity<Map<String, String>> verifyOtp(@Valid @RequestBody OtpVerificationRequest request) {
        if (passwordService.validateOtp(Objects.requireNonNull(request.getEmail()),
                Objects.requireNonNull(request.getOtp())))
            return ResponseEntity.ok(Map.of(MESSAGE_KEY, "OTP verified"));
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(MESSAGE_KEY, "Invalid or expired OTP"));
    }

    @PostMapping("/reset-password")
    @Operation(summary = "Reset Password", description = "Resets the user's password using a valid OTP")
    public ResponseEntity<Map<String, String>> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        boolean success = passwordService.resetPassword(Objects.requireNonNull(request.getEmail()),
                Objects.requireNonNull(request.getOtp()), Objects.requireNonNull(request.getNewPassword()));
        if (success)
            return ResponseEntity.ok(Map.of(MESSAGE_KEY, "Password reset successful"));
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(MESSAGE_KEY, "Failed to reset password"));
    }

    @PostMapping("/verify-registration-otp")
    @Operation(summary = "Verify Registration OTP", description = "Verifies the OTP sent to user's email after registration to activate the account")
    public ResponseEntity<Map<String, String>> verifyRegistrationOtp(
            @Valid @RequestBody OtpVerificationRequest request) {
        boolean verified = passwordService.verifyRegistrationOtp(Objects.requireNonNull(request.getEmail()),
                Objects.requireNonNull(request.getOtp()));
        if (verified)
            return ResponseEntity.ok(Map.of(MESSAGE_KEY, "Email verification successful"));
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(MESSAGE_KEY, "Invalid or expired OTP"));
    }
}
