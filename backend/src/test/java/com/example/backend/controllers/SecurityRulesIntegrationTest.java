package com.example.backend.controllers;

import com.example.backend.models.Profile;
import com.example.backend.models.Skill;
import com.example.backend.models.SkillDefinition;
import com.example.backend.models.User;
import com.example.backend.enums.Proficiency;
import com.example.backend.repositories.ProfileRepository;
import com.example.backend.repositories.SkillDefinitionRepository;
import com.example.backend.repositories.UserRepository;
import com.example.backend.security.JwtTokenProvider;
import jakarta.transaction.Transactional;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** The real security filter chain and the real endpoints, to catch rules that are silently in the wrong order. */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class SecurityRulesIntegrationTest {

    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private JwtTokenProvider jwtTokenProvider;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private ProfileRepository profileRepository;
    @Autowired
    private SkillDefinitionRepository skillDefinitionRepository;

    private static final String BODY = "{\"currentPassword\":\"old-pass\",\"newPassword\":\"new-pass\"}";

    @Test
    void changePassword_RequiresALogin_EvenThoughTheAuthPathIsOtherwisePublic() throws Exception {
        mockMvc.perform(put("/api/auth/change-password").contentType(MediaType.APPLICATION_JSON).content(BODY))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void changePassword_WithARefreshTokenAsBearer_IsStillUnauthorized() throws Exception {
        mockMvc.perform(put("/api/auth/change-password").contentType(MediaType.APPLICATION_JSON).content(BODY)
                .header("Authorization", "Bearer " + jwtTokenProvider.generateRefreshToken("alice")))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void otherAuthEndpoints_StayPublic() throws Exception {
        // Reaches validation (400), not the security filter (401)
        mockMvc.perform(post("/api/auth/forgot-password").contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void theNewFeatureEndpoints_RequireALogin() throws Exception {
        for (String path : new String[] { "/api/teams/me", "/api/history", "/api/history/stats",
                "/api/achievements/me", "/api/matching/similar" }) {
            mockMvc.perform(get(path)).andExpect(status().isUnauthorized());
        }
        mockMvc.perform(post("/api/projects/" + java.util.UUID.randomUUID() + "/leave"))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(delete("/api/projects/" + java.util.UUID.randomUUID())).andExpect(status().isUnauthorized());
        mockMvc.perform(delete("/api/profile/me").contentType(MediaType.APPLICATION_JSON)
                .content("{\"password\":\"x\"}")).andExpect(status().isUnauthorized());
    }

    @Test
    void publicProfileSearch_WorksEndToEndAndLeaksNoContactDetails() throws Exception {
        User user = new User();
        user.setUsername("alice");
        user.setEmail("alice-private@example.com");
        user.setPassword("x");
        userRepository.save(user);
        Profile profile = Profile.builder().user(user).firstname("Alice").lastname("Test").phone("+49 555 0100")
                .location("Berlin").build();
        SkillDefinition java = skillDefinitionRepository.save(SkillDefinition.builder().name("Java").build());
        profile.getSkills().add(Skill.builder().definition(java).proficiency(Proficiency.ADVANCED).profile(profile).build());
        profileRepository.save(profile);

        mockMvc.perform(get("/api/matching/search").param("skills", "java").param("minProficiency", "INTERMEDIATE"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].username").value("alice"))
                .andExpect(jsonPath("$.content[0].skills[0].name").value("Java"))
                .andExpect(content().string(not(containsString("alice-private@example.com"))))
                .andExpect(content().string(not(containsString("+49 555 0100"))))
                .andExpect(content().string(not(containsString("\"email\""))))
                .andExpect(content().string(not(containsString("\"phone\""))));
    }

    @Test
    void publicProfileSearch_WithAnUnknownSortField_IsA400NotAServerError() throws Exception {
        mockMvc.perform(get("/api/matching/search").param("sort", "password,asc"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void publicProfileSearch_CapsThePageSize() throws Exception {
        mockMvc.perform(get("/api/matching/search").param("size", "100000"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.size").value(50));
    }
}
