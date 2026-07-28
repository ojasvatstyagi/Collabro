package com.example.backend.services;

import com.example.backend.dto.HistoryItemDto;
import com.example.backend.dto.HistoryStatsDto;
import com.example.backend.enums.ProjectStatus;
import com.example.backend.enums.RequestStatus;
import com.example.backend.enums.TaskStatus;
import com.example.backend.models.CollaborationRequest;
import com.example.backend.models.Profile;
import com.example.backend.models.Project;
import com.example.backend.models.ProjectFile;
import com.example.backend.models.Task;
import com.example.backend.models.User;
import jakarta.persistence.EntityManagerFactory;
import org.hibernate.SessionFactory;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

/** The history against a real database: filters, ordering, counts and paging all happen in SQL. */
@DataJpaTest(properties = "spring.jpa.properties.hibernate.generate_statistics=true")
@Import({ HistoryService.class, HistoryQueries.class })
class HistoryServiceTest {

    @Autowired
    private TestEntityManager em;
    @Autowired
    private EntityManagerFactory entityManagerFactory;
    @Autowired
    private HistoryService historyService;
    @MockitoBean
    private ProfileService profileService;

    private final LocalDateTime now = LocalDateTime.now();
    private int counter;

    private Profile me;
    private Profile bob;
    private Profile carol;
    private Project mine;
    private Project carols;
    private CollaborationRequest received;
    private CollaborationRequest sent;

    @BeforeEach
    void setUp() {
        me = person("me");
        bob = person("bob");
        carol = person("carol");
        when(profileService.getCurrentUserProfile()).thenReturn(me);

        // A month of activity: project (10d), bob's request received (5d) and approved (4d),
        // my rejected request to carol (40d), a completed task (2d), an uploaded file (1d)
        mine = projectOf(me, "Collabro", ProjectStatus.ACTIVE, 10);
        carols = projectOf(carol, "Carol's Idea", ProjectStatus.ACTIVE, 0);
        received = requestTo(mine, bob, RequestStatus.APPROVED, "let me in", 5, 4);
        sent = requestTo(carols, me, RequestStatus.REJECTED, "pretty please", 40, 39);
        completedTask(mine, me, "Write docs", 2);
        file(mine, me, "spec.pdf", 1);
        settle();
    }

    // ---------------------------------------------------------------- data helpers

    private Profile person(String name) {
        User user = new User();
        user.setUsername(name);
        user.setEmail(name + "@example.com");
        user.setPassword("x");
        em.persist(user);
        return em.persist(Profile.builder().user(user).firstname(name).lastname("T").build());
    }

    private Project projectOf(Profile owner, String title, ProjectStatus status, int daysAgo) {
        Project project = new Project();
        project.setTitle(title);
        project.setDescription("About " + title);
        project.setCreatedBy(owner);
        project.setStatus(status);
        em.persistAndFlush(project);
        setTimes("projects", project.getId(), now.minusDays(daysAgo), null);
        return project;
    }

    private CollaborationRequest requestTo(Project project, Profile requester, RequestStatus status, String message,
            int createdDaysAgo, Integer updatedDaysAgo) {
        CollaborationRequest request = new CollaborationRequest();
        request.setProject(project);
        request.setRequester(requester);
        request.setStatus(status);
        request.setMessage(message);
        em.persistAndFlush(request);
        setTimes("requests", request.getId(), now.minusDays(createdDaysAgo),
                updatedDaysAgo == null ? null : now.minusDays(updatedDaysAgo));
        return request;
    }

    private Task completedTask(Project project, Profile assignee, String title, int daysAgo) {
        Task task = new Task();
        task.setTitle(title);
        task.setDescription("do " + title);
        task.setDeadline(now.plusDays(30));
        task.setStatus(TaskStatus.COMPLETED);
        task.setProject(project);
        task.setAssignedTo(assignee);
        em.persistAndFlush(task);
        em.getEntityManager().createNativeQuery("update tasks set updated_at = :t where id = :id")
                .setParameter("t", now.minusDays(daysAgo)).setParameter("id", task.getId()).executeUpdate();
        return task;
    }

    private ProjectFile file(Project project, Profile uploader, String name, int daysAgo) {
        ProjectFile file = new ProjectFile();
        file.setFileName(name);
        file.setFileUrl("u/" + name);
        file.setProject(project);
        file.setUploadedBy(uploader);
        em.persistAndFlush(file);
        setTimes("project_files", file.getId(), now.minusDays(daysAgo), null);
        return file;
    }

