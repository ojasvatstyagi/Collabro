package com.example.backend.controllers;

import com.example.backend.dtos.LoginRequest;
import com.example.backend.dtos.RegisterRequest;
import com.example.backend.models.User;
import com.example.backend.services.EmailService;
import com.example.backend.services.PasswordResetService;
import com.example.backend.services.ProfileService;
import com.example.backend.services.UserService;
import com.example.backend.utils.JwtUtils;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.servlet.http.HttpServletResponse;
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
    private final PasswordResetService resetService;

    @PostMapping("/register")
    @Operation(summary = "Register", description = "Registers a new user")
    public ResponseEntity<?> register(@RequestBody RegisterRequest registerRequest) {
        if (userService.findUserByUsername(registerRequest.getUsername()).isPresent())
            return ResponseEntity.badRequest().body(Map.of("message", "Username already exists"));

        if (userService.findUserByEmail(registerRequest.getEmail()).isPresent())
            return ResponseEntity.badRequest().body(Map.of("message", "Email already exists"));

        // Encode password and save user
        registerRequest.setHashed_password(passwordEncoder.encode(registerRequest.getHashed_password()));
        User savedUser = userService.saveUser(registerRequest);

        // Create and save empty profile for the user
        profileService.save(profileService.createEmptyProfile(savedUser));

        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("message", "Registration successful"));
    }

    @PostMapping("/login")
    @Operation(summary = "Login", description = "Logs in a user")
    public ResponseEntity<?> login(@RequestBody LoginRequest loginRequest, HttpServletResponse response) {
        Optional<User> userOpt = userService.findUserByUsername(loginRequest.getUsername());

        if (userOpt.isEmpty() || !passwordEncoder.matches(loginRequest.getPassword(), userOpt.get().getHashed_password())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Invalid credentials"));
        }

        User user = userOpt.get();
        String jwtToken = jwtUtils.generateJwtToken(user);

        ResponseCookie jwtCookie = ResponseCookie.from("jwt", jwtToken)
                .httpOnly(true)
                .secure(true)
                .path("/")
                .maxAge(Duration.ofDays(7))
                .sameSite("Strict")
                .build();

        response.setHeader(HttpHeaders.SET_COOKIE, jwtCookie.toString());

        return ResponseEntity.ok(Map.of("message", "Login successful"));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestParam String email) {
        resetService.generateOtp(email);
        return ResponseEntity.ok(Map.of("message", "OTP sent to email"));
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(@RequestParam String email, @RequestParam String otp) {
        if (resetService.validateOtp(email, otp))
            return ResponseEntity.ok(Map.of("message", "OTP verified"));
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", "Invalid or expired OTP"));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestParam String email,
                                           @RequestParam String otp,
                                           @RequestParam String newPassword) {
        boolean success = resetService.resetPassword(email, otp, newPassword);
        if (success)
            return ResponseEntity.ok(Map.of("message", "Password reset successful"));
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", "Failed to reset password"));
    }
}