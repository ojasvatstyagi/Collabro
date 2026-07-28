package com.example.backend.services;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Query;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

/**
 * The database side of the activity history. Each kind of event is its own query that filters (timeframe, search),
 * orders newest first, counts and limits in the database, and returns plain values rather than entities, so reading a
 * page of history costs about the same whether the account has ten events or ten thousand.
 */
@Component
@Transactional(readOnly = true)
public class HistoryQueries {

    /** The kinds of event, in the order used to break ties between events with the same timestamp. */
    public enum Source {
        PROJECT("project", "p.id", "p.createdAt", "p.title", "p.description", "p.status", "p.id", "p.title", "''",
                "FROM Project p WHERE p.createdBy.id = :me"),
        SENT("request", "r.id", "r.createdAt", "p.title", "r.message", "r.status", "p.id", "p.title",
                "COALESCE(ou.username, 'deleted user')",
                "FROM CollaborationRequest r JOIN r.project p JOIN p.createdBy owner LEFT JOIN owner.user ou "
                        + "WHERE r.requester.id = :me"),
        JOINED("collaboration", "r.id", "r.updatedAt", "p.title", "''", "r.status", "p.id", "p.title",
                "COALESCE(ou.username, 'deleted user')",
                "FROM CollaborationRequest r JOIN r.project p JOIN p.createdBy owner LEFT JOIN owner.user ou "
                        + "WHERE r.requester.id = :me AND r.status = com.example.backend.enums.RequestStatus.APPROVED"),
        RECEIVED("request", "r.id", "r.createdAt", "p.title", "r.message", "r.status", "p.id", "p.title",
                "COALESCE(ru.username, 'deleted user')",
                "FROM CollaborationRequest r JOIN r.project p JOIN r.requester rq LEFT JOIN rq.user ru "
                        + "WHERE p.createdBy.id = :me"),
        ACCEPTED("collaboration", "r.id", "r.updatedAt", "p.title", "''", "r.status", "p.id", "p.title",
                "COALESCE(ru.username, 'deleted user')",
                "FROM CollaborationRequest r JOIN r.project p JOIN r.requester rq LEFT JOIN rq.user ru "
                        + "WHERE p.createdBy.id = :me AND r.status = com.example.backend.enums.RequestStatus.APPROVED"),
        TASK("task", "t.id", "COALESCE(t.updatedAt, t.createdAt)", "t.title", "t.description", "t.status", "p.id", "p.title",
                "''",
                "FROM Task t JOIN t.project p WHERE t.assignedTo.id = :me "
                        + "AND t.status = com.example.backend.enums.TaskStatus.COMPLETED"),
        FILE("file", "f.id", "f.createdAt", "f.fileName", "''", "f.id", "p.id", "p.title", "''",
                "FROM ProjectFile f JOIN f.project p WHERE f.uploadedBy.id = :me");

        private final String type;
        private final String id;
        private final String timestamp;
        private final String text;
        private final String description;
        private final String status;
        private final String projectId;
        private final String projectTitle;
        private final String related;
        private final String from;

        Source(String type, String id, String timestamp, String text, String description, String status,
                String projectId, String projectTitle, String related, String from) {
            this.type = type;
            this.id = id;
            this.timestamp = timestamp;
            this.text = text;
            this.description = description;
            this.status = status;
            this.projectId = projectId;
            this.projectTitle = projectTitle;
            this.related = related;
            this.from = from;
        }

        public String type() {
            return type;
        }
    }

    /** One event as the database holds it; {@link HistoryService} turns it into a DTO. */
    public record Row(Source source, Object id, LocalDateTime timestamp, String text, String description, Object status,
            UUID projectId, String projectTitle, String related) {
    }

    /** The two moments the stats count events after. */
    public record Counts(long total, long sinceWeek, long sinceMonth) {
    }

    private static final char ESCAPE = '!';

    @PersistenceContext
    private EntityManager entityManager;

    /** The newest {@code limit} events of this kind (after the cutoff, matching the search), newest first. */
    public List<Row> newest(Source source, UUID me, LocalDateTime after, String search, int limit) {
        String jpql = "SELECT " + String.join(", ", source.id, source.timestamp, source.text, source.description,
                source.status, source.projectId, source.projectTitle, source.related) + " " + source.from
                + filters(source, after, search)
                + " ORDER BY " + source.timestamp + " DESC, " + source.id + " DESC";
        Query query = entityManager.createQuery(jpql).setParameter("me", me).setMaxResults(limit);
        bind(query, after, search);

        List<Row> rows = new ArrayList<>();
        for (Object raw : query.getResultList()) {
            Object[] c = (Object[]) raw;
            rows.add(new Row(source, c[0], (LocalDateTime) c[1], (String) c[2], (String) c[3], c[4], (UUID) c[5],
                    (String) c[6], (String) c[7]));
        }
        return rows;
    }

    public long count(Source source, UUID me, LocalDateTime after, String search) {
        Query query = entityManager.createQuery("SELECT COUNT(*) " + source.from + filters(source, after, search))
                .setParameter("me", me);
        bind(query, after, search);
        return ((Number) query.getSingleResult()).longValue();
    }

    /** All events of this kind, and how many fall after each of the two moments, in one query. */
    public Counts counts(Source source, UUID me, LocalDateTime weekCutoff, LocalDateTime monthCutoff) {
        Query query = entityManager.createQuery("SELECT COUNT(*), "
                + "SUM(CASE WHEN " + source.timestamp + " > :week THEN 1 ELSE 0 END), "
                + "SUM(CASE WHEN " + source.timestamp + " > :month THEN 1 ELSE 0 END) "
                + source.from + " AND " + source.timestamp + " IS NOT NULL")
                .setParameter("me", me).setParameter("week", weekCutoff).setParameter("month", monthCutoff);
        Object[] c = (Object[]) query.getSingleResult();
        return new Counts(number(c[0]), number(c[1]), number(c[2]));
    }

    private static long number(Object value) {
        return value == null ? 0 : ((Number) value).longValue();
    }

    // Events without a timestamp cannot be placed on the timeline, so they are left out
    private String filters(Source source, LocalDateTime after, String search) {
        StringBuilder where = new StringBuilder(" AND ").append(source.timestamp).append(" IS NOT NULL");
        if (after != null) {
            where.append(" AND ").append(source.timestamp).append(" > :after");
        }
        if (search != null) {
            where.append(" AND (");
            String[] fields = { source.text, "COALESCE(" + source.description + ", '')", source.projectTitle,
                    source.related };
            for (int i = 0; i < fields.length; i++) {
                where.append(i == 0 ? "" : " OR ").append("LOWER(").append(fields[i]).append(") LIKE :needle ESCAPE '")
                        .append(ESCAPE).append("'");
            }
            where.append(")");
        }
        return where.toString();
    }

    private void bind(Query query, LocalDateTime after, String search) {
        if (after != null) {
            query.setParameter("after", after);
        }
        if (search != null) {
            query.setParameter("needle", "%" + escapeLike(search.toLowerCase(Locale.ROOT)) + "%");
        }
    }

    /** The search text is matched literally: a user typing 100% or a_b must not get wildcards. */
    static String escapeLike(String text) {
        return text.replace("" + ESCAPE, ESCAPE + "" + ESCAPE).replace("%", ESCAPE + "%").replace("_", ESCAPE + "_");
    }
}
