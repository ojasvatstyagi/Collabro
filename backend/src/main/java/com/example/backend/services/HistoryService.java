package com.example.backend.services;

import com.example.backend.dto.HistoryItemDto;
import com.example.backend.dto.HistoryStatsDto;
import com.example.backend.enums.ProjectStatus;
import com.example.backend.enums.RequestStatus;
import com.example.backend.enums.TaskStatus;
import com.example.backend.models.CollaborationRequest;
import com.example.backend.models.Profile;
import com.example.backend.models.Project;
import com.example.backend.models.Task;
import com.example.backend.repositories.ProjectFileRepository;
import com.example.backend.repositories.ProjectRepository;
import com.example.backend.repositories.RequestRepository;
import com.example.backend.repositories.TaskRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;

/**
 * A user's activity timeline. Nothing is recorded separately: it is assembled on request from the projects,
 * join requests, tasks and files that already exist, so it always agrees with the rest of the app.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class HistoryService {

    public static final String PROJECT = "project";
    public static final String COLLABORATION = "collaboration";
    public static final String REQUEST = "request";
    public static final String TASK = "task";
    public static final String FILE = "file";

    private final ProfileService profileService;
    private final ProjectRepository projectRepository;
    private final RequestRepository requestRepository;
    private final TaskRepository taskRepository;
    private final ProjectFileRepository projectFileRepository;

    /**
     * @param type      optional: project, collaboration, request, task or file
     * @param timeframe optional: week, month, quarter or year (anything else means all time)
     * @param search    optional text matched against the title, description and project name
     */
    public Page<HistoryItemDto> getHistory(String type, String timeframe, String search, Pageable pageable) {
        List<HistoryItemDto> matching = collectEvents(profileService.getCurrentUserProfile()).stream()
                .filter(item -> type == null || type.isBlank() || item.getType().equalsIgnoreCase(type))
                .filter(item -> isWithin(item, timeframe))
                .filter(item -> matchesSearch(item, search))
                .toList();

        int from = (int) Math.min(pageable.getOffset(), matching.size());
        int to = Math.min(from + pageable.getPageSize(), matching.size());
        return new PageImpl<>(matching.subList(from, to), pageable, matching.size());
    }

    public HistoryStatsDto getStats() {
        List<HistoryItemDto> events = collectEvents(profileService.getCurrentUserProfile());
        LocalDateTime now = LocalDateTime.now();
        return HistoryStatsDto.builder()
                .totalActivities(events.size())
                .projectsCreated(count(events, PROJECT))
                .collaborationsJoined((int) events.stream()
                        .filter(e -> e.getId().startsWith("collaboration:joined:")).count())
                .tasksCompleted(count(events, TASK))
                .thisWeek((int) events.stream().filter(e -> e.getTimestamp().isAfter(now.minusDays(7))).count())
                .thisMonth((int) events.stream().filter(e -> e.getTimestamp().isAfter(now.minusDays(30))).count())
                .build();
    }

    /** Every event involving the profile, newest first. */
    List<HistoryItemDto> collectEvents(Profile me) {
        List<HistoryItemDto> events = new ArrayList<>();

        for (Project project : projectRepository.findByCreatedBy_Id(me.getId())) {
            events.add(event("project:" + project.getId(), PROJECT, "Created \"" + project.getTitle() + "\"",
                    project.getDescription(), project.getCreatedAt(), projectStatus(project.getStatus()), project, null));
        }

        for (CollaborationRequest request : requestRepository.findByRequester(me)) {
            Project project = request.getProject();
            String owner = project.getCreatedBy().displayUsername();
            events.add(event("request:sent:" + request.getId(), REQUEST,
                    "Asked to join \"" + project.getTitle() + "\"", request.getMessage(), request.getCreatedAt(),
                    requestStatus(request.getStatus()), project, owner));
            if (request.getStatus() == RequestStatus.APPROVED) {
                events.add(event("collaboration:joined:" + request.getId(), COLLABORATION,
                        "Joined \"" + project.getTitle() + "\"", "Your request was approved by " + owner,
                        request.getUpdatedAt(), "ongoing", project, owner));
            }
        }

        for (CollaborationRequest request : requestRepository.findByProjectOwner(me)) {
            Project project = request.getProject();
            String requester = request.getRequester().displayUsername();
            events.add(event("request:received:" + request.getId(), REQUEST,
                    requester + " asked to join \"" + project.getTitle() + "\"", request.getMessage(),
                    request.getCreatedAt(), requestStatus(request.getStatus()), project, requester));
            if (request.getStatus() == RequestStatus.APPROVED) {
                events.add(event("collaboration:accepted:" + request.getId(), COLLABORATION,
                        requester + " joined \"" + project.getTitle() + "\"", "You approved the request",
                        request.getUpdatedAt(), "ongoing", project, requester));
            }
        }

        for (Task task : taskRepository.findByAssignedToIdAndStatus(me.getId(), TaskStatus.COMPLETED)) {
            LocalDateTime when = task.getUpdatedAt() != null ? task.getUpdatedAt() : task.getCreatedAt();
            events.add(event("task:" + task.getId(), TASK, "Completed \"" + task.getTitle() + "\"",
                    task.getDescription(), when, "completed", task.getProject(), null));
        }

        projectFileRepository.findByUploadedById(me.getId()).forEach(file -> events.add(event(
                "file:" + file.getId(), FILE, "Uploaded \"" + file.getFileName() + "\"", null, file.getCreatedAt(),
                null, file.getProject(), null)));

        return events.stream()
                .filter(item -> item.getTimestamp() != null)
                .sorted(Comparator.comparing(HistoryItemDto::getTimestamp).reversed())
                .toList();
    }

    private HistoryItemDto event(String id, String type, String title, String description, LocalDateTime timestamp,
            String status, Project project, String relatedUsername) {
        return HistoryItemDto.builder()
                .id(id)
                .type(type)
                .title(title)
                .description(description)
                .timestamp(timestamp)
                .status(status)
                .projectId(project.getId())
                .projectName(project.getTitle())
                .relatedUsername(relatedUsername)
                .build();
    }

    private boolean isWithin(HistoryItemDto item, String timeframe) {
        if (timeframe == null) {
            return true;
        }
        int days = switch (timeframe.toLowerCase(Locale.ROOT)) {
            case "week" -> 7;
            case "month" -> 30;
            case "quarter" -> 90;
            case "year" -> 365;
            default -> 0;
        };
        return days == 0 || item.getTimestamp().isAfter(LocalDateTime.now().minusDays(days));
    }

    private boolean matchesSearch(HistoryItemDto item, String search) {
        if (search == null || search.isBlank()) {
            return true;
        }
        String needle = search.trim().toLowerCase(Locale.ROOT);
        return contains(item.getTitle(), needle) || contains(item.getDescription(), needle)
                || contains(item.getProjectName(), needle);
    }

    private boolean contains(String text, String needle) {
        return text != null && text.toLowerCase(Locale.ROOT).contains(needle);
    }

    private int count(List<HistoryItemDto> events, String type) {
        return (int) events.stream().filter(e -> e.getType().equals(type)).count();
    }

    private String projectStatus(ProjectStatus status) {
        if (status == null) {
            return null;
        }
        return switch (status) {
            case ACTIVE -> "ongoing";
            case COMPLETED -> "completed";
            case CANCELLED -> "cancelled";
        };
    }

    private String requestStatus(RequestStatus status) {
        return status == null ? null : status.name().toLowerCase(Locale.ROOT);
    }
}
