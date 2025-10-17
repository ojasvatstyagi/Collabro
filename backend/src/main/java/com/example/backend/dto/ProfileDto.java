package com.example.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
@Builder
@AllArgsConstructor
public class ProfileDto {
    private UUID id;
    private String firstname;
    private String lastname;
    private String bio;
    private String education;
    private String profilePictureUrl;
    private boolean isProfileComplete;
    private int completionPercentage;
    private List<SkillDto> skills;
}