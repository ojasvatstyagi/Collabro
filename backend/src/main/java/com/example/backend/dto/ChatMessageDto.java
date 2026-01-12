package com.example.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ChatMessageDto {
    private UUID id;
    private String content;
    private LocalDateTime createdAt;
    
    private UUID senderId;
    private String senderName;
    private String senderAvatar;
    
    private UUID projectId;
}
