package com.example.backend.dto;

import com.example.backend.enums.RequestStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CollaborationRequestDTO {
    private Long id;
    private UUID projectId;
    private String projectTitle;
    private RequesterDTO requester;
    private String message;
    private RequestStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String rejectionReason;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RequesterDTO {
        private UUID id;
        private String username;
        private String firstname;
        private String lastname;
        private String profilePictureUrl;
        private List<String> skills;
    }
}
