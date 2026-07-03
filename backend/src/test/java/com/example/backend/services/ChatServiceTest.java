package com.example.backend.services;

import com.example.backend.dto.ChatMessageDto;
import com.example.backend.exceptions.ForbiddenException;
import com.example.backend.models.ChatMessage;
import com.example.backend.models.Profile;
import com.example.backend.models.Project;
import com.example.backend.repositories.ChatMessageRepository;
import com.example.backend.repositories.ProjectRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.util.Optional;

import static com.example.backend.services.ProjectTestData.profile;
import static com.example.backend.services.ProjectTestData.project;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ChatServiceTest {

    @Mock
    private ChatMessageRepository chatMessageRepository;
    @Mock
    private ProjectRepository projectRepository;
    @Mock
    private ProfileService profileService;

    private ChatService chatService;
    private Profile owner;
    private Profile member;
    private Profile outsider;
    private Project project;

    @BeforeEach
    void setUp() {
        chatService = new ChatService(chatMessageRepository, projectRepository,
                new ProjectAccessService(profileService));
        owner = profile("owner");
        member = profile("member");
        outsider = profile("outsider");
        project = project(owner, member);
    }

    @Test
    void sendMessage_AsTeamMember_SavesMessageFromThatMember() {
        when(projectRepository.findById(project.getId())).thenReturn(Optional.of(project));
        when(profileService.getCurrentUserProfile()).thenReturn(member);
        when(chatMessageRepository.save(any(ChatMessage.class))).thenAnswer(inv -> inv.getArgument(0));

        ChatMessageDto result = chatService.sendMessage(project.getId(), "hello team");

        assertEquals("hello team", result.getContent());
        assertEquals(member.getId(), result.getSenderId());
    }

    @Test
    void sendMessage_AsOutsider_ThrowsForbiddenAndSavesNothing() {
        when(projectRepository.findById(project.getId())).thenReturn(Optional.of(project));
        when(profileService.getCurrentUserProfile()).thenReturn(outsider);

        assertThrows(ForbiddenException.class, () -> chatService.sendMessage(project.getId(), "let me in"));

        verify(chatMessageRepository, never()).save(any(ChatMessage.class));
    }

    @Test
    void getProjectMessages_AsOutsider_ThrowsForbiddenAndReadsNothing() {
        Pageable page = PageRequest.of(0, 50);
        when(projectRepository.findById(project.getId())).thenReturn(Optional.of(project));
        when(profileService.getCurrentUserProfile()).thenReturn(outsider);

        assertThrows(ForbiddenException.class, () -> chatService.getProjectMessages(project.getId(), page));

        verify(chatMessageRepository, never()).findByProjectIdOrderByCreatedAtDesc(any(), any());
    }

    @Test
    void sendMessage_ReturnsALoadableAvatarUrlNotTheStoredPath() {
        member.setProfilePictureUrl("profile-pictures/abc_me.png");
        when(projectRepository.findById(project.getId())).thenReturn(Optional.of(project));
        when(profileService.getCurrentUserProfile()).thenReturn(member);
        when(chatMessageRepository.save(any(ChatMessage.class))).thenAnswer(inv -> inv.getArgument(0));

        ChatMessageDto result = chatService.sendMessage(project.getId(), "hi");

        assertEquals("/api/profile/picture/abc_me.png", result.getSenderAvatar());
    }
}
