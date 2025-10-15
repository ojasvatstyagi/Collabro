package com.example.backend.services;

import com.example.backend.dtos.ProfileDto;
import com.example.backend.dtos.ProfileUpdateDto;
import com.example.backend.dtos.SkillDto;
import com.example.backend.exceptions.ResourceNotFoundException;
import com.example.backend.models.*;
import com.example.backend.repositories.ProfileRepository;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;

import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProfileService {

    private final ProfileRepository profileRepository;
    private final UserService userService;
    private final ModelMapper modelMapper;

    public Profile createEmptyProfile(User user) {
        return Profile.builder().user(user).build();
    }

    public Profile saveProfile(Profile profile) {
        return profileRepository.save(profile);
    }

    public Profile getCurrentUserProfile() {
        User user = userService.getCurrentUser();
        return profileRepository.findByUser(user)
                .orElseThrow(() -> new ResourceNotFoundException("Profile not found"));
    }

    public ProfileDto getCurrentUserProfileDto() {
        Profile profile = getCurrentUserProfile();
        return convertToDto(profile);
    }

    public ProfileDto updateProfile(ProfileUpdateDto updateDto) {
        Profile profile = getCurrentUserProfile();

        profile.setFirstname(updateDto.getFirstname());
        profile.setLastname(updateDto.getLastname());
        profile.setBio(updateDto.getBio());
        profile.setEducation(updateDto.getEducation());

        profile.calculateCompletion();
        profile = profileRepository.save(profile);

        return convertToDto(profile);
    }

    public ProfileDto convertToDto(Profile profile) {
//        return ProfileDto.builder()
//                .id(profile.getId())
//                .firstname(profile.getFirstname())
//                .lastname(profile.getLastname())
//                .bio(profile.getBio())
//                .education(profile.getEducation())
//                .profilePictureUrl(profile.getProfilePictureUrl())
//                .isProfileComplete(profile.isProfileComplete())
//                .completionPercentage(profile.getCompletionPercentage())
//                .skills(profile.getSkills().stream()
//                        .map(this::convertSkillToDto)
//                        .collect(Collectors.toList()))
//                .build();
        return modelMapper.map(profile, ProfileDto.class);
    }

    private SkillDto convertSkillToDto(Skill skill) {
//        return new SkillDto(skill.getId(), skill.getName(), skill.getProficiency());
        return modelMapper.map(skill, SkillDto.class);
    }
}
