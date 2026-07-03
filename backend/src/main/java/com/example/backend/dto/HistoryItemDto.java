package com.example.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/** One entry of a user's activity timeline. History is computed from existing data, so ids are synthetic. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HistoryItemDto {
    /** Stable synthetic id such as "project:&lt;uuid&gt;". */
    private String id;
    /** project, collaboration, request, task or file. */
    private String type;
    private String title;
    private String description;
    private LocalDateTime timestamp;
    /** completed, pending, approved, rejected, ongoing or cancelled; null when it does not apply. */
    private String status;
    private UUID projectId;
    private String projectName;
    /** The other person involved (the requester or the project owner), if any. */
    private String relatedUsername;
}
