package com.example.backend.controllers;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.Optional;
import java.util.UUID;

import com.example.backend.dto.ForgotPasswordRequest;
import com.example.backend.models.RefreshToken;
import com.example.backend.repositories.RefreshTokenRepository;
import com.example.backend.security.JwtTokenProvider;
import com.example.backend.services.PasswordService;
import com.example.backend.services.ProfileService;
import com.example.backend.services.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import com.example.backend.dto.LoginRequest;
import com.example.backend.dto.RegisterRequest;
import com.example.backend.models.User;
import com.example.backend.services.EmailService;
import com.fasterxml.jackson.databind.ObjectMapper;

@SuppressWarnings("null")
@ExtendWith(MockitoExtension.class)
class AuthControllerTest {

    private MockMvc mockMvc;
    private ObjectMapper objectMapper = new ObjectMapper();

    @Mock
    private UserService userService;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private ProfileService profileService;
    @Mock
    private JwtTokenProvider jwtTokenProvider;
    @Mock
    private RefreshTokenRepository refreshTokenRepository;
    @Mock
    private EmailService emailService;
    @Mock
    private PasswordService passwordService;
    @Mock
    private org.modelmapper.ModelMapper modelMapper;

    @InjectMocks
    private AuthController authController;

    private User testUser;
    private RegisterRequest registerRequest;
    private LoginRequest loginRequest;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(authController).build();

        // Inject @Value fields
        ReflectionTestUtils.setField(authController, "refreshTokenCookieName", "refreshToken");
        ReflectionTestUtils.setField(authController, "refreshTokenCookieMaxAge", 604800);
        ReflectionTestUtils.setField(authController, "jwtExpirationMs", 900000L);

        testUser = new User();
        testUser.setId(UUID.randomUUID());
        testUser.setUsername("testuser");
        testUser.setEmail("test@example.com");
        testUser.setPassword("encodedPassword");
        testUser.setVerified(true);

        registerRequest = new RegisterRequest();
        registerRequest.setUsername("newuser");
        registerRequest.setEmail("new@example.com");
        registerRequest.setPassword("password");

