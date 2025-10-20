package com.example.backend.controllers;

import com.example.backend.dto.SkillDto;
import com.example.backend.dto.SkillUpdateDto;
import com.example.backend.enums.Proficiency;
import com.example.backend.services.SkillService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class SkillControllerTest {

    private MockMvc mockMvc;

    @Mock
    private SkillService skillService;

    @InjectMocks
    private SkillController skillController;

    private SkillDto testSkillDto;
    private SkillUpdateDto testSkillUpdateDto;
    private UUID testId;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(skillController)
                .build();

        testId = UUID.randomUUID();
        testSkillDto = new SkillDto(testId, "Java", Proficiency.ADVANCED);
        testSkillUpdateDto = new SkillUpdateDto("Python", Proficiency.ADVANCED);
    }

    @Test
    void getCurrentUserSkills_ShouldReturnListOfSkills() throws Exception {
        // Arrange
        List<SkillDto> skills = List.of(testSkillDto);
        given(skillService.getCurrentUserSkills()).willReturn(skills);

        // Act & Assert
        mockMvc.perform(get("/api/profile/skills"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(testId.toString()))
                .andExpect(jsonPath("$[0].name").value("Java"))
                .andExpect(jsonPath("$[0].proficiency").value("ADVANCED"));
    }

    @Test
    void addSkill_ShouldReturnCreatedSkill() throws Exception {
        // Arrange
        given(skillService.addSkill(any(SkillUpdateDto.class))).willReturn(testSkillDto);

        // Act & Assert
        mockMvc.perform(post("/api/profile/skills")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Java\",\"proficiency\":\"ADVANCED\"}")) // Match your DTO
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(testId.toString()))
                .andExpect(jsonPath("$.name").value("Java"))
                .andExpect(jsonPath("$.proficiency").value("ADVANCED"));
    }


    @Test
    void updateSkill_ShouldReturnUpdatedSkill() throws Exception {
        // Arrange
        given(skillService.updateSkill(any(UUID.class), any(SkillUpdateDto.class))).willReturn(testSkillDto);

        // Act & Assert
        mockMvc.perform(put("/api/profile/skills/" + testId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Java\",\"proficiency\":\"ADVANCED\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(testId.toString()))
                .andExpect(jsonPath("$.name").value("Java"))
                .andExpect(jsonPath("$.proficiency").value("ADVANCED"));
    }

    @Test
    void deleteSkill_ShouldReturnNoContent() throws Exception {
        // Act & Assert
        mockMvc.perform(delete("/api/profile/skills/" + testId))
                .andExpect(status().isNoContent());

        verify(skillService).deleteSkill(testId);
    }
}
