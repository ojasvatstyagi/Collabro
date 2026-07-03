package com.example.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

/**
 * What other users may see of a profile (search results, team lists). It has no email, phone or settings:
 * those belong in {@link ProfileDto}, which is only returned to the profile's owner.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PublicProfileDto {
    private UUID id;
    private String username;
    private String firstname;
    private String lastname;
    private String bio;
    private String education;
    private String location;
    private String profilePictureUrl;
    private List<SkillDto> skills;
}