        loginRequest = new LoginRequest();
        loginRequest.setUsername("testuser");
        loginRequest.setPassword("password");
    }

    @Test
    void register_WithNewUser_ShouldReturnCreated() throws Exception {
        // Arrange
        when(userService.findUserByUsername(anyString())).thenReturn(Optional.empty());
        when(userService.findUserByEmail(anyString())).thenReturn(Optional.empty());
        when(passwordEncoder.encode(anyString())).thenReturn("encodedPassword");
        when(userService.saveUser(any(RegisterRequest.class))).thenReturn(testUser);
        doNothing().when(passwordService).generateEmailVerificationOtp(anyString());

        // Act & Assert
        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.message").value("Registration successful"));

        verify(userService).saveUser(any(RegisterRequest.class));
        verify(passwordService).generateEmailVerificationOtp(anyString());
    }

    @Test
    void register_WithExistingUsername_ShouldReturnBadRequest() throws Exception {
        // Arrange
        when(userService.findUserByUsername(anyString())).thenReturn(Optional.of(testUser));

        // Act & Assert
        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Username already exists"));
    }

    @Test
    void register_WithExistingEmail_ShouldReturnBadRequest() throws Exception {
        // Arrange
        when(userService.findUserByUsername(anyString())).thenReturn(Optional.empty());
        when(userService.findUserByEmail(anyString())).thenReturn(Optional.of(testUser));

        // Act & Assert
        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Email already exists"));
    }

    @Test
    void login_WithValidCredentials_ShouldReturnJwtCookieAndAccessToken() throws Exception {
        // Arrange
        when(userService.findUserByUsername(anyString())).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches(anyString(), anyString())).thenReturn(true);
        when(jwtTokenProvider.generateAccessToken(anyString())).thenReturn("accessToken");
        when(jwtTokenProvider.generateRefreshToken(anyString())).thenReturn("refreshToken");
        when(refreshTokenRepository.findByUser(any(User.class))).thenReturn(Optional.empty());
        when(refreshTokenRepository.save(any(RefreshToken.class))).thenReturn(new RefreshToken());
        when(modelMapper.map(any(User.class), eq(com.example.backend.dto.UserDto.class)))
                .thenReturn(new com.example.backend.dto.UserDto());

        // Act
        MockHttpServletResponse response = mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.user").exists())
                .andExpect(jsonPath("$.accessToken").value("accessToken"))
                .andExpect(jsonPath("$.tokenType").value("Bearer"))
                .andExpect(jsonPath("$.expiresIn").value(900))
                .andReturn().getResponse();

        // Assert cookie
        String cookieHeader = response.getHeader(HttpHeaders.SET_COOKIE);
        assertNotNull(cookieHeader);
        assertTrue(cookieHeader.contains("refreshToken=refreshToken"));
        assertTrue(cookieHeader.contains("HttpOnly"));
        // Secure is setup dependent, usually check if we are simulating https or if config allows plain http
        // In the controller: boolean secure = request.isSecure();
        // Since MockMvc request is not secure by default, secure might be false.
        // But we can check for path and SameSite.
        assertTrue(cookieHeader.contains("Path=/"));
    }

    @Test
    void login_WithInvalidCredentials_ShouldReturnUnauthorized() throws Exception {
        // Arrange
        when(userService.findUserByUsername(anyString())).thenReturn(Optional.empty());

        // Act & Assert
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Invalid credentials"));
    }

    @Test
    void login_WithUnverifiedEmail_ShouldReturnUnauthorized() throws Exception {
        // Arrange
        testUser.setVerified(false);
        when(userService.findUserByUsername(anyString())).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches(anyString(), anyString())).thenReturn(true);

        // Act & Assert
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Email not verified"));
    }

    @Test
    void forgotPassword_WithValidEmail_ShouldReturnOk() throws Exception {
        // Arrange
        doNothing().when(passwordService).generateResetOtp(anyString());

        ForgotPasswordRequest forgotPasswordRequest = new ForgotPasswordRequest();
        forgotPasswordRequest.setEmail(testUser.getEmail());

        // Act & Assert
        mockMvc.perform(post("/api/auth/forgot-password")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(forgotPasswordRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("OTP sent to email"));
    }

    @Test
    void verifyOtp_WithValidOtp_ShouldReturnOk() throws Exception {
        // Arrange
        when(passwordService.validateOtp(anyString(), anyString())).thenReturn(true);

        // Act & Assert
        mockMvc.perform(post("/api/auth/verify-otp")
                .param("email", "test@example.com")
                .param("otp", "123456"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("OTP verified"));
    }

    @Test
    void verifyOtp_WithInvalidOtp_ShouldReturnBadRequest() throws Exception {
        // Arrange
        when(passwordService.validateOtp(anyString(), anyString())).thenReturn(false);

        // Act & Assert
        mockMvc.perform(post("/api/auth/verify-otp")
                .param("email", "test@example.com")
                .param("otp", "wrong"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Invalid or expired OTP"));
    }

    @Test
    void resetPassword_WithValidData_ShouldReturnOk() throws Exception {
        // Arrange
        when(passwordService.resetPassword(anyString(), anyString(), anyString())).thenReturn(true);

        // Act & Assert
        mockMvc.perform(post("/api/auth/reset-password")
                .param("email", "test@example.com")
                .param("otp", "123456")
                .param("newPassword", "newPassword"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Password reset successful"));
    }

    @Test
    void verifyRegistrationOtp_WithValidOtp_ShouldReturnOk() throws Exception {
        // Arrange
        when(passwordService.verifyRegistrationOtp(anyString(), anyString())).thenReturn(true);

        // Act & Assert
        mockMvc.perform(post("/api/auth/verify-registration-otp")
                .param("email", "test@example.com")
                .param("otp", "123456"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Email verification successful"));
    }

    @Test
    void verifyRegistrationOtp_WithInvalidOtp_ShouldReturnBadRequest() throws Exception {
        // Arrange
        when(passwordService.verifyRegistrationOtp(anyString(), anyString())).thenReturn(false);

        // Act & Assert
        mockMvc.perform(post("/api/auth/verify-registration-otp")
                .param("email", "test@example.com")
                .param("otp", "wrong"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Invalid or expired OTP"));
    }
}