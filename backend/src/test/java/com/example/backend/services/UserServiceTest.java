package com.example.backend.services;


import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.modelmapper.ModelMapper;

import com.example.backend.dto.RegisterRequest;
import com.example.backend.enums.RoleName;
import com.example.backend.models.Role;
import com.example.backend.models.User;
import com.example.backend.repositories.RoleRepository;
import com.example.backend.repositories.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private RoleRepository roleRepository;

    @Mock
    private ModelMapper modelMapper;

    @InjectMocks
    private UserService userService;

    private User testUser;
    private RegisterRequest registerRequest;
    private Role userRole;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(UUID.randomUUID());
        testUser.setUsername("testuser");
        testUser.setEmail("test@example.com");

        userRole = new Role();
        userRole.setRoleName(RoleName.ROLE_USER);

        registerRequest = new RegisterRequest();
        registerRequest.setUsername("newuser");
        registerRequest.setEmail("new@example.com");
        registerRequest.setPassword("password");
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void whenFindUserByUsername_withExistingUser_thenReturnUser() {
        // Arrange
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(testUser));

        // Act
        Optional<User> result = userService.findUserByUsername("testuser");

        // Assert
        assertTrue(result.isPresent());
        assertEquals("testuser", result.get().getUsername());
        verify(userRepository).findByUsername("testuser");
    }

    @Test
    void whenFindUserByUsername_withNonExistingUser_thenReturnEmpty() {
        // Arrange
        when(userRepository.findByUsername("nonexistent")).thenReturn(Optional.empty());

        // Act
        Optional<User> result = userService.findUserByUsername("nonexistent");

        // Assert
        assertTrue(result.isEmpty());
        verify(userRepository).findByUsername("nonexistent");
    }

    @Test
    void whenFindUserByEmail_withExistingEmail_thenReturnUser() {
        // Arrange
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));

        // Act
        Optional<User> result = userService.findUserByEmail("test@example.com");

        // Assert
        assertTrue(result.isPresent());
        assertEquals("test@example.com", result.get().getEmail());
        verify(userRepository).findByEmail("test@example.com");
    }

    @Test
    void whenFindUserByEmail_withNonExistingEmail_thenReturnEmpty() {
        // Arrange
        when(userRepository.findByEmail("nonexistent@example.com")).thenReturn(Optional.empty());

        // Act
        Optional<User> result = userService.findUserByEmail("nonexistent@example.com");

        // Assert
        assertTrue(result.isEmpty());
        verify(userRepository).findByEmail("nonexistent@example.com");
    }

    @Test
    void whenSaveUser_withValidRequest_thenReturnSavedUser() {
        // Arrange
        when(modelMapper.map(registerRequest, User.class)).thenReturn(testUser);
        when(roleRepository.findByRoleName(RoleName.ROLE_USER)).thenReturn(Optional.of(userRole));
        when(userRepository.save(testUser)).thenReturn(testUser);

        // Act
        User result = userService.saveUser(registerRequest);

        // Assert
        assertNotNull(result);
        assertEquals("testuser", result.getUsername());
        assertEquals(userRole, result.getRole());
        verify(modelMapper).map(registerRequest, User.class);
        verify(roleRepository).findByRoleName(RoleName.ROLE_USER);
        verify(userRepository).save(testUser);
    }

    @Test
    void whenSaveUser_withMissingDefaultRole_thenThrowException() {
        // Arrange
        when(modelMapper.map(registerRequest, User.class)).thenReturn(testUser);
        when(roleRepository.findByRoleName(RoleName.ROLE_USER)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(RuntimeException.class, () -> {
            userService.saveUser(registerRequest);
        });
        verify(modelMapper).map(registerRequest, User.class);
        verify(roleRepository).findByRoleName(RoleName.ROLE_USER);
        verify(userRepository, never()).save(any());
    }

    @Test
    void whenGetCurrentUser_withAuthenticatedUserDetails_thenReturnUser() {
        // Arrange
        Authentication authentication = mock(Authentication.class);
        SecurityContext securityContext = mock(SecurityContext.class);
        UserDetails userDetails = mock(UserDetails.class);

        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.isAuthenticated()).thenReturn(true);
        when(authentication.getPrincipal()).thenReturn(userDetails);
        when(userDetails.getUsername()).thenReturn("testuser");
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(testUser));

        SecurityContextHolder.setContext(securityContext);

        // Act
        User result = userService.getCurrentUser();

        // Assert
        assertNotNull(result);
        assertEquals("testuser", result.getUsername());
        verify(userRepository).findByUsername("testuser");
    }

    @Test
    void whenGetCurrentUser_withStringPrincipal_thenReturnUser() {
        // Arrange
        Authentication authentication = mock(Authentication.class);
        SecurityContext securityContext = mock(SecurityContext.class);

        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.isAuthenticated()).thenReturn(true);
        when(authentication.getPrincipal()).thenReturn("testuser");
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(testUser));

        SecurityContextHolder.setContext(securityContext);

        // Act
        User result = userService.getCurrentUser();

        // Assert
        assertNotNull(result);
        assertEquals("testuser", result.getUsername());
        verify(userRepository).findByUsername("testuser");
    }

    @Test
    void whenGetCurrentUser_withNotAuthenticated_thenReturnNull() {
        // Arrange
        Authentication authentication = mock(Authentication.class);
        SecurityContext securityContext = mock(SecurityContext.class);

        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.isAuthenticated()).thenReturn(false);

        SecurityContextHolder.setContext(securityContext);

        // Act
        User result = userService.getCurrentUser();

        // Assert
        assertNull(result);
        verify(userRepository, never()).findByUsername(any());
    }

    @Test
    void whenGetCurrentUser_withUserNotFound_thenReturnNull() {
        // Arrange
        Authentication authentication = mock(Authentication.class);
        SecurityContext securityContext = mock(SecurityContext.class);
        UserDetails userDetails = mock(UserDetails.class);

        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.isAuthenticated()).thenReturn(true);
        when(authentication.getPrincipal()).thenReturn(userDetails);
        when(userDetails.getUsername()).thenReturn("unknown");
        when(userRepository.findByUsername("unknown")).thenReturn(Optional.empty());

        SecurityContextHolder.setContext(securityContext);

        // Act
        User result = userService.getCurrentUser();

        // Assert
        assertNull(result);
        verify(userRepository).findByUsername("unknown");
    }
}