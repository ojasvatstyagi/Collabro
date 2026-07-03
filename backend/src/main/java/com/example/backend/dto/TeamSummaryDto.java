package com.example.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/** One of the current user's teams: the member group of a project they own or have joined. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TeamSummaryDto {
    private Long id;
    private String name;
    private UUID projectId;
    private String projectTitle;
    private String projectStatus;
    /** "OWNER" or "MEMBER": the current user's role in this team. */
    private String role;
    private PublicProfileDto owner;
    private List<PublicProfileDto> members;
    /** Owner plus members. */
    private int memberCount;
    private LocalDateTime createdAt;
}
