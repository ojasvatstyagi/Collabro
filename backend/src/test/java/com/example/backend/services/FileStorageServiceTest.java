package com.example.backend.services;

import com.example.backend.dto.ProfileDto;
import com.example.backend.exceptions.BadRequestException;
import com.example.backend.exceptions.ResourceNotFoundException;
import com.example.backend.models.Profile;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.io.TempDir;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.io.Resource;
import org.springframework.mock.web.MockMultipartFile;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class FileStorageServiceTest {

    private static final byte[] PNG = {(byte) 0x89, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A, 0x0A, 0, 0, 0, 0};
    private static final byte[] JPEG = {(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xE0, 0, 0, 0, 0, 0, 0, 0, 0};
    private static final byte[] WEBP = {'R', 'I', 'F', 'F', 0, 0, 0, 0, 'W', 'E', 'B', 'P'};

    @TempDir
    Path root;

    @Mock
    private ProfileService profileService;

    private FileStorageService storage;
    private Profile profile;

    @BeforeEach
    void setUp() {
        storage = new FileStorageService(root.resolve("uploads").toString(), profileService);
        profile = Profile.builder().firstname("a").lastname("b").build();
        lenient().when(profileService.getCurrentUserProfile()).thenReturn(profile);
        lenient().when(profileService.saveProfile(any(Profile.class))).thenAnswer(inv -> inv.getArgument(0));
        lenient().when(profileService.convertToDto(any(Profile.class))).thenReturn(new ProfileDto());
    }

    private MockMultipartFile upload(String name, byte[] content) {
        return new MockMultipartFile("file", name, "application/octet-stream", content);
    }

    private long storedFileCount() throws Exception {
        try (Stream<Path> files = Files.walk(root.resolve("uploads"))) {
            return files.filter(Files::isRegularFile).count();
        }
    }

    // ---- storing and reading ----

    @Test
    void storeFile_KeepsTheFileUnderTheBaseDirectory() throws Exception {
        String stored = storage.storeFile(upload("spec.pdf", "hello".getBytes()), "project-files/abc");

        assertTrue(stored.startsWith("project-files/abc/"));
        assertTrue(stored.endsWith("_spec.pdf"));
        assertEquals("hello", new String(storage.loadFileAsResource(stored).getInputStream().readAllBytes()));
    }

    @Test
    void storeFile_StripsDirectoriesAndOddCharactersFromTheClientsName() {
        String stored = storage.storeFile(upload("../../etc/pass wd<script>.txt", "x".getBytes()), "project-files/abc");

        assertFalse(stored.contains(".."), stored);
        assertTrue(stored.startsWith("project-files/abc/"));
        assertFalse(stored.substring("project-files/abc/".length()).contains("/"), stored);
        assertFalse(stored.contains("<"), stored);
    }

    @Test
    void storeFile_RejectsADirectoryThatEscapesTheBase() throws Exception {
        assertThrows(BadRequestException.class,
                () -> storage.storeFile(upload("a.txt", "x".getBytes()), "../outside"));

        assertEquals(0, storedFileCount());
        assertFalse(Files.exists(root.resolve("outside")));
    }

    @Test
    void loadAndDelete_RefuseToLeaveTheBaseDirectory() throws Exception {
        Path secret = Files.writeString(root.resolve("secret.txt"), "top secret");

        assertThrows(BadRequestException.class, () -> storage.loadFileAsResource("../secret.txt"));
        assertThrows(BadRequestException.class, () -> storage.deleteFile("../secret.txt"));
        assertThrows(BadRequestException.class, () -> storage.deleteFile("profile-pictures/../../secret.txt"));
        assertTrue(Files.exists(secret), "the file outside the base must be untouched");
    }

    @Test
    void loadFileAsResource_ForAMissingFile_IsNotFound() {
        assertThrows(ResourceNotFoundException.class, () -> storage.loadFileAsResource("project-files/none/x.txt"));
    }

    @Test
    void deleteFile_RemovesTheStoredFileAndIgnoresAMissingOne() throws Exception {
        String stored = storage.storeFile(upload("a.txt", "x".getBytes()), "project-files/abc");

        storage.deleteFile(stored);
        storage.deleteFile(stored);

        assertEquals(0, storedFileCount());
    }

    @Test
    void safeFileName_HandlesTheAwkwardCases() {
        assertEquals("report.pdf", FileStorageService.safeFileName("C:\\Users\\me\\report.pdf"));
        assertEquals("hidden", FileStorageService.safeFileName(".hidden"));
        assertEquals("my file.txt", FileStorageService.safeFileName("my file.txt"));
        String longName = FileStorageService.safeFileName("x".repeat(300) + ".png");
        assertTrue(longName.length() <= 100 && longName.endsWith(".png"), longName);
        assertThrows(BadRequestException.class, () -> FileStorageService.safeFileName(null));
        assertThrows(BadRequestException.class, () -> FileStorageService.safeFileName("   "));
        assertThrows(BadRequestException.class, () -> FileStorageService.safeFileName("..."));
    }

    // ---- profile pictures ----

    @Test
    void uploadProfilePicture_AcceptsRealImagesOfEachSupportedType() throws Exception {
        storage.uploadProfilePicture(upload("a.png", PNG));
        storage.uploadProfilePicture(upload("a.JPG", JPEG));
        storage.uploadProfilePicture(upload("a.webp", WEBP));

        assertEquals(1, storedFileCount(), "each upload replaces the previous picture");
        assertTrue(profile.getProfilePictureUrl().startsWith("profile-pictures/"));
    }

    @Test
    void uploadProfilePicture_RejectsSvgAndOtherTypes() throws Exception {
        for (String name : new String[] { "a.svg", "a.html", "a.exe", "a", "a.png.php" }) {
            assertThrows(BadRequestException.class,
                    () -> storage.uploadProfilePicture(upload(name, PNG)), name);
        }
        assertEquals(0, storedFileCount());
    }

    @Test
    void uploadProfilePicture_RejectsAFileThatOnlyClaimsToBeAnImage() throws Exception {
        byte[] script = "<script>alert(1)</script>".getBytes(StandardCharsets.UTF_8);

        assertThrows(BadRequestException.class, () -> storage.uploadProfilePicture(upload("a.png", script)));
        assertThrows(BadRequestException.class, () -> storage.uploadProfilePicture(upload("a.jpg", PNG)));

        assertEquals(0, storedFileCount());
        verify(profileService, never()).saveProfile(any(Profile.class));
    }

    @Test
    void uploadProfilePicture_RejectsEmptyAndOversizedFiles() throws Exception {
        assertThrows(BadRequestException.class, () -> storage.uploadProfilePicture(upload("a.png", new byte[0])));

        byte[] big = new byte[(int) FileStorageService.MAX_PICTURE_BYTES + 1];
        System.arraycopy(PNG, 0, big, 0, PNG.length);
        assertThrows(BadRequestException.class, () -> storage.uploadProfilePicture(upload("a.png", big)));
    }

    @Test
    void uploadProfilePicture_KeepsTheOldPictureIfSavingTheNewOneFails() throws Exception {
        storage.uploadProfilePicture(upload("old.png", PNG));
        String oldPicture = profile.getProfilePictureUrl();
        when(profileService.saveProfile(any(Profile.class))).thenThrow(new IllegalStateException("db down"));

        assertThrows(IllegalStateException.class, () -> storage.uploadProfilePicture(upload("new.png", PNG)));

        Resource old = storage.loadFileAsResource(oldPicture);
        assertTrue(old.exists(), "the previous picture must not have been deleted");
    }

    @Test
    void pictureContentType_FollowsTheExtension() {
        assertEquals("image/png", FileStorageService.pictureContentType("profile-pictures/x_a.png"));
        assertEquals("image/jpeg", FileStorageService.pictureContentType("profile-pictures/x_a.JPEG"));
        assertEquals("image/webp", FileStorageService.pictureContentType("x.webp"));
        assertEquals("application/octet-stream", FileStorageService.pictureContentType("x.html"));
    }
}
