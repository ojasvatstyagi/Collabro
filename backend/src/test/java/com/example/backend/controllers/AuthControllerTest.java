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
import com.example.backend.dto.OtpVerificationRequest;
import com.example.backend.dto.ResetPasswordRequest;
import com.example.backend.exceptions.GlobalExceptionHandler;
import com.example.backend.exceptions.TokenRefreshException;
import com.example.backend.security.JwtTokenProvider;
import com.example.backend.services.PasswordService;
import com.example.backend.services.ProfileService;
import com.example.backend.services.RefreshTokenService;
import com.example.backend.services.UserService;
import jakarta.servlet.http.Cookie;
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
    private RefreshTokenService refreshTokenService;
    @Mock
    private EmailService emailService;
    @Mock
    private PasswordService passwordService;
    @Mock
    private com.example.backend.services.AccountService accountService;
    @Mock
    private org.modelmapper.ModelMapper modelMapper;

    @InjectMocks
    private AuthController authController;

    private User testUser;
    private RegisterRequest registerRequest;
    private LoginRequest loginRequest;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(authController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();

        // Inject @Value fields
        ReflectionTestUtils.setField(authController, "refreshTokenCookieName", "refreshToken");
        ReflectionTestUtils.setField(authController, "refreshTokenCookieMaxAge", 604800);
        ReflectionTestUtils.setField(authController, "jwtExpirationMs", 900000L);
        ReflectionTestUtils.setField(authController, "refreshTokenCookieSecure", false);
        ReflectionTestUtils.setField(authController, "refreshTokenCookieSameSite", "Lax");

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
        when(refreshTokenService.issue(testUser)).thenReturn("refreshToken");
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

        // An unknown username still pays for a password check, so response time does not reveal it
        verify(passwordEncoder).matches(eq("password"), any());
    }

    @Test
    void login_WithWrongPassword_ShouldReturnSameErrorAsUnknownUser() throws Exception {
        when(userService.findUserByUsername(anyString())).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches(anyString(), anyString())).thenReturn(false);

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Invalid credentials"));

        verifyNoInteractions(refreshTokenService);
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
                .contentType(MediaType.APPLICATION_JSON)
                .content(otpBody("test@example.com", "123456")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("OTP verified"));
    }

    @Test
    void verifyOtp_WithInvalidOtp_ShouldReturnBadRequest() throws Exception {
        // Arrange
        when(passwordService.validateOtp(anyString(), anyString())).thenReturn(false);

        // Act & Assert
        mockMvc.perform(post("/api/auth/verify-otp")
                .contentType(MediaType.APPLICATION_JSON)
                .content(otpBody("test@example.com", "000000")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Invalid or expired OTP"));
    }

    @Test
    void resetPassword_WithValidData_ShouldReturnOk() throws Exception {
        // Arrange
        when(passwordService.resetPassword(anyString(), anyString(), anyString())).thenReturn(true);

        // Act & Assert
        ResetPasswordRequest body = new ResetPasswordRequest();
        body.setEmail("test@example.com");
        body.setOtp("123456");
        body.setNewPassword("newPassword");

        mockMvc.perform(post("/api/auth/reset-password")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Password reset successful"));
    }

    @Test
    void verifyRegistrationOtp_WithValidOtp_ShouldReturnOk() throws Exception {
        // Arrange
        when(passwordService.verifyRegistrationOtp(anyString(), anyString())).thenReturn(true);

        // Act & Assert
        mockMvc.perform(post("/api/auth/verify-registration-otp")
                .contentType(MediaType.APPLICATION_JSON)
                .content(otpBody("test@example.com", "123456")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Email verification successful"));
    }

    @Test
    void verifyRegistrationOtp_WithInvalidOtp_ShouldReturnBadRequest() throws Exception {
        // Arrange
        when(passwordService.verifyRegistrationOtp(anyString(), anyString())).thenReturn(false);

        // Act & Assert
        mockMvc.perform(post("/api/auth/verify-registration-otp")
                .contentType(MediaType.APPLICATION_JSON)
                .content(otpBody("test@example.com", "000000")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Invalid or expired OTP"));
    }

    @Test
    void otpEndpoints_RejectMalformedInputBeforeTouchingTheService() throws Exception {
        for (String path : new String[] { "/api/auth/verify-otp", "/api/auth/verify-registration-otp" }) {
            mockMvc.perform(post(path)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(otpBody("test@example.com", "12ab")))
                    .andExpect(status().isBadRequest());
            mockMvc.perform(post(path)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(otpBody("not-an-email", "123456")))
                    .andExpect(status().isBadRequest());
        }
        verifyNoInteractions(passwordService);
    }

    @Test
    void otpEndpoints_NoLongerAcceptQueryParameters() throws Exception {
        mockMvc.perform(post("/api/auth/verify-otp")
                .param("email", "test@example.com")
                .param("otp", "123456"))
                .andExpect(status().is4xxClientError());
        mockMvc.perform(post("/api/auth/reset-password")
                .param("email", "test@example.com")
                .param("otp", "123456")
                .param("newPassword", "newPassword"))
                .andExpect(status().is4xxClientError());
        verifyNoInteractions(passwordService);
    }

    @Test
    void resetPassword_WithTooShortPassword_ShouldReturnBadRequest() throws Exception {
        ResetPasswordRequest body = new ResetPasswordRequest();
        body.setEmail("test@example.com");
        body.setOtp("123456");
        body.setNewPassword("abc");

        mockMvc.perform(post("/api/auth/reset-password")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isBadRequest());
        verifyNoInteractions(passwordService);
    }

    // ---- refresh / logout ----

    @Test
    void refresh_WithValidCookie_ReturnsAccessTokenAndRotatesTheCookie() throws Exception {
        when(refreshTokenService.rotate("oldRefresh"))
                .thenReturn(new RefreshTokenService.Rotation(testUser, "newAccess", "newRefresh"));

        MockHttpServletResponse response = mockMvc.perform(post("/api/auth/refresh")
                .cookie(new Cookie("refreshToken", "oldRefresh")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").value("newAccess"))
                .andExpect(jsonPath("$.expiresIn").value(900))
                .andReturn().getResponse();

        String cookie = response.getHeader(HttpHeaders.SET_COOKIE);
        assertNotNull(cookie);
        assertTrue(cookie.contains("refreshToken=newRefresh"));
        assertTrue(cookie.contains("HttpOnly"));
    }

    @Test
    void refresh_ForConcurrentDuplicate_DoesNotOverwriteTheCookie() throws Exception {
        when(refreshTokenService.rotate("oldRefresh"))
                .thenReturn(new RefreshTokenService.Rotation(testUser, "newAccess", null));

        MockHttpServletResponse response = mockMvc.perform(post("/api/auth/refresh")
                .cookie(new Cookie("refreshToken", "oldRefresh")))
                .andExpect(status().isOk())
                .andReturn().getResponse();

        assertTrue(response.getHeaders(HttpHeaders.SET_COOKIE).isEmpty());
    }

    @Test
    void refresh_WithoutCookie_ReturnsUnauthorized() throws Exception {
        mockMvc.perform(post("/api/auth/refresh")).andExpect(status().isUnauthorized());

        verifyNoInteractions(refreshTokenService);
    }

    @Test
    void refresh_WhenTokenIsRejected_ReturnsUnauthorized() throws Exception {
        when(refreshTokenService.rotate("stolen"))
                .thenThrow(new TokenRefreshException("Refresh token reuse detected. Please login again."));

        mockMvc.perform(post("/api/auth/refresh").cookie(new Cookie("refreshToken", "stolen")))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void logout_RevokesTheSessionAndClearsTheCookie() throws Exception {
        MockHttpServletResponse response = mockMvc.perform(post("/api/auth/logout")
                .cookie(new Cookie("refreshToken", "someRefresh")))
                .andExpect(status().isOk())
                .andReturn().getResponse();

        verify(refreshTokenService).revoke("someRefresh");
        String cookie = response.getHeader(HttpHeaders.SET_COOKIE);
        assertNotNull(cookie);
        assertTrue(cookie.contains("Max-Age=0"));
    }

    @Test
    void me_WithARefreshTokenAsBearer_ReturnsUnauthorized() throws Exception {
        when(jwtTokenProvider.validateAccessToken("refreshJwt")).thenReturn(false);

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get("/api/auth/me")
                .header("Authorization", "Bearer refreshJwt"))
                .andExpect(status().isUnauthorized());

        verify(userService, never()).findUserByUsername(anyString());
    }

    private String otpBody(String email, String otp) throws Exception {
        OtpVerificationRequest body = new OtpVerificationRequest();
        body.setEmail(email);
        body.setOtp(otp);
        return objectMapper.writeValueAsString(body);
    }

    // ---- change password ----

    private String changePasswordBody(String current, String next) throws Exception {
        com.example.backend.dto.ChangePasswordRequest body = new com.example.backend.dto.ChangePasswordRequest();
        body.setCurrentPassword(current);
        body.setNewPassword(next);
        return objectMapper.writeValueAsString(body);
    }

    private org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder changePassword(String body) {
        return org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put("/api/auth/change-password")
                .contentType(MediaType.APPLICATION_JSON).content(body);
    }

    @Test
    void changePassword_Succeeds_AndKeepsThisDeviceSignedInWithAFreshSession() throws Exception {
        when(userService.getCurrentUser()).thenReturn(testUser);
        when(refreshTokenService.issue(testUser)).thenReturn("freshRefresh");

        MockHttpServletResponse response = mockMvc.perform(changePassword(changePasswordBody("old-pass", "new-pass")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Password changed"))
                .andReturn().getResponse();

        verify(accountService).changePassword(testUser, "old-pass", "new-pass");
        // issue() replaces every other session of the user; the cookie keeps this one alive
        assertTrue(response.getHeader(HttpHeaders.SET_COOKIE).contains("refreshToken=freshRefresh"));
    }

    @Test
    void changePassword_WithAWrongCurrentPassword_IsA400NotA401() throws Exception {
        when(userService.getCurrentUser()).thenReturn(testUser);
        org.mockito.Mockito.doThrow(new com.example.backend.exceptions.BadRequestException("Current password is incorrect"))
                .when(accountService).changePassword(testUser, "wrong", "new-pass");

        // A 401 would make the frontend think the session expired and sign the user out
        mockMvc.perform(changePassword(changePasswordBody("wrong", "new-pass")))
                .andExpect(status().isBadRequest());

        verifyNoInteractions(refreshTokenService);
    }

    @Test
    void changePassword_RejectsMissingOrShortPasswordsBeforeTouchingTheAccount() throws Exception {
        mockMvc.perform(changePassword(changePasswordBody("old-pass", "abc"))).andExpect(status().isBadRequest());
        mockMvc.perform(changePassword(changePasswordBody("", "new-pass"))).andExpect(status().isBadRequest());
        mockMvc.perform(changePassword("{}")).andExpect(status().isBadRequest());

        verifyNoInteractions(accountService);
    }

    // ---- refresh cookie flags ----

    private String loginCookie(boolean secureConfig, String sameSiteConfig, boolean httpsRequest) throws Exception {
        ReflectionTestUtils.setField(authController, "refreshTokenCookieSecure", secureConfig);
        ReflectionTestUtils.setField(authController, "refreshTokenCookieSameSite", sameSiteConfig);
        when(userService.findUserByUsername(anyString())).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches(anyString(), anyString())).thenReturn(true);
        when(jwtTokenProvider.generateAccessToken(anyString())).thenReturn("accessToken");
        when(refreshTokenService.issue(testUser)).thenReturn("refreshToken");
        when(modelMapper.map(any(User.class), eq(com.example.backend.dto.UserDto.class)))
                .thenReturn(new com.example.backend.dto.UserDto());

        return mockMvc.perform(post("/api/auth/login")
                .secure(httpsRequest)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getHeader(HttpHeaders.SET_COOKIE);
    }

    @Test
    void refreshCookie_IsSecureWhenConfiguredEvenIfTheRequestLooksPlainHttp() throws Exception {
        // What happens behind a proxy that terminates TLS
        String cookie = loginCookie(true, "Lax", false);

        assertTrue(cookie.contains("Secure"), cookie);
        assertTrue(cookie.contains("SameSite=Lax"), cookie);
    }

    @Test
    void refreshCookie_UsesTheConfiguredSameSite() throws Exception {
        String cookie = loginCookie(true, "Strict", true);

        assertTrue(cookie.contains("SameSite=Strict"), cookie);
    }

    @Test
    void refreshCookie_NeverCombinesSameSiteNoneWithAnInsecureCookie() throws Exception {
        String cookie = loginCookie(false, "None", false);

        assertTrue(cookie.contains("SameSite=Lax"), cookie);
        assertTrue(!cookie.contains("Secure"), cookie);
    }
}
