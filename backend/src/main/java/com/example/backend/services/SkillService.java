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


import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SkillService {
    private final SkillRepository skillRepository;
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

        Skill skill = Skill.builder()
                .name(skillDto.getName())
                .proficiency(skillDto.getProficiency())
                .profile(profile)
                .build();

        skill = skillRepository.save(skill);
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

        skill.setName(skillDto.getName());
        skill.setProficiency(skillDto.getProficiency());
        skill = skillRepository.save(skill);

        profile.calculateCompletion();
        profileService.saveProfile(profile);

        return convertToDto(skill);
    }

    public void deleteSkill(UUID skillId) {
        Profile profile = profileService.getCurrentUserProfile();
        Skill skill = skillRepository.findByIdAndProfile(skillId, profile)
                .orElseThrow(() -> new ResourceNotFoundException("Skill not found"));

        skillRepository.delete(skill);
        profile.calculateCompletion();
        profileService.saveProfile(profile);
    }

    public List<String> searchSkills(String query) {
        return skillRepository.findSkillNamesContaining(query.toLowerCase());
    }

    private SkillDto convertToDto(Skill skill) {
        return modelMapper.map(skill, SkillDto.class);
    }
}