    /** The timestamps are stamped by Hibernate on insert; this puts them where the scenario needs them. */
    private void setTimes(String table, Object id, LocalDateTime created, LocalDateTime updated) {
        String sql = "update " + table + " set created_at = :c" + (table.equals("requests") ? ", updated_at = :u" : "")
                + " where id = :id";
        var query = em.getEntityManager().createNativeQuery(sql).setParameter("c", created).setParameter("id", id);
        if (table.equals("requests")) {
            query.setParameter("u", updated);
        }
        query.executeUpdate();
    }

    private void settle() {
        em.flush();
        em.clear();
    }

    private Page<HistoryItemDto> history(String type, String timeframe, String search) {
        return historyService.getHistory(type, timeframe, search, PageRequest.of(0, 50));
    }

    private List<String> ids(Page<HistoryItemDto> page) {
        return page.getContent().stream().map(HistoryItemDto::getId).toList();
    }

    // ---------------------------------------------------------------- behaviour

    @Test
    void getHistory_ListsEveryKindOfActivityNewestFirst() {
        Page<HistoryItemDto> page = history(null, null, null);

        assertEquals(6, page.getTotalElements());
        assertEquals(List.of("file", "task", "collaboration", "request", "project", "request"),
                page.getContent().stream().map(HistoryItemDto::getType).toList());
        assertTrue(page.getContent().get(0).getTimestamp().isAfter(page.getContent().get(5).getTimestamp()));
    }

    @Test
    void getHistory_DescribesEachEvent() {
        List<HistoryItemDto> items = history(null, null, null).getContent();

        HistoryItemDto accepted = items.stream().filter(i -> i.getId().startsWith("collaboration:accepted")).findFirst()
                .orElseThrow();
        assertEquals("bob joined \"Collabro\"", accepted.getTitle());
        assertEquals("You approved the request", accepted.getDescription());
        assertEquals("bob", accepted.getRelatedUsername());
        assertEquals(mine.getId(), accepted.getProjectId());
        assertEquals("Collabro", accepted.getProjectName());
        assertEquals("ongoing", accepted.getStatus());

        HistoryItemDto sentItem = items.stream().filter(i -> i.getId().startsWith("request:sent")).findFirst().orElseThrow();
        assertEquals("request:sent:" + sent.getId(), sentItem.getId());
        assertEquals("Asked to join \"Carol's Idea\"", sentItem.getTitle());
        assertEquals("pretty please", sentItem.getDescription());
        assertEquals("rejected", sentItem.getStatus());
        assertEquals("carol", sentItem.getRelatedUsername());

        HistoryItemDto receivedItem = items.stream().filter(i -> i.getId().startsWith("request:received")).findFirst().orElseThrow();
        assertEquals("bob asked to join \"Collabro\"", receivedItem.getTitle());
        assertEquals("let me in", receivedItem.getDescription());
        assertEquals("approved", receivedItem.getStatus());

        HistoryItemDto created = items.stream().filter(i -> i.getType().equals("project")).findFirst().orElseThrow();
        assertEquals("Created \"Collabro\"", created.getTitle());
        assertEquals("About Collabro", created.getDescription());
        assertEquals("ongoing", created.getStatus());
        assertNull(created.getRelatedUsername());

        HistoryItemDto task = items.stream().filter(i -> i.getType().equals("task")).findFirst().orElseThrow();
        assertEquals("Completed \"Write docs\"", task.getTitle());
        assertEquals("completed", task.getStatus());

        HistoryItemDto file = items.stream().filter(i -> i.getType().equals("file")).findFirst().orElseThrow();
        assertEquals("Uploaded \"spec.pdf\"", file.getTitle());
        assertNull(file.getDescription());
        assertNull(file.getStatus());
    }

    @Test
    void getHistory_FiltersByType() {
        assertEquals(2, history("request", null, null).getTotalElements());
        assertEquals(1, history("TASK", null, null).getTotalElements());
        assertEquals(1, history("collaboration", null, null).getTotalElements()); // only bob joining: I joined nothing
        assertEquals(0, history("nonsense", null, null).getTotalElements());
    }

    @Test
    void getHistory_FiltersByTimeframe() {
        assertEquals(4, history(null, "week", null).getTotalElements());
        assertEquals(5, history(null, "month", null).getTotalElements());
        assertEquals(6, history(null, "quarter", null).getTotalElements());
        assertEquals(6, history(null, "all", null).getTotalElements());
        assertEquals(6, history(null, "whenever", null).getTotalElements());
    }

    @Test
    void getHistory_SearchesNamesDescriptionsProjectNamesAndThePersonInvolved() {
        assertEquals(List.of("request:sent:" + sent.getId()), ids(history(null, null, "carol")));
        assertEquals(1, history(null, null, "write docs").getTotalElements());
        assertEquals(1, history(null, null, "do write").getTotalElements());      // the task's description
        assertEquals(1, history(null, null, "pretty please").getTotalElements());  // the request message
        assertEquals(5, history(null, null, "COLLABRO").getTotalElements());
        assertEquals(2, history(null, null, "bob").getTotalElements());            // received + accepted
        assertEquals(1, history(null, null, "spec.PDF").getTotalElements());
    }

