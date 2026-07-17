package com.example.backend.services;

import com.example.backend.exceptions.ForbiddenException;
import com.example.backend.models.Profile;
import com.example.backend.models.Project;
import com.example.backend.models.ProjectFile;
import com.example.backend.repositories.ProjectFileRepository;
import com.example.backend.repositories.ProjectRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static com.example.backend.services.ProjectTestData.profile;
import static com.example.backend.services.ProjectTestData.project;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProjectFileServiceTest {

    @Mock
    private ProjectFileRepository projectFileRepository;
    @Mock
    private ProjectRepository projectRepository;
    @Mock
    private FileStorageService fileStorageService;
    @Mock
    private ProfileService profileService;

    private ProjectFileService projectFileService;
    private Profile owner;
    private Profile uploader;
    private Profile otherMember;
    private Profile outsider;
    private Project project;
    private ProjectFile file;

    @BeforeEach
    void setUp() {
        projectFileService = new ProjectFileService(projectFileRepository, projectRepository, fileStorageService,
                profileService, new ProjectAccessService(profileService));
        owner = profile("owner");
        uploader = profile("uploader");
        otherMember = profile("other");
        outsider = profile("outsider");
        project = project(owner, uploader, otherMember);

        file = new ProjectFile();
        file.setId(UUID.randomUUID());
        file.setFileName("spec.pdf");
        file.setFileUrl("project-files/" + project.getId() + "/spec.pdf");
        file.setProject(project);
        file.setUploadedBy(uploader);
    }

    private static final org.springframework.data.domain.Pageable PAGE = org.springframework.data.domain.PageRequest.of(0, 20);

    // ---- upload / list ----

    @Test
    void uploadFile_AsOutsider_ThrowsForbiddenAndStoresNothing() {
        MockMultipartFile upload = new MockMultipartFile("file", "x.txt", "text/plain", "data".getBytes());
        when(projectRepository.findById(project.getId())).thenReturn(Optional.of(project));
        when(profileService.getCurrentUserProfile()).thenReturn(outsider);

        assertThrows(ForbiddenException.class, () -> projectFileService.uploadFile(project.getId(), upload));

        verify(fileStorageService, never()).storeFile(any(), anyString());
        verify(projectFileRepository, never()).save(any(ProjectFile.class));
    }

    @Test
    void getProjectFiles_AsOutsider_ThrowsForbidden() {
        when(projectRepository.findById(project.getId())).thenReturn(Optional.of(project));
        when(profileService.getCurrentUserProfile()).thenReturn(outsider);

        assertThrows(ForbiddenException.class, () -> projectFileService.getProjectFiles(project.getId(), PAGE));
    }

    @Test
    void getProjectFiles_AsTeamMember_ReturnsFiles() {
        when(projectRepository.findById(project.getId())).thenReturn(Optional.of(project));
        when(profileService.getCurrentUserProfile()).thenReturn(otherMember);
        when(projectFileRepository.findByProjectId(project.getId(), PAGE)).thenReturn(new org.springframework.data.domain.PageImpl<>(List.of(file), PAGE, 1));

        assertEquals(1, projectFileService.getProjectFiles(project.getId(), PAGE).getContent().size());
    }

    // ---- download ----

    @Test
    void getFileEntity_AsOutsider_ThrowsForbidden() {
        when(projectFileRepository.findById(file.getId())).thenReturn(Optional.of(file));
        when(profileService.getCurrentUserProfile()).thenReturn(outsider);

        assertThrows(ForbiddenException.class, () -> projectFileService.getFileEntity(file.getId()));
    }

    @Test
    void loadFileAsResource_AsOutsider_ThrowsForbiddenAndReadsNothing() {
        when(projectFileRepository.findById(file.getId())).thenReturn(Optional.of(file));
        when(profileService.getCurrentUserProfile()).thenReturn(outsider);

        assertThrows(ForbiddenException.class, () -> projectFileService.loadFileAsResource(file.getId()));

        verify(fileStorageService, never()).loadFileAsResource(anyString());
    }

    // ---- delete ----

    @Test
    void deleteFile_AsUploader_Deletes() {
        when(projectFileRepository.findById(file.getId())).thenReturn(Optional.of(file));
        when(profileService.getCurrentUserProfile()).thenReturn(uploader);

        projectFileService.deleteFile(file.getId());

        verify(projectFileRepository).delete(file);
        verify(fileStorageService).deleteFile(file.getFileUrl());
    }

    @Test
    void deleteFile_AsProjectOwner_DeletesOthersFiles() {
        when(projectFileRepository.findById(file.getId())).thenReturn(Optional.of(file));
        when(profileService.getCurrentUserProfile()).thenReturn(owner);

        projectFileService.deleteFile(file.getId());

        verify(projectFileRepository).delete(file);
    }

    @Test
    void deleteFile_AsOtherMember_ThrowsForbidden() {
        when(projectFileRepository.findById(file.getId())).thenReturn(Optional.of(file));
        when(profileService.getCurrentUserProfile()).thenReturn(otherMember);

        assertThrows(ForbiddenException.class, () -> projectFileService.deleteFile(file.getId()));

        verify(projectFileRepository, never()).delete(any(ProjectFile.class));
        verify(fileStorageService, never()).deleteFile(anyString());
    }

    @Test
    void deleteFile_AsOutsider_ThrowsForbidden() {
        when(projectFileRepository.findById(file.getId())).thenReturn(Optional.of(file));
        when(profileService.getCurrentUserProfile()).thenReturn(outsider);

        assertThrows(ForbiddenException.class, () -> projectFileService.deleteFile(file.getId()));

        verify(projectFileRepository, never()).delete(any(ProjectFile.class));
    }

    @Test
    void uploadFile_StoresAndReturnsTheSanitisedNameNotTheClientsRawOne() {
        MockMultipartFile upload = new MockMultipartFile("file", "../../etc/evil<script>.txt", "text/plain", "data".getBytes());
        when(projectRepository.findById(project.getId())).thenReturn(Optional.of(project));
        when(profileService.getCurrentUserProfile()).thenReturn(uploader);
        when(fileStorageService.storeFile(any(), anyString())).thenReturn("project-files/x/stored.txt");
        when(projectFileRepository.save(any(ProjectFile.class))).thenAnswer(inv -> {
            ProjectFile saved = inv.getArgument(0);
            saved.setId(UUID.randomUUID());
            return saved;
        });

        var dto = projectFileService.uploadFile(project.getId(), upload);

        assertEquals("evil_script_.txt", dto.getFileName());
    }

    @Test
    void uploadFile_RejectsAnEmptyFile() {
        MockMultipartFile empty = new MockMultipartFile("file", "a.txt", "text/plain", new byte[0]);
        when(projectRepository.findById(project.getId())).thenReturn(Optional.of(project));
        when(profileService.getCurrentUserProfile()).thenReturn(uploader);

        assertThrows(com.example.backend.exceptions.BadRequestException.class,
                () -> projectFileService.uploadFile(project.getId(), empty));
        verify(fileStorageService, never()).storeFile(any(), anyString());
    }
}
