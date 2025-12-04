package com.example.backend.controllers;

import com.example.backend.dto.*;
import com.example.backend.models.User;

import com.example.backend.services.PasswordService;
import com.example.backend.services.ProfileService;
import com.example.backend.services.UserService;
import com.example.backend.utils.JwtUtils;
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

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@CrossOrigin
@Slf4j
public class AuthController {

    private final UserService userService;
    private final PasswordEncoder passwordEncoder;
    private final ProfileService profileService;
    private final JwtUtils jwtUtils;

    private final PasswordService passwordService;
    private final ModelMapper modelMapper;

    @Value("${app.jwt.expiration}")
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
        passwordService.generateEmailVerificationOtp(registerRequest.getEmail());

        // Create and saveProfile empty profile for the user
        profileService.saveProfile(profileService.createEmptyProfile(savedUser));
        log.info("User registered successfully: {}", savedUser.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(MESSAGE_KEY, "Registration successful"));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest loginRequest, HttpServletRequest request,
            HttpServletResponse response) {
        log.info("Attempting login for user: {}", loginRequest.getUsername());
        Optional<User> userOpt = userService.findUserByUsername(loginRequest.getUsername());
        if (userOpt.isEmpty() || !passwordEncoder.matches(loginRequest.getPassword(), userOpt.get().getPassword())) {
            log.warn("Invalid credentials for user: {}", loginRequest.getUsername());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of(MESSAGE_KEY, "Invalid credentials"));
        }
        User user = userOpt.get();
        if (!user.isVerified()) {
            log.warn("Email not verified for user: {}", loginRequest.getUsername());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of(MESSAGE_KEY, "Email not verified"));
        }

        String jwtToken = jwtUtils.generateJwtToken(user);
        // create cookie — set SameSite=None for cross-site usage, secure based on
        // env/request
        boolean secure = request.isSecure(); // or read property
        ResponseCookie cookie = ResponseCookie.from("jwt", jwtToken)
                .httpOnly(true)
                .secure(secure) // true on HTTPS, false on local dev
                .path("/")
                .maxAge(jwtExpirationMs / 1000) // expiration in seconds
                .sameSite(secure ? "None" : "Lax") // allow cross-site cookie if secure, otherwise Lax for local
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
        log.info("Login successful for user: {}", loginRequest.getUsername());
        UserDto dto = convertToDto(user);

        return ResponseEntity.ok(Map.of("user", dto));
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(HttpServletRequest request) {
        String jwt = parseJwt(request);
        if (jwt != null && jwtUtils.validateJwtToken(jwt)) {
            String username = jwtUtils.getUserNameFromJwtToken(jwt);
            Optional<User> userOpt = userService.findUserByUsername(username);
            if (userOpt.isPresent()) {
                return ResponseEntity.ok(Map.of("user", convertToDto(userOpt.get())));
            }
        }
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of(MESSAGE_KEY, "Unauthorized"));
    }

    private String parseJwt(HttpServletRequest request) {
        String headerAuth = request.getHeader("Authorization");

        if (org.springframework.util.StringUtils.hasText(headerAuth) && headerAuth.startsWith("Bearer ")) {
            return headerAuth.substring(7);
        } else if (request.getCookies() != null) {
            for (jakarta.servlet.http.Cookie cookie : request.getCookies()) {
                if ("jwt".equals(cookie.getName())) {
                    return cookie.getValue();
                }
            }
        }
        return null;
    }

    private UserDto convertToDto(User user) {
        UserDto dto = modelMapper.map(user, UserDto.class);
        if (user.getProfile() != null) {
            dto.setFirstname(user.getProfile().getFirstname());
            dto.setLastname(user.getProfile().getLastname());
            dto.setProfilePictureUrl(user.getProfile().getProfilePictureUrl());
            dto.setProfileComplete(user.getProfile().isProfileComplete());
        }
        if (user.getRole() != null) {
            dto.setRole(user.getRole().getRoleName());
        }
        return dto;
    }

    @PostMapping("/logout")
    public ResponseEntity<Map<String, String>> logout(HttpServletRequest request, HttpServletResponse response) {
        boolean secure = request.isSecure();
        ResponseCookie jwtCookie = ResponseCookie.from("jwt", "")
                .httpOnly(true)
                .secure(secure)
                .path("/")
                .maxAge(0)
                .sameSite(secure ? "None" : "Lax")
                .build();
        response.setHeader(HttpHeaders.SET_COOKIE, jwtCookie.toString());
        return ResponseEntity.ok(Map.of(MESSAGE_KEY, "Logout successful"));
    }

    @PostMapping("/forgot-password")
    @Operation(summary = "Forgot Password", description = "Sends a password reset OTP to the user's registered email")
    public ResponseEntity<Map<String, String>> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        passwordService.generateOtp(request.getEmail());
        return ResponseEntity.ok(Map.of(MESSAGE_KEY, "OTP sent to email"));
    }

    @PostMapping("/verify-otp")
    @Operation(summary = "Verify OTP", description = "Validates the provided OTP for password reset")
    public ResponseEntity<Map<String, String>> verifyOtp(@RequestParam String email, @RequestParam String otp) {
        if (passwordService.validateOtp(email, otp))
            return ResponseEntity.ok(Map.of(MESSAGE_KEY, "OTP verified"));
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(MESSAGE_KEY, "Invalid or expired OTP"));
    }

    @PostMapping("/reset-password")
    @Operation(summary = "Reset Password", description = "Resets the user's password using a valid OTP")
    public ResponseEntity<Map<String, String>> resetPassword(@RequestParam String email,
            @RequestParam String otp,
            @RequestParam String newPassword) {
        boolean success = passwordService.resetPassword(email, otp, newPassword);
        if (success)
            return ResponseEntity.ok(Map.of(MESSAGE_KEY, "Password reset successful"));
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(MESSAGE_KEY, "Failed to reset password"));
    }

    @PostMapping("/verify-registration-otp")
    @Operation(summary = "Verify Registration OTP", description = "Verifies the OTP sent to user's email after registration to activate the account")
    public ResponseEntity<Map<String, String>> verifyRegistrationOtp(@RequestParam String email,
            @RequestParam String otp) {
        boolean verified = passwordService.verifyRegistrationOtp(email, otp);
        if (verified)
            return ResponseEntity.ok(Map.of(MESSAGE_KEY, "Email verification successful"));
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(MESSAGE_KEY, "Invalid or expired OTP"));
    }
}
