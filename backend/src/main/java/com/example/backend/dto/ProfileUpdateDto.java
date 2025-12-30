package com.example.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ProfileUpdateDto {
    @NotBlank(message = "First name is required")
    @Size(min = 2, max = 50, message = "First name must be between 2-50 characters")

    @Pattern(regexp = "^[a-zA-Z\\s-']+$", message = "First name contains invalid characters")
    private String firstname;

    @NotBlank(message = "Last name is required")
    @Size(min = 2, max = 50, message = "Last name must be between 2-50 characters")
    @Pattern(regexp = "^[a-zA-Z\\s-']+$", message = "Last name contains invalid characters")
    private String lastname;

    @Size(max = 1000, message = "Bio cannot exceed 1000 characters")
    private String bio;

    @Size(max = 100, message = "Education cannot exceed 100 characters")
    private String education;

    @Size(max = 255, message = "Location cannot exceed 255 characters")
    private String location;

    @Pattern(regexp = "^\\+?[0-9 .()-]{7,25}$", message = "Invalid phone number format")
    private String phone;

    // Settings
    private Boolean notificationsEnabled;
    private Boolean emailNotifications;
    private Boolean projectNotifications;
    private Boolean openForTeamInvites;
    private String preferredTeamSize;
    private java.util.List<String> projectInterests;
}