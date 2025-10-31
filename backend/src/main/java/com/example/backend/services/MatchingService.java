package com.example.backend.services;

import com.example.backend.dto.ProfileDto;
import com.example.backend.dto.ProfileSearchCriteria;
import com.example.backend.exceptions.ResourceNotFoundException;
import com.example.backend.models.Profile;
import com.example.backend.models.Skill;
import com.example.backend.repositories.ProfileRepository;
import com.example.backend.repositories.SkillRepository;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class MatchingService {
    private final ProfileRepository profileRepository;
    private final SkillRepository skillRepository;
    private final ModelMapper modelMapper;

    public List<ProfileDto> findSimilarProfiles(UUID profileId) {
        List<String> userSkills = getSkills(profileId);

        return profileRepository.findProfilesWithMatchingSkills(
                        userSkills,
                        profileId
                ).stream()
                .map(this::convertToDto)
                .toList();
    }

    public List<ProfileDto> findComplementaryProfiles(UUID profileId) {
        List<String> userSkills = getSkills(profileId);

        return profileRepository.findProfilesWithComplementarySkills(
                        userSkills,
                        profileId
                ).stream()
                .map(this::convertToDto)
                .toList();
    }

    // 3. Filterable search
    public Page<ProfileDto> searchProfiles(ProfileSearchCriteria criteria, Pageable pageable) {
        Page<Profile> profiles = profileRepository.findAll(criteria.toSpecification(), pageable);
        return profiles.map(this::convertToDto);
    }

    private List<String> getSkills(UUID profileId) {
        Profile profile = profileRepository.findById(profileId)
                .orElseThrow(() -> new ResourceNotFoundException("Profile not found"));

        return profile.getSkills().stream()
                .map(Skill::getName)
                .toList();
    }


    private ProfileDto convertToDto(Profile profile) {
        return modelMapper.map(profile, ProfileDto.class);
    }
}