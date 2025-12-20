package com.example.backend.services;

import com.example.backend.dto.SkillDto;
import com.example.backend.dto.SkillUpdateDto;
import com.example.backend.exceptions.DuplicateResourceException;
import com.example.backend.exceptions.ResourceNotFoundException;
import com.example.backend.models.Profile;
import com.example.backend.models.Skill;
import com.example.backend.repositories.SkillRepository;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;

import com.example.backend.models.SkillDefinition;
import com.example.backend.repositories.SkillDefinitionRepository;
import java.util.List;
import java.util.UUID;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class SkillService {
    private final SkillRepository skillRepository;
    private final SkillDefinitionRepository skillDefinitionRepository;
    private final ProfileService profileService;
    private final ModelMapper modelMapper;

    public List<SkillDto> getCurrentUserSkills() {
        Profile profile = profileService.getCurrentUserProfile();
        return skillRepository.findByProfile(profile).stream()
                .map(this::convertToDto)
                .toList();
    }

    public SkillDto addSkill(SkillUpdateDto skillDto) {
        Profile profile = profileService.getCurrentUserProfile();

        boolean skillExists = skillRepository.findByProfile(profile).stream()
                .anyMatch(s -> s.getName().equalsIgnoreCase(skillDto.getName()));

        if (skillExists) {
            throw new DuplicateResourceException("Skill already exists in your profile");
        }

        String normalizedName = skillDto.getName().trim().toLowerCase();
        SkillDefinition definition = skillDefinitionRepository.findByNormalizedName(normalizedName)
                .orElseGet(() -> {
                    SkillDefinition newDef = SkillDefinition.builder()
                            .name(skillDto.getName())
                            .build();
                    return skillDefinitionRepository.save(Objects.requireNonNull(newDef));
                });

        Skill skill = Skill.builder()
                .definition(definition)
                .proficiency(skillDto.getProficiency())
                .profile(profile)
                .build();

        skill = skillRepository.save(Objects.requireNonNull(skill));
        profile.calculateCompletion();
        profileService.saveProfile(profile);

        return convertToDto(skill);
    }

    public SkillDto updateSkill(UUID skillId, SkillUpdateDto skillDto) {
        Profile profile = profileService.getCurrentUserProfile();
        Skill skill = skillRepository.findByIdAndProfile(skillId, profile)
                .orElseThrow(() -> new ResourceNotFoundException("Skill not found"));

        boolean nameConflict = skillRepository.findByProfile(profile).stream()
                .filter(s -> !s.getId().equals(skillId))
                .anyMatch(s -> s.getName().equalsIgnoreCase(skillDto.getName()));

        if (nameConflict) {
            throw new DuplicateResourceException("Another skill with this name already exists");
        }

        String normalizedName = skillDto.getName().trim().toLowerCase();
        SkillDefinition definition = skillDefinitionRepository.findByNormalizedName(normalizedName)
                .orElseGet(() -> {
                    SkillDefinition newDef = SkillDefinition.builder()
                            .name(skillDto.getName())
                            .build();
                    return skillDefinitionRepository.save(Objects.requireNonNull(newDef));
                });

        skill.setDefinition(definition);
        skill.setProficiency(skillDto.getProficiency());
        skill = skillRepository.save(Objects.requireNonNull(skill));

        profile.calculateCompletion();
        profileService.saveProfile(profile);

        return convertToDto(skill);
    }

    public void deleteSkill(UUID skillId) {
        Profile profile = profileService.getCurrentUserProfile();
        Skill skill = skillRepository.findByIdAndProfile(skillId, profile)
                .orElseThrow(() -> new ResourceNotFoundException("Skill not found"));

        skillRepository.delete(Objects.requireNonNull(skill));
        profile.calculateCompletion();
        profileService.saveProfile(profile);
    }

    public List<String> searchSkills(String query) {
        // Updated to search in definitions
        // Note: You might want to update the repo method to join with definitions
        return skillRepository.findSkillNamesContaining(query.toLowerCase());
    }

    private SkillDto convertToDto(Skill skill) {
        SkillDto dto = modelMapper.map(skill, SkillDto.class);
        dto.setName(skill.getName());
        return dto;
    }
}