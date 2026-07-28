package com.example.backend.services;

import com.example.backend.dto.HistoryItemDto;
import com.example.backend.dto.HistoryStatsDto;
import com.example.backend.enums.ProjectStatus;
import com.example.backend.enums.RequestStatus;
import com.example.backend.services.HistoryQueries.Row;
import com.example.backend.services.HistoryQueries.Source;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

/**
 * A user's activity timeline. Nothing is recorded separately: it is assembled on request from the projects,
 * join requests, tasks and files that already exist, so it always agrees with the rest of the app.
 * <p>
 * The database does the work ({@link HistoryQueries}): filtering, ordering and counting happen there, and a page is
 * built from only the newest {@code offset + size} rows of each kind of event, so a busy account costs the same as a
 * quiet one for the first pages and the whole timeline is never loaded.
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
    private final HistoryQueries queries;

    /**
     * @param type      optional: project, collaboration, request, task or file
     * @param timeframe optional: week, month, quarter or year (anything else means all time)
     * @param search    optional text matched (literally, ignoring case) against the name, description, project name and
     *                  the other person involved
     */
    public Page<HistoryItemDto> getHistory(String type, String timeframe, String search, Pageable pageable) {
        UUID me = profileService.getCurrentUserProfile().getId();
        List<Source> sources = sourcesOf(type);
        LocalDateTime after = cutoff(timeframe);
        String needle = search == null || search.isBlank() ? null : search.trim();

        long total = sources.stream().mapToLong(source -> queries.count(source, me, after, needle)).sum();
        long offset = pageable.getOffset();
        if (offset >= total) {
            return new PageImpl<>(List.of(), pageable, total);
        }

        // The newest offset+size of the whole timeline are among the newest offset+size of each kind
        int wanted = (int) Math.min(offset + pageable.getPageSize(), total);
        List<Row> merged = sources.stream()
                .flatMap(source -> queries.newest(source, me, after, needle, wanted).stream())
                // stable: events with equal timestamps keep the database's order within a kind, kinds in enum order
                .sorted(Comparator.comparing(Row::timestamp).reversed().thenComparing(row -> row.source().ordinal()))
                .toList();

        int from = (int) offset;
        int to = Math.min(from + pageable.getPageSize(), merged.size());
        List<HistoryItemDto> content = merged.subList(from, to).stream().map(this::toItem).toList();
        return new PageImpl<>(content, pageable, total);
    }

    public HistoryStatsDto getStats() {
        UUID me = profileService.getCurrentUserProfile().getId();
        LocalDateTime now = LocalDateTime.now();
        long total = 0;
        long thisWeek = 0;
        long thisMonth = 0;
        long projects = 0;
        long joined = 0;
        long tasks = 0;
        for (Source source : Source.values()) {
            HistoryQueries.Counts counts = queries.counts(source, me, now.minusDays(7), now.minusDays(30));
            total += counts.total();
            thisWeek += counts.sinceWeek();
            thisMonth += counts.sinceMonth();
            projects += source == Source.PROJECT ? counts.total() : 0;
            joined += source == Source.JOINED ? counts.total() : 0;
            tasks += source == Source.TASK ? counts.total() : 0;
        }
        return HistoryStatsDto.builder()
                .totalActivities((int) total)
                .projectsCreated((int) projects)
                .collaborationsJoined((int) joined)
                .tasksCompleted((int) tasks)
                .thisWeek((int) thisWeek)
                .thisMonth((int) thisMonth)
                .build();
    }

    private List<Source> sourcesOf(String type) {
        if (type == null || type.isBlank()) {
            return Arrays.asList(Source.values());
        }
        return Arrays.stream(Source.values()).filter(source -> source.type().equalsIgnoreCase(type)).toList();
    }

    private HistoryItemDto toItem(Row row) {
        String name = row.text();
        String related = row.related() == null || row.related().isEmpty() ? null : row.related();
        String description = row.description() == null || row.description().isEmpty() ? null : row.description();
        return switch (row.source()) {
            case PROJECT -> item("project:" + row.id(), PROJECT, "Created \"" + name + "\"", description, row,
                    projectStatus((ProjectStatus) row.status()), null);
            case SENT -> item("request:sent:" + row.id(), REQUEST, "Asked to join \"" + name + "\"", description, row,
                    requestStatus((RequestStatus) row.status()), related);
            case JOINED -> item("collaboration:joined:" + row.id(), COLLABORATION, "Joined \"" + name + "\"",
                    "Your request was approved by " + related, row, "ongoing", related);
            case RECEIVED -> item("request:received:" + row.id(), REQUEST,
                    related + " asked to join \"" + name + "\"", description, row,
                    requestStatus((RequestStatus) row.status()), related);
            case ACCEPTED -> item("collaboration:accepted:" + row.id(), COLLABORATION,
                    related + " joined \"" + name + "\"", "You approved the request", row, "ongoing", related);
            case TASK -> item("task:" + row.id(), TASK, "Completed \"" + name + "\"", description, row, "completed", null);
            case FILE -> item("file:" + row.id(), FILE, "Uploaded \"" + name + "\"", null, row, null, null);
        };
    }

    private HistoryItemDto item(String id, String type, String title, String description, Row row, String status,
            String relatedUsername) {
        return HistoryItemDto.builder()
                .id(id)
                .type(type)
                .title(title)
                .description(description)
                .timestamp(row.timestamp())
                .status(status)
                .projectId(row.projectId())
                .projectName(row.projectTitle())
                .relatedUsername(relatedUsername)
                .build();
    }

    private LocalDateTime cutoff(String timeframe) {
        if (timeframe == null) {
            return null;
        }
        int days = switch (timeframe.toLowerCase(Locale.ROOT)) {
            case "week" -> 7;
            case "month" -> 30;
            case "quarter" -> 90;
            case "year" -> 365;
            default -> 0;
        };
        return days == 0 ? null : LocalDateTime.now().minusDays(days);
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
