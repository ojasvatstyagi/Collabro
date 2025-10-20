package com.example.backend.services;

import com.example.backend.dto.ProfileDto;
import com.example.backend.dto.ProfileUpdateDto;
import com.example.backend.exceptions.PdfExportException;
import com.example.backend.exceptions.UserNotFoundException;
import com.example.backend.models.Profile;
import com.example.backend.models.User;
import com.example.backend.repositories.ProfileRepository;
import lombok.RequiredArgsConstructor;
import org.apache.commons.lang3.StringUtils;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.Objects;
import com.itextpdf.text.Document;
import com.itextpdf.text.Paragraph;
import com.itextpdf.text.pdf.PdfWriter;

import java.io.ByteArrayOutputStream;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class ProfileService {

    private final ProfileRepository profileRepository;
    private final UserService userService;
    private final ModelMapper modelMapper;
    private final FileStorageService fileStorageService;

    @Value("${app.upload.base-path:/uploads/}")
    private String uploadBasePath;

    public Profile createEmptyProfile(User user) {
        Objects.requireNonNull(user, "User cannot be null");
        return Profile.builder()
                .user(user)
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

        profile.calculateCompletion(); // Optional: test impact of this

        profile = profileRepository.save(profile);

        return convertToDto(profile);
    }

    public ProfileDto uploadProfilePicture(MultipartFile file) {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("Uploaded file is empty.");
        }
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new IllegalArgumentException("Only images are allowed.");
        }

        Profile profile = getCurrentUserProfile();

        if (StringUtils.isNotBlank(profile.getProfilePictureUrl())) {
            fileStorageService.deleteFile(profile.getProfilePictureUrl());
        }

        String filePath = fileStorageService.storeFile(file, "profile_pictures");
        profile.setProfilePictureUrl(uploadBasePath + filePath);
        profile = profileRepository.save(profile);

        return convertToDto(profile);
    }

    public ProfileDto convertToDto(Profile profile) {
        return modelMapper.map(profile, ProfileDto.class);
    }

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
            return out.toByteArray();
        } catch (Exception e) {
            throw new PdfExportException("Failed to export profile to PDF");
        }
    }
}
