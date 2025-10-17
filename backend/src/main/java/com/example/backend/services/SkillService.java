package com.example.backend.services;

import com.example.backend.dto.SkillDto;
import com.example.backend.dto.SkillUpdateDto;
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
        return profile.getSkills().stream()
                .map(this::convertToDto)
                .toList();
    }

    public SkillDto addSkill(SkillUpdateDto skillDto) {
        Profile profile = profileService.getCurrentUserProfile();

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
        Skill skill = skillRepository.findByIdAndProfile(skillId, profileService.getCurrentUserProfile())
                .orElseThrow(() -> new ResourceNotFoundException("Skill not found"));

        skill.setName(skillDto.getName());
        skill.setProficiency(skillDto.getProficiency());
        skill = skillRepository.save(skill);

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

    private SkillDto convertToDto(Skill skill) {
        return modelMapper.map(skill, SkillDto.class);
    }
}