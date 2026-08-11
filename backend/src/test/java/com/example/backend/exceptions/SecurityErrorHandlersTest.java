package com.example.backend.exceptions;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.access.AccessDeniedException;

import static org.junit.jupiter.api.Assertions.*;

class SecurityErrorHandlersTest {

    private final ObjectMapper mapper = new ObjectMapper();
    private final CustomAuthenticationEntryPoint entryPoint = new CustomAuthenticationEntryPoint(mapper);
    private final CustomAccessDeniedHandler deniedHandler = new CustomAccessDeniedHandler(mapper);

    // What used to break the hand-built JSON, or leak: quotes, backslashes, newlines, markup, non-ASCII
    private static final String HOSTILE = "bad \"quote\" \\ back\nline </script><b>x</b> é中";

    @Test
    void unauthenticated_Is401WithValidJsonEvenWhenTheExceptionMessageIsHostile() throws Exception {
        MockHttpServletResponse response = new MockHttpServletResponse();

        entryPoint.commence(new MockHttpServletRequest(), response, new BadCredentialsException(HOSTILE));

        assertEquals(401, response.getStatus());
        assertTrue(response.getContentType().startsWith("application/json"));
        JsonNode body = mapper.readTree(response.getContentAsString());   // throws if it is not valid JSON
        assertEquals("Authentication is required", body.get("message").asText());
        assertEquals(1, body.size());
    }

    @Test
    void forbidden_Is403WithValidJsonEvenWhenTheExceptionMessageIsHostile() throws Exception {
        MockHttpServletResponse response = new MockHttpServletResponse();

        deniedHandler.handle(new MockHttpServletRequest(), response, new AccessDeniedException(HOSTILE));

        assertEquals(403, response.getStatus());
        assertTrue(response.getContentType().startsWith("application/json"));
        JsonNode body = mapper.readTree(response.getContentAsString());
        assertEquals("You do not have permission to do that", body.get("message").asText());
        assertEquals(1, body.size());
    }

    @Test
    void neitherEchoesTheExceptionsOwnWording() throws Exception {
        MockHttpServletResponse unauthorized = new MockHttpServletResponse();
        MockHttpServletResponse forbidden = new MockHttpServletResponse();

        entryPoint.commence(new MockHttpServletRequest(), unauthorized,
                new BadCredentialsException("Full authentication is required to access this resource"));
        deniedHandler.handle(new MockHttpServletRequest(), forbidden, new AccessDeniedException("Access is denied"));

        assertFalse(unauthorized.getContentAsString().contains("Full authentication"));
        assertFalse(forbidden.getContentAsString().contains("Access is denied"));
    }
}
