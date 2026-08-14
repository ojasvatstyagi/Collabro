package com.example.backend.controllers;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** With app.docs.public=true (what the dev profile sets) the API description is open to anonymous visitors. */
@SpringBootTest(properties = "app.docs.public=true")
@AutoConfigureMockMvc
class DocsPublicSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void theApiDescriptionIsAvailableWithoutALogin() throws Exception {
        mockMvc.perform(get("/v3/api-docs"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.openapi").exists());
        mockMvc.perform(get("/swagger-ui/index.html")).andExpect(status().isOk());
    }

    @Test
    void otherEndpointsStillNeedALogin() throws Exception {
        mockMvc.perform(get("/api/teams/me")).andExpect(status().isUnauthorized());
    }
}
