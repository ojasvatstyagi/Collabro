package com.example.backend.services;

import com.example.backend.dto.ChatMessageDto;
import com.example.backend.exceptions.ResourceNotFoundException;
import com.example.backend.models.ChatMessage;
import com.example.backend.models.Profile;
import com.example.backend.models.Project;
import com.example.backend.repositories.ChatMessageRepository;
import com.example.backend.repositories.ProjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Objects;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ChatService {

    private final ChatMessageRepository chatMessageRepository;
    private final ProjectRepository projectRepository;
    private final ProfileService profileService;

    @Transactional
    public ChatMessageDto sendMessage(UUID projectId, String content) {
        Project project = projectRepository.findById(Objects.requireNonNull(projectId))
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));
        
        Profile sender = profileService.getCurrentUserProfile();
        
        ChatMessage message = new ChatMessage();
        message.setContent(content);
        message.setProject(project);
        message.setSender(sender);
        
        ChatMessage savedMessage = chatMessageRepository.save(message);
        return convertToDto(savedMessage);
    }
    
    @Transactional(readOnly = true)
    public Page<ChatMessageDto> getProjectMessages(UUID projectId, Pageable pageable) {
        if (!projectRepository.existsById(Objects.requireNonNull(projectId))) {
             throw new ResourceNotFoundException("Project not found");
        }
        return chatMessageRepository.findByProjectIdOrderByCreatedAtDesc(projectId, pageable)
                .map(this::convertToDto);
    }

    private ChatMessageDto convertToDto(ChatMessage message) {
        return ChatMessageDto.builder()
                .id(message.getId())
                .content(message.getContent())
                .createdAt(message.getCreatedAt())
                .senderId(message.getSender().getId())
                .senderName(message.getSender().getUser().getUsername()) // or firstname + lastname
                .senderAvatar(message.getSender().getProfilePictureUrl())
                .projectId(message.getProject().getId())
                .build();
    }
}