    @Test
    void getHistory_SearchesWhatWasWritten_NotTheWordsTheTimelineAddsAroundIt() {
        // "Created", "Uploaded", "Asked to join" are labels the timeline adds, not text anyone wrote
        assertEquals(0, history(null, null, "uploaded").getTotalElements());
        assertEquals(0, history(null, null, "created").getTotalElements());
    }

    @Test
    void getHistory_TreatsWildcardCharactersInTheSearchLiterally() {
        assertEquals(0, history(null, null, "%").getTotalElements());
        assertEquals(0, history(null, null, "_").getTotalElements());
        assertEquals(0, history(null, null, "c_llabro").getTotalElements());
        assertEquals(0, history(null, null, "!").getTotalElements());
        file(mine, me, "100%_done!.txt", 0);
        settle();
        assertEquals(1, history(null, null, "100%_done!").getTotalElements());
    }

    @Test
    void getHistory_CombinesFilters() {
        assertEquals(List.of("task:" + history("task", null, null).getContent().get(0).getId().substring(5)),
                ids(history("task", "week", "docs")));
        assertEquals(0, history("task", "week", "spec").getTotalElements());
        assertEquals(1, history("request", "quarter", "carol").getTotalElements());
        assertEquals(0, history("request", "month", "carol").getTotalElements()); // that request is 40 days old
    }

    @Test
    void getHistory_Paginates() {
        Page<HistoryItemDto> second = historyService.getHistory(null, null, null, PageRequest.of(1, 4));

        assertEquals(6, second.getTotalElements());
        assertEquals(2, second.getContent().size());
        assertEquals(2, second.getTotalPages());
        assertTrue(historyService.getHistory(null, null, null, PageRequest.of(5, 4)).getContent().isEmpty());
        assertEquals(List.of("project", "request"), second.getContent().stream().map(HistoryItemDto::getType).toList());
    }

    @Test
    void getHistory_SkipsEventsWithoutATimestamp() {
        // an approved request that was never updated has no moment of joining, but was still asked for
        requestTo(projectOf(person("dave"), "Dave's Idea", ProjectStatus.ACTIVE, 0), me, RequestStatus.APPROVED, "again", 3, null);
        settle();

        List<String> ids = ids(history(null, null, null));

        assertEquals(7, ids.size());
        assertTrue(ids.stream().anyMatch(i -> i.startsWith("request:sent:")));
        assertEquals(0, ids.stream().filter(i -> i.startsWith("collaboration:joined:")).count());
    }

    @Test
    void getHistory_CountsMyOwnApprovedRequestAsJoining() {
        CollaborationRequest joined = requestTo(projectOf(person("dave"), "Dave's Idea", ProjectStatus.ACTIVE, 0), me,
                RequestStatus.APPROVED, "hi", 3, 2);
        settle();

        List<HistoryItemDto> items = history("collaboration", null, null).getContent();

        assertEquals(List.of("collaboration:joined:" + joined.getId(), "collaboration:accepted:" + received.getId()), ids(history("collaboration", null, null)));
        assertEquals("Joined \"Dave's Idea\"", items.get(0).getTitle());
        assertEquals("Your request was approved by dave", items.get(0).getDescription());
    }

    @Test
    void getHistory_OnlyShowsMyOwnActivity() {
        Project bobs = projectOf(bob, "Bob's thing", ProjectStatus.ACTIVE, 1);
        completedTask(bobs, bob, "Bob's task", 1);
        file(bobs, bob, "bob.txt", 1);
        requestTo(carols, bob, RequestStatus.PENDING, "bob asks carol", 1, null);
        settle();

        assertEquals(6, history(null, null, null).getTotalElements());
        assertEquals(6, historyService.getStats().getTotalActivities());
    }

    @Test
    void getHistory_ShowsDeletedPeopleAsDeletedUsers() {
        // users are soft-deleted; the profiles (and so the requests) stay
        em.getEntityManager().createNativeQuery("update users set deleted_at = :t where username in ('bob', 'carol')")
                .setParameter("t", now).executeUpdate();
        settle();

        List<HistoryItemDto> items = history(null, null, null).getContent();

        assertEquals(6, items.size());
        HistoryItemDto sentItem = items.stream().filter(i -> i.getId().startsWith("request:sent")).findFirst().orElseThrow();
        assertEquals("deleted user", sentItem.getRelatedUsername());
        HistoryItemDto receivedItem = items.stream().filter(i -> i.getId().startsWith("request:received")).findFirst().orElseThrow();
        assertEquals("deleted user asked to join \"Collabro\"", receivedItem.getTitle());
    }

