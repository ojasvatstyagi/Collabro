package com.example.backend.dto;

import com.example.backend.enums.ProjectLevel;
import com.example.backend.enums.ProjectStatus;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
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
public class ProjectDto {
    private UUID id;

    @NotBlank(message = "Title is required")
    @Size(max = 255, message = "Title must be at most 255 characters")
    private String title;

    @Size(max = 255, message = "Description must be at most 255 characters")
    private String description;

    private List<String> technologies;
    private ProjectLevel level;

    @Size(max = 255, message = "Duration must be at most 255 characters")
    private String duration;

    @Min(value = 1, message = "Team size must be at least 1")
    @Max(value = 100, message = "Team size must be at most 100")
    private int teamSize;

    @Size(max = 255, message = "Category must be at most 255 characters")
    private String category;

    @Size(max = 255, message = "Budget must be at most 255 characters")
    private String budget;

    // The explicit names matter: Lombok/Jackson would otherwise call these "remote" and "openSource",
    // so the "isRemote" / "isOpenSource" the frontend sends were silently ignored.
    @JsonProperty("isRemote")
    private boolean remote;

    @JsonProperty("isOpenSource")
    private boolean openSource;

    @Size(max = 255, message = "Contact method must be at most 255 characters")
    private String contactMethod;

    private String additionalInfo;
    private ProjectStatus status;
    private LocalDateTime createdAt;
    private ProjectCreatorDto createdBy;

    /** Public view of the creator. Deliberately has no email: every signed-in user can read project listings. */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProjectCreatorDto {
        private UUID id;
        private String username;
        private String profilePictureUrl;
    }
}
