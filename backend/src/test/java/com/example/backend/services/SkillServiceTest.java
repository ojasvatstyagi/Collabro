package com.example.backend.services;

import com.example.backend.dto.SkillDto;
import com.example.backend.dto.SkillUpdateDto;
import com.example.backend.enums.Proficiency;
import com.example.backend.models.Profile;
import com.example.backend.models.Skill;
import com.example.backend.repositories.SkillRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.modelmapper.ModelMapper;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SkillServiceTest {

    @Mock
    private SkillRepository skillRepository;

    @Mock
    private ProfileService profileService;

    @Mock
    private ModelMapper modelMapper;

    @InjectMocks
    private SkillService skillService;

    private Profile testProfile;
    private Skill testSkill;
    private SkillDto testSkillDto;

    @BeforeEach
    void setUp() {
        testProfile = new Profile();
        testProfile.setId(UUID.randomUUID());
        testProfile.setSkills(new ArrayList<>()); // Initialize skills list

        testSkill = Skill.builder()
                .id(UUID.randomUUID())
                .name("Java")
                .proficiency(Proficiency.ADVANCED)
                .profile(testProfile)
                .build();

        testSkillDto = new SkillDto(testSkill.getId(), testSkill.getName(), testSkill.getProficiency());

        // Add skill to profile's skills list
        testProfile.getSkills().add(testSkill);
    }

    @Test
    void getCurrentUserSkills_ShouldReturnSkillList() {
        // Arrange
        when(profileService.getCurrentUserProfile()).thenReturn(testProfile);
        when(modelMapper.map(testSkill, SkillDto.class)).thenReturn(testSkillDto);

        // Act
        List<SkillDto> result = skillService.getCurrentUserSkills();

        // Assert
        assertEquals(1, result.size());
        assertEquals("Java", result.get(0).getName());
        verify(modelMapper).map(testSkill, SkillDto.class);
    }

    @Test
    void addSkill_ShouldCreateNewSkill() {
        // Arrange
        SkillUpdateDto dto = new SkillUpdateDto("Python", Proficiency.ADVANCED);
        Skill newSkill = Skill.builder()
                .name(dto.getName())
                .proficiency(dto.getProficiency())
                .profile(testProfile)
                .build();

        Skill savedSkill = Skill.builder()
                .id(UUID.randomUUID())
                .name(newSkill.getName())
                .proficiency(newSkill.getProficiency())
                .profile(newSkill.getProfile())
                .build();

        SkillDto expectedDto = new SkillDto(savedSkill.getId(), savedSkill.getName(), savedSkill.getProficiency());

        when(profileService.getCurrentUserProfile()).thenReturn(testProfile);
        when(skillRepository.save(any(Skill.class))).thenReturn(savedSkill);
        when(modelMapper.map(savedSkill, SkillDto.class)).thenReturn(expectedDto);

        // Act
        SkillDto result = skillService.addSkill(dto);

        // Assert
        assertNotNull(result);
        assertEquals("Python", result.getName());
        verify(profileService).saveProfile(testProfile);
        verify(skillRepository).save(argThat(skill ->
                skill.getName().equals("Python") && skill.getProfile().equals(testProfile)
        ));
    }

    @Test
    void deleteSkill_ShouldRemoveSkill() {
        // Arrange
        UUID skillId = testSkill.getId();
        when(profileService.getCurrentUserProfile()).thenReturn(testProfile);
        when(skillRepository.findByIdAndProfile(skillId, testProfile)).thenReturn(Optional.of(testSkill));

        // Act
        skillService.deleteSkill(skillId);

        // Assert
        verify(skillRepository).delete(testSkill);
        verify(profileService).saveProfile(testProfile);
    }
}
