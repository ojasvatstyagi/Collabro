package com.example.backend.services;

import com.example.backend.dto.ProfileDto;
import com.example.backend.dto.ProfileUpdateDto;
import com.example.backend.exceptions.PdfExportException;
import com.example.backend.exceptions.UserNotFoundException;
import com.example.backend.models.Profile;
import com.example.backend.models.User;
import com.example.backend.repositories.ProfileRepository;
import com.itextpdf.text.Document;
import com.itextpdf.text.Paragraph;
import com.itextpdf.text.pdf.PdfWriter;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.util.ArrayList;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class ProfileService {

    private final ProfileRepository profileRepository;
    private final UserService userService;
    private final ModelMapper modelMapper;

    public Profile createEmptyProfile(User user) {
        Objects.requireNonNull(user, "User cannot be null");

        return Profile.builder()
                .user(user)
                .firstname("New")
                .lastname("User")
                .isProfileComplete(false)
                .completionPercentage(0)
                .build();
    }

    public Profile saveProfile(Profile profile) {
        Objects.requireNonNull(profile, "Profile cannot be null");
        return profileRepository.save(profile);
    }

    public Profile getCurrentUserProfile() {
        User user = userService.getCurrentUser();
        return profileRepository.findByUser(user)
                .orElseThrow(() -> new UserNotFoundException("Profile not found for user: " + user.getUsername()));
    }

    public ProfileDto getCurrentUserProfileDto() {
        Profile profile = getCurrentUserProfile();
        return convertToDto(profile);
    }

    public ProfileDto updateProfile(ProfileUpdateDto updateDto) {
        Objects.requireNonNull(updateDto, "Update DTO cannot be null");
        Profile profile = getCurrentUserProfile();

        profile.setFirstname(updateDto.getFirstname());
        profile.setLastname(updateDto.getLastname());
        profile.setBio(updateDto.getBio());
        profile.setEducation(updateDto.getEducation());
        profile.setLocation(updateDto.getLocation());
        profile.setPhone(updateDto.getPhone());

        // Update settings if present
        if (updateDto.getNotificationsEnabled() != null) profile.setNotificationsEnabled(updateDto.getNotificationsEnabled());
        if (updateDto.getEmailNotifications() != null) profile.setEmailNotifications(updateDto.getEmailNotifications());
        if (updateDto.getProjectNotifications() != null) profile.setProjectNotifications(updateDto.getProjectNotifications());
        if (updateDto.getOpenForTeamInvites() != null) profile.setOpenForTeamInvites(updateDto.getOpenForTeamInvites());
        if (updateDto.getPreferredTeamSize() != null) profile.setPreferredTeamSize(updateDto.getPreferredTeamSize());
        if (updateDto.getProjectInterests() != null) {
            profile.getProjectInterests().clear();
            profile.getProjectInterests().addAll(updateDto.getProjectInterests());
        }

        profile.calculateCompletion(); // Optional: test impact of this

        profile = profileRepository.save(profile);

        return convertToDto(profile);
    }

    public ProfileDto convertToDto(Profile profile) {
        ProfileDto dto = modelMapper.map(profile, ProfileDto.class);
        if (profile.getUser() != null) {
            dto.setUsername(profile.getUser().getUsername());
            dto.setEmail(profile.getUser().getEmail());
        }

        // Map settings
        dto.setNotificationsEnabled(profile.isNotificationsEnabled());
        dto.setEmailNotifications(profile.isEmailNotifications());
        dto.setProjectNotifications(profile.isProjectNotifications());
        dto.setOpenForTeamInvites(profile.isOpenForTeamInvites());
        dto.setPreferredTeamSize(profile.getPreferredTeamSize());
        dto.setProjectInterests(new ArrayList<>(profile.getProjectInterests()));

        // Transform internal file path to public URL
        if (profile.getProfilePictureUrl() != null && !profile.getProfilePictureUrl().isEmpty()) {
            String path = profile.getProfilePictureUrl();
            // If it's already a http link (e.g. from google auth later), leave it.
            // If it's a relative path starting with profile-pictures/, convert it.
            if (!path.startsWith("http") && path.contains("profile-pictures/")) {
                // Extract filename
                String filename = path.substring(path.lastIndexOf("/") + 1);
                // Assuming standard API structure. You might want to make the base URL
                // configurable.
                dto.setProfilePictureUrl("/api/profile/picture/" + filename);
            }
        }

        return dto;
    }

    @NonNull
    public byte[] exportToPdf(Profile profile) {
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document document = new Document();
            PdfWriter.getInstance(document, out);
            document.open();

            document.add(new Paragraph("User Profile"));
            document.add(new Paragraph("Name: " + profile.getFirstname() + " " + profile.getLastname()));
            document.add(new Paragraph("Bio: " + profile.getBio()));
            document.add(new Paragraph("Education: " + profile.getEducation()));
            String skillsString = profile.getSkills().stream()
                    .map(Object::toString)
                    .collect(Collectors.joining(", "));
            document.add(new Paragraph("Skills: " + skillsString));
            document.add(new Paragraph("Profile Complete: " + profile.isProfileComplete()));
            document.add(new Paragraph("Completion: " + profile.getCompletionPercentage() + "%"));

            document.close();
            return Objects.requireNonNull(out.toByteArray());
        } catch (Exception e) {
            throw new PdfExportException("Failed to export profile to PDF");
        }
    }
}
