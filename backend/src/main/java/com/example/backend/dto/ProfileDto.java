package com.example.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ProfileDto {
    private UUID id;
    private String username;
    private String email;
    private String firstname;
    private String lastname;
    private String bio;
    private String education;
    private String location;
    private String phone;
    private String profilePictureUrl;
    
    private boolean notificationsEnabled;
    private boolean emailNotifications;
    private boolean projectNotifications;
    
    private boolean openForTeamInvites;
    private String preferredTeamSize;
    private List<String> projectInterests;

    private boolean isProfileComplete;
    private int completionPercentage;
    private List<SkillDto> skills;
    private List<SocialLinkDto> socialLinks;
    private java.time.LocalDateTime createdAt;
    private java.time.LocalDateTime updatedAt;
}