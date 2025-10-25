package com.example.backend.services;

import com.example.backend.dto.ProfileDto;
import com.example.backend.exceptions.BadRequestException;
import com.example.backend.exceptions.PdfExportException;
import com.example.backend.exceptions.ResourceNotFoundException;
import com.example.backend.models.Profile;
import lombok.NonNull;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Objects;
import java.util.UUID;

@Service
@Slf4j
public class FileStorageService {
    private final Path fileStorageLocation;
    private final ProfileService profileService;

    public FileStorageService(@Value("${app.upload.base-path}") String uploadDir, ProfileService profileService) {
        this.fileStorageLocation = Paths.get(uploadDir).toAbsolutePath().normalize();
        this.profileService = profileService;

        try {
            Files.createDirectories(this.fileStorageLocation);
        } catch (Exception ex) {
            throw new PdfExportException("Could not create upload directory");
        }
    }

    public String storeFile(@NonNull MultipartFile file, String directory) {
        String fileName = StringUtils.cleanPath(Objects.requireNonNull(file.getOriginalFilename()));
        String uniqueFileName = UUID.randomUUID() + "_" + fileName;
        Path targetLocation = this.fileStorageLocation.resolve(directory).resolve(uniqueFileName);

        try {
            Files.createDirectories(targetLocation.getParent());
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);
            return directory + "/" + uniqueFileName;
        } catch (IOException ex) {
            throw new ResourceNotFoundException("Could not store file " + fileName);
        }
    }

    public Resource loadFileAsResource(String filePath) {
        try {
            Path file = this.fileStorageLocation.resolve(filePath).normalize();
            Resource resource = new UrlResource(file.toUri());

            if (resource.exists()) {
                return resource;
            } else {
                throw new ResourceNotFoundException("File not found " + filePath);
            }
        } catch (MalformedURLException ex) {
            throw new ResourceNotFoundException("File not found " + filePath);
        }
    }

    public void deleteFile(String filePath) {
        try {
            Path file = this.fileStorageLocation.resolve(filePath).normalize();
            Files.deleteIfExists(file);
        } catch (IOException ex) {
            throw new ResourceNotFoundException("Could not delete file " + filePath);
        }
    }

    public ProfileDto uploadProfilePicture(MultipartFile file) throws BadRequestException {
        if (file.isEmpty()) {
            throw new BadRequestException("File is empty");
        }

        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new BadRequestException("Only image files are allowed");
        }

        Profile profile = profileService.getCurrentUserProfile();

        // Delete old picture if exists
        if (profile.getProfilePictureUrl() != null) {
            deleteFile(profile.getProfilePictureUrl());
        }

        // Store new picture
        String relativePath = storeFile(file, "profile-pictures");
        profile.setProfilePictureUrl(relativePath);

        profile = profileService.saveProfile(profile);

        return profileService.convertToDto(profile);
    }
}