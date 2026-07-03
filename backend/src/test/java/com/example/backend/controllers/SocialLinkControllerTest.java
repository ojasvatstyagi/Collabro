package com.example.backend.controllers;

import com.example.backend.dto.SocialLinkDto;
import com.example.backend.exceptions.GlobalExceptionHandler;
import com.example.backend.services.SocialLinkService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class SocialLinkControllerTest {

    @Mock
    private SocialLinkService socialLinkService;

    @InjectMocks
    private SocialLinkController controller;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(controller)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    private org.springframework.test.web.servlet.ResultActions add(String url) throws Exception {
        return mockMvc.perform(post("/api/profile/social-links").contentType(MediaType.APPLICATION_JSON)
                .content("{\"platform\":\"GITHUB\",\"url\":\"" + url + "\"}"));
    }

    @Test
    void addSocialLink_WithHttpsUrl_Succeeds() throws Exception {
        when(socialLinkService.addSocialLink(any())).thenReturn(new SocialLinkDto());

        add("https://github.com/alice").andExpect(status().is2xxSuccessful());
    }

    @Test
    void addSocialLink_WithHttpUrl_Succeeds() throws Exception {
        when(socialLinkService.addSocialLink(any())).thenReturn(new SocialLinkDto());

        add("HTTP://example.com/me").andExpect(status().is2xxSuccessful());
    }

    @Test
    void addSocialLink_WithScriptOrOtherSchemes_IsRejected() throws Exception {
        for (String url : new String[] { "javascript:alert(1)", "data:text/html,<b>x</b>", "ftp://example.com/x",
                "github.com/alice", "https://exa mple.com" }) {
            add(url).andExpect(status().isBadRequest());
        }
        verifyNoInteractions(socialLinkService);
    }
}
