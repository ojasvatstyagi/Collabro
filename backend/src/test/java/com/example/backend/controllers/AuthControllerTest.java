package com.example.backend.controllers;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.Optional;
import java.util.UUID;
import java.util.Objects;

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
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import com.example.backend.dto.LoginRequest;
import com.example.backend.dto.RegisterRequest;
import com.example.backend.models.User;
import com.example.backend.services.EmailService;
import com.example.backend.utils.JwtUtils;
import com.fasterxml.jackson.databind.ObjectMapper;

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
    private JwtUtils jwtUtils;
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
        doNothing().when(passwordService).generateEmailVerificationOtp(Objects.requireNonNull(anyString()));

        // Act & Assert
        mockMvc.perform(post("/api/auth/register")
                .contentType(Objects.requireNonNull(MediaType.APPLICATION_JSON))
                .content(Objects.requireNonNull(objectMapper.writeValueAsString(registerRequest))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.message").value("Registration successful"));

        verify(userService).saveUser(any(RegisterRequest.class));
        verify(passwordService).generateEmailVerificationOtp(Objects.requireNonNull(anyString()));
    }

    @Test
    void register_WithExistingUsername_ShouldReturnBadRequest() throws Exception {
        // Arrange
        when(userService.findUserByUsername(anyString())).thenReturn(Optional.of(testUser));

        // Act & Assert
        mockMvc.perform(post("/api/auth/register")
                .contentType(Objects.requireNonNull(MediaType.APPLICATION_JSON))
                .content(Objects.requireNonNull(objectMapper.writeValueAsString(registerRequest))))
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
                .contentType(Objects.requireNonNull(MediaType.APPLICATION_JSON))
                .content(Objects.requireNonNull(objectMapper.writeValueAsString(registerRequest))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Email already exists"));
    }

    @Test
    void login_WithValidCredentials_ShouldReturnJwtCookie() throws Exception {
        // Arrange
        when(userService.findUserByUsername(anyString())).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches(anyString(), anyString())).thenReturn(true);
        when(jwtUtils.generateJwtToken(Objects.requireNonNull(any(User.class)))).thenReturn("testToken");
        when(modelMapper.map(Objects.requireNonNull(any(User.class)), eq(com.example.backend.dto.UserDto.class)))
                .thenReturn(new com.example.backend.dto.UserDto());

        // Act
        MockHttpServletResponse response = mockMvc.perform(post("/api/auth/login")
                .contentType(Objects.requireNonNull(MediaType.APPLICATION_JSON))
                .content(Objects.requireNonNull(objectMapper.writeValueAsString(loginRequest))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.user").exists())
                .andReturn().getResponse();

        // Assert cookie
        String cookieHeader = response.getHeader(HttpHeaders.SET_COOKIE);
        assertNotNull(cookieHeader);
        assertTrue(cookieHeader.contains("jwt=testToken"));
        assertTrue(cookieHeader.contains("HttpOnly"));
        assertTrue(cookieHeader.contains("Secure"));
        assertTrue(cookieHeader.contains("SameSite=Strict"));
    }

    @Test
    void login_WithInvalidCredentials_ShouldReturnUnauthorized() throws Exception {
        // Arrange
        when(userService.findUserByUsername(anyString())).thenReturn(Optional.empty());

        // Act & Assert
        mockMvc.perform(post("/api/auth/login")
                .contentType(Objects.requireNonNull(MediaType.APPLICATION_JSON))
                .content(Objects.requireNonNull(objectMapper.writeValueAsString(loginRequest))))
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
                .contentType(Objects.requireNonNull(MediaType.APPLICATION_JSON))
                .content(Objects.requireNonNull(objectMapper.writeValueAsString(loginRequest))))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Email not verified"));
    }

    @Test
    void forgotPassword_WithValidEmail_ShouldReturnOk() throws Exception {
        // Arrange
        doNothing().when(passwordService).generateResetOtp(Objects.requireNonNull(anyString()));

        // Act & Assert
        mockMvc.perform(post("/api/auth/forgot-password")
                .contentType(Objects.requireNonNull(MediaType.APPLICATION_JSON))
                .content(Objects.requireNonNull(objectMapper.writeValueAsString(loginRequest))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("OTP sent to email"));
    }

    @Test
    void verifyOtp_WithValidOtp_ShouldReturnOk() throws Exception {
        // Arrange
        when(passwordService.validateOtp(Objects.requireNonNull(anyString()),
                Objects.requireNonNull(anyString()))).thenReturn(true);

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
        when(passwordService.validateOtp(Objects.requireNonNull(anyString()),
                Objects.requireNonNull(anyString()))).thenReturn(false);

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
        when(passwordService.resetPassword(Objects.requireNonNull(anyString()),
                Objects.requireNonNull(anyString()),
                Objects.requireNonNull(anyString()))).thenReturn(true);

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
        when(passwordService.verifyRegistrationOtp(Objects.requireNonNull(anyString()),
                Objects.requireNonNull(anyString()))).thenReturn(true);

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
        when(passwordService.verifyRegistrationOtp(Objects.requireNonNull(anyString()),
                Objects.requireNonNull(anyString()))).thenReturn(false);

        // Act & Assert
        mockMvc.perform(post("/api/auth/verify-registration-otp")
                .param("email", "test@example.com")
                .param("otp", "wrong"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Invalid or expired OTP"));
    }
}