    @Test
    void getHistory_WalksEveryEventExactlyOnceEvenWhenTheyAllShareATimestamp() {
        // 120 events with the very same timestamp, spread over several kinds: the order must still be total,
        // or a page boundary would repeat some events and drop others
        LocalDateTime same = now.minusDays(1);
        for (int i = 0; i < 40; i++) {
            Profile asker = person("asker" + i);
            CollaborationRequest r = requestTo(mine, asker, RequestStatus.PENDING, "m" + i, 0, null);
            setTimes("requests", r.getId(), same, same);
            ProjectFile f = file(mine, me, "same" + i + ".txt", 0);
            setTimes("project_files", f.getId(), same, null);
            Project p = projectOf(me, "Same " + i, ProjectStatus.ACTIVE, 0);
            setTimes("projects", p.getId(), same, null);
        }
        settle();

        long total = history(null, null, null).getTotalElements();
        Set<String> seen = new HashSet<>();
        List<String> order = new ArrayList<>();
        for (int page = 0; seen.size() < total && page < 100; page++) {
            for (HistoryItemDto item : historyService.getHistory(null, null, null, PageRequest.of(page, 17)).getContent()) {
                assertTrue(seen.add(item.getId()), "repeated across pages: " + item.getId());
                order.add(item.getId());
            }
        }
        assertEquals(total, seen.size());
        assertEquals(126, total);
        // and it is the same order a single big page gives
        assertEquals(ids(historyService.getHistory(null, null, null, PageRequest.of(0, 200))), order);
    }

    @Test
    void getStats_SummarisesTheTimeline() {
        HistoryStatsDto stats = historyService.getStats();

        assertEquals(6, stats.getTotalActivities());
        assertEquals(1, stats.getProjectsCreated());
        assertEquals(0, stats.getCollaborationsJoined());
        assertEquals(1, stats.getTasksCompleted());
        assertEquals(4, stats.getThisWeek());
        assertEquals(5, stats.getThisMonth());
    }

    @Test
    void getStats_CountsJoiningTheTeamsOfOthers() {
        requestTo(projectOf(person("dave"), "Dave's Idea", ProjectStatus.ACTIVE, 0), me, RequestStatus.APPROVED, "hi", 3, 2);
        settle();

        assertEquals(1, historyService.getStats().getCollaborationsJoined());
        assertEquals(8, historyService.getStats().getTotalActivities());
    }

    // ---------------------------------------------------------------- cost

    private long statements(Runnable work) {
        var statistics = entityManagerFactory.unwrap(SessionFactory.class).getStatistics();
        statistics.clear();
        work.run();
        return statistics.getPrepareStatementCount();
    }

    private void manyEvents(int count) {
        for (int i = 0; i < count; i++) {
            Profile asker = person("busy" + counter++);
            CollaborationRequest r = requestTo(mine, asker, RequestStatus.APPROVED, "m", i % 30, i % 20);
            file(mine, me, "f" + counter + ".txt", i % 30);
            completedTask(mine, me, "t" + counter, i % 30);
            projectOf(me, "p" + counter, ProjectStatus.ACTIVE, i % 30);
            assertNotNull(r.getId());
        }
        settle();
    }

    @Test
    void aPageOfHistoryAndTheStats_NeedTheSameNumberOfQueriesForAQuietAccountAndABusyOne() {
        long quietPage = statements(() -> historyService.getHistory(null, null, null, PageRequest.of(0, 20)));
        long quietStats = statements(() -> historyService.getStats());

        manyEvents(150); // roughly 750 more events
        assertTrue(history(null, null, null).getTotalElements() > 700);

        long busyPage = statements(() -> historyService.getHistory(null, null, null, PageRequest.of(0, 20)));
        long busyStats = statements(() -> historyService.getStats());

        assertEquals(quietPage, busyPage, "a page must not cost more queries on a busy account");
        assertEquals(quietStats, busyStats);
        assertTrue(busyPage <= 14, "expected one count and one page query per kind of event, got " + busyPage);
        assertTrue(busyStats <= 7, "expected one query per kind of event, got " + busyStats);
    }

    @Test
    void aPastTheEndPageCostsOnlyTheCounts() {
        manyEvents(10);

        long statements = statements(() -> assertTrue(
                historyService.getHistory(null, null, null, PageRequest.of(1000, 50)).getContent().isEmpty()));

        assertTrue(statements <= 7, "no event rows should be read past the end, got " + statements);
    }

    @Test
    void aTypeFilterOnlyAsksForThatKindOfEvent() {
        manyEvents(10);

        long statements = statements(() -> history("file", null, null));

        assertTrue(statements <= 2, "one count and one page query, got " + statements);
    }
}
