package com.example.backend.controllers;

import com.example.backend.dtos.LoginRequest;
import com.example.backend.dtos.RegisterRequest;
import com.example.backend.models.User;
import com.example.backend.services.EmailService;
import com.example.backend.services.PasswordService;
import com.example.backend.services.ProfileService;
import com.example.backend.services.UserService;
import com.example.backend.utils.JwtUtils;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@CrossOrigin
public class AuthController {

    private final UserService userService;
    private final PasswordEncoder passwordEncoder;
    private final ProfileService profileService;
    private final JwtUtils jwtUtils;
    private final EmailService emailService;
    private final PasswordService passwordService;
    private static final String MESSAGE_KEY = "message";

    @Transactional
    @PostMapping("/register")
    @Operation(summary = "Register User", description = "Registers a new user and sends OTP for email verification")
    public ResponseEntity<Map<String, String>> register(@RequestBody RegisterRequest registerRequest) {
        if (userService.findUserByUsername(registerRequest.getUsername()).isPresent())
            return ResponseEntity.badRequest().body(Map.of(MESSAGE_KEY, "Username already exists"));

        if (userService.findUserByEmail(registerRequest.getEmail()).isPresent())
            return ResponseEntity.badRequest().body(Map.of(MESSAGE_KEY, "Email already exists"));

        // Encode password and save user
        registerRequest.setPassword(passwordEncoder.encode(registerRequest.getPassword()));
        User savedUser = userService.saveUser(registerRequest);
        // Generate email verification OTP
        passwordService.generateEmailVerificationOtp(registerRequest.getEmail());

        // Create and save empty profile for the user
        profileService.save(profileService.createEmptyProfile(savedUser));

        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(MESSAGE_KEY, "Registration successful"));
    }

    @PostMapping("/login")
    @Operation(summary = "User Login", description = "Authenticates user credentials and returns JWT token if email is verified")
    public ResponseEntity<Map<String, String>> login(@RequestBody LoginRequest loginRequest, HttpServletResponse response) {
        Optional<User> userOpt = userService.findUserByUsername(loginRequest.getUsername());

        if (userOpt.isEmpty() || !passwordEncoder.matches(loginRequest.getPassword(), userOpt.get().getPassword())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of(MESSAGE_KEY, "Invalid credentials"));
        }

        User user = userOpt.get();

        if (!user.isVerified()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of(MESSAGE_KEY, "Email not verified"));
        }
        String jwtToken = jwtUtils.generateJwtToken(user);

        ResponseCookie jwtCookie = ResponseCookie.from("jwt", jwtToken)
                .httpOnly(true)
                .secure(true)
                .path("/")
                .maxAge(Duration.ofDays(7))
                .sameSite("Strict")
                .build();

        response.setHeader(HttpHeaders.SET_COOKIE, jwtCookie.toString());

        return ResponseEntity.ok(Map.of(MESSAGE_KEY, "Login successful"));
    }

    @PostMapping("/forgot-password")
    @Operation(summary = "Forgot Password", description = "Sends a password reset OTP to the user's registered email")
    public ResponseEntity<Map<String, String>> forgotPassword(@RequestBody Map<String, String> body) {
        passwordService.generateOtp(body.get("email"));
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
    public ResponseEntity<Map<String, String>> verifyRegistrationOtp(@RequestParam String email, @RequestParam String otp) {
        boolean verified = passwordService.verifyRegistrationOtp(email, otp);
        if (verified)
            return ResponseEntity.ok(Map.of(MESSAGE_KEY, "Email verification successful"));
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(MESSAGE_KEY, "Invalid or expired OTP"));
    }
}