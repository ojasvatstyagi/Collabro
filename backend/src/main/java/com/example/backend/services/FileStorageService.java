package com.example.backend.services;

import com.example.backend.dto.ProfileDto;
import com.example.backend.exceptions.BadRequestException;
import com.example.backend.exceptions.ResourceNotFoundException;
import com.example.backend.exceptions.StorageException;
import com.example.backend.models.Profile;
import lombok.NonNull;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

/**
 * Stores uploaded files under one base directory. Every path handed in or read back from the database is
 * resolved against that directory and rejected if it would point outside it.
 */
@Service
@Slf4j
public class FileStorageService {

    static final long MAX_PICTURE_BYTES = 5L * 1024 * 1024;
    private static final int MAX_NAME_LENGTH = 100;

    /** Profile pictures: raster formats only. SVG is excluded on purpose, it can carry script. */
    private static final Map<String, String> PICTURE_TYPES = Map.of(
            "png", "image/png",
            "jpg", "image/jpeg",
            "jpeg", "image/jpeg",
            "gif", "image/gif",
            "webp", "image/webp");

    private final Path fileStorageLocation;
    private final ProfileService profileService;

    public FileStorageService(@Value("${app.upload.base-path}") String uploadDir, ProfileService profileService) {
        this.fileStorageLocation = Paths.get(uploadDir).toAbsolutePath().normalize();
        this.profileService = profileService;

        try {
            Files.createDirectories(this.fileStorageLocation);
        } catch (Exception ex) {
            throw new StorageException("Could not create upload directory", ex);
        }
    }

    /** @return the path relative to the storage root, as kept in the database */
    public String storeFile(@NonNull MultipartFile file, String directory) {
        String fileName = safeFileName(file.getOriginalFilename());
        String uniqueFileName = UUID.randomUUID() + "_" + fileName;
        Path targetDirectory = resolveInside(directory);
        Path targetLocation = resolveInside(directory + "/" + uniqueFileName);

        try (InputStream in = file.getInputStream()) {
            Files.createDirectories(targetDirectory);
            Files.copy(in, targetLocation, StandardCopyOption.REPLACE_EXISTING);
            return directory + "/" + uniqueFileName;
        } catch (IOException ex) {
            throw new StorageException("Could not store file " + fileName, ex);
        }
    }

    public Resource loadFileAsResource(String filePath) {
        try {
            Resource resource = new UrlResource(resolveInside(filePath).toUri());
            if (resource.exists()) {
                return resource;
            }
            throw new ResourceNotFoundException("File not found");
        } catch (MalformedURLException ex) {
            throw new ResourceNotFoundException("File not found");
        }
    }

    public void deleteFile(String filePath) {
        try {
            Files.deleteIfExists(resolveInside(filePath));
        } catch (IOException ex) {
            throw new StorageException("Could not delete file " + filePath, ex);
        }
    }

    public ProfileDto uploadProfilePicture(MultipartFile file) {
        if (file.isEmpty()) {
            throw new BadRequestException("File is empty");
        }
        if (file.getSize() > MAX_PICTURE_BYTES) {
            throw new BadRequestException("Profile pictures can be at most 5 MB");
        }
        String extension = extensionOf(file.getOriginalFilename());
        if (!PICTURE_TYPES.containsKey(extension)) {
            throw new BadRequestException("Only PNG, JPEG, GIF or WebP images are allowed");
        }
        // The extension and Content-Type are both chosen by the client, so check what the bytes really are
        if (!looksLikeImage(file, extension)) {
            throw new BadRequestException("The file is not a valid " + extension.toUpperCase(Locale.ROOT) + " image");
        }

        Profile profile = profileService.getCurrentUserProfile();
        String previousPicture = profile.getProfilePictureUrl();

        // Store the new picture first: if that fails the old one is still there
        profile.setProfilePictureUrl(storeFile(file, "profile-pictures"));
        profile = profileService.saveProfile(profile);

        if (previousPicture != null) {
            deleteFile(previousPicture);
        }
        return profileService.convertToDto(profile);
    }

    /** The Content-Type a stored picture should be served with, from its extension. */
    public static String pictureContentType(String filePath) {
        return PICTURE_TYPES.getOrDefault(extensionOf(filePath), "application/octet-stream");
    }

    /** Reduces a client-supplied name to a harmless one: no directories, only plain characters, bounded length. */
    static String safeFileName(String original) {
        String name = original == null ? "" : original.replace('\\', '/');
        name = name.substring(name.lastIndexOf('/') + 1).trim();
        name = name.replaceAll("[^A-Za-z0-9._ -]", "_").replaceAll("^\\.+", "");
        if (name.length() > MAX_NAME_LENGTH) {
            // Keep the extension when shortening
            String extension = extensionOf(name);
            name = name.substring(0, MAX_NAME_LENGTH - (extension.isEmpty() ? 0 : extension.length() + 1))
                    + (extension.isEmpty() ? "" : "." + extension);
        }
        if (name.isBlank()) {
            throw new BadRequestException("The file needs a name");
        }
        return name;
    }

    private Path resolveInside(String relativePath) {
        Path resolved = fileStorageLocation.resolve(relativePath == null ? "" : relativePath).normalize();
        if (!resolved.startsWith(fileStorageLocation)) {
            throw new BadRequestException("Invalid file path");
        }
        return resolved;
    }

    private static String extensionOf(String name) {
        if (name == null || name.lastIndexOf('.') < 0) {
            return "";
        }
        return name.substring(name.lastIndexOf('.') + 1).toLowerCase(Locale.ROOT);
    }

    private boolean looksLikeImage(MultipartFile file, String extension) {
        try (InputStream in = file.getInputStream()) {
            byte[] head = in.readNBytes(12);
            return switch (extension) {
                case "png" -> startsWith(head, 0x89, 'P', 'N', 'G');
                case "jpg", "jpeg" -> startsWith(head, 0xFF, 0xD8, 0xFF);
                case "gif" -> startsWith(head, 'G', 'I', 'F', '8');
                case "webp" -> startsWith(head, 'R', 'I', 'F', 'F') && head.length >= 12
                        && head[8] == 'W' && head[9] == 'E' && head[10] == 'B' && head[11] == 'P';
                default -> false;
            };
        } catch (IOException ex) {
            throw new StorageException("Could not read the uploaded file", ex);
        }
    }

    private static boolean startsWith(byte[] bytes, int... expected) {
        if (bytes.length < expected.length) {
            return false;
        }
        for (int i = 0; i < expected.length; i++) {
            if ((bytes[i] & 0xFF) != expected[i]) {
                return false;
            }
        }
        return true;
    }
}
