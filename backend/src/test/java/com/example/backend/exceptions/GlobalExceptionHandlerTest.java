package com.example.backend.exceptions;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class GlobalExceptionHandlerTest {

    @RestController
    static class ThrowingController {
        @GetMapping("/forbidden")
        String forbidden() {
            throw new ForbiddenException("not yours");
        }

        @GetMapping("/access-denied")
        String accessDenied() {
            throw new AccessDeniedException("denied");
        }

        @GetMapping("/bad-request")
        String badRequest() {
            throw new BadRequestException("bad input");
        }

        @GetMapping("/duplicate")
        String duplicate() {
            throw new DuplicateResourceException("already there");
        }

        @GetMapping("/bad-sort")
        String badSort() {
            throw new org.springframework.data.mapping.PropertyReferenceException("password",
                    org.springframework.data.util.TypeInformation.of(Object.class), java.util.List.of());
        }

        @GetMapping("/boom")
        String boom() {
            throw new IllegalStateException("secret internals");
        }

        @PostMapping(value = "/json-only", consumes = "application/json")
        String jsonOnly(@RequestBody java.util.Map<String, String> body) {
            return "ok";
        }
    }

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(new ThrowingController())
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    void forbiddenException_Returns403WithMessage() throws Exception {
        mockMvc.perform(get("/forbidden"))
                .andExpect(status().isForbidden())
                .andExpect(content().string("not yours"));
    }

    @Test
    void springAccessDenied_Returns403() throws Exception {
        mockMvc.perform(get("/access-denied")).andExpect(status().isForbidden());
    }

    @Test
    void badRequestException_Returns400() throws Exception {
        mockMvc.perform(get("/bad-request"))
                .andExpect(status().isBadRequest())
                .andExpect(content().string("bad input"));
    }

    @Test
    void duplicateResourceException_Returns409() throws Exception {
        mockMvc.perform(get("/duplicate")).andExpect(status().isConflict());
    }

    @Test
    void wrongContentType_Returns415NotAServerError() throws Exception {
        mockMvc.perform(post("/json-only").param("a", "b")).andExpect(status().isUnsupportedMediaType());
    }

    @Test
    void wrongHttpMethod_Returns405NotAServerError() throws Exception {
        mockMvc.perform(get("/json-only")).andExpect(status().isMethodNotAllowed());
    }

    @Test
    void malformedJsonBody_Returns400() throws Exception {
        mockMvc.perform(post("/json-only").contentType("application/json").content("{not json"))
                .andExpect(status().isBadRequest())
                .andExpect(content().string("Malformed request body"));
    }

    @Test
    void unknownSortProperty_Returns400NotAServerError() throws Exception {
        mockMvc.perform(get("/bad-sort"))
                .andExpect(status().isBadRequest())
                .andExpect(content().string("Cannot sort or filter by 'password'"));
    }

    @Test
    void unexpectedException_Returns500WithoutLeakingDetails() throws Exception {
        mockMvc.perform(get("/boom"))
                .andExpect(status().isInternalServerError())
                .andExpect(content().string("An unexpected error occurred."));
    }
}
