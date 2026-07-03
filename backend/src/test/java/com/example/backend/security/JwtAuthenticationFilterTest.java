package com.example.backend.security;

import com.example.backend.services.CustomUserDetailsService;
import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.User;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class JwtAuthenticationFilterTest {

    @Mock
    private CustomUserDetailsService userDetailsService;
    @Mock
    private FilterChain filterChain;

    private JwtTokenProvider provider;
    private JwtAuthenticationFilter filter;

    @BeforeEach
    void setUp() {
        provider = new JwtTokenProvider();
        ReflectionTestUtils.setField(provider, "jwtSecret", "unit-test-secret-key-that-is-long-enough-0123456789");
        ReflectionTestUtils.setField(provider, "accessTokenExpiration", 900_000L);
        ReflectionTestUtils.setField(provider, "refreshTokenExpiration", 604_800_000L);
        filter = new JwtAuthenticationFilter(provider, userDetailsService);
        SecurityContextHolder.clearContext();
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    private MockHttpServletRequest requestWithBearer(String token) {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer " + token);
        return request;
    }

    @Test
    void validAccessToken_AuthenticatesTheUser() throws Exception {
        when(userDetailsService.loadUserByUsername("alice"))
                .thenReturn(new User("alice", "pw", List.of(new SimpleGrantedAuthority("ROLE_USER"))));

        filter.doFilter(requestWithBearer(provider.generateAccessToken("alice")), new MockHttpServletResponse(),
                filterChain);

        assertNotNull(SecurityContextHolder.getContext().getAuthentication());
        assertEquals("alice", SecurityContextHolder.getContext().getAuthentication().getName());
        verify(filterChain).doFilter(any(), any());
    }

    @Test
    void refreshTokenSentAsBearer_DoesNotAuthenticate() throws Exception {
        filter.doFilter(requestWithBearer(provider.generateRefreshToken("alice")), new MockHttpServletResponse(),
                filterChain);

        assertNull(SecurityContextHolder.getContext().getAuthentication());
        verifyNoInteractions(userDetailsService);
        verify(filterChain).doFilter(any(), any());
    }

    @Test
    void garbageToken_DoesNotAuthenticate() throws Exception {
        filter.doFilter(requestWithBearer("not-a-jwt"), new MockHttpServletResponse(), filterChain);

        assertNull(SecurityContextHolder.getContext().getAuthentication());
        verifyNoInteractions(userDetailsService);
    }

    @Test
    void noAuthorizationHeader_DoesNotAuthenticate() throws Exception {
        filter.doFilter(new MockHttpServletRequest(), new MockHttpServletResponse(), filterChain);

        assertNull(SecurityContextHolder.getContext().getAuthentication());
        verify(filterChain).doFilter(any(), any());
    }
}
