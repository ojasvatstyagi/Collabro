package com.example.backend.services;

import com.example.backend.dto.HistoryItemDto;
import com.example.backend.dto.HistoryStatsDto;
import com.example.backend.enums.RequestStatus;
import com.example.backend.enums.TaskStatus;
import com.example.backend.models.CollaborationRequest;
import com.example.backend.models.Profile;
import com.example.backend.models.Project;
import com.example.backend.models.ProjectFile;
import com.example.backend.models.Task;
import com.example.backend.repositories.ProjectFileRepository;
import com.example.backend.repositories.ProjectRepository;
import com.example.backend.repositories.RequestRepository;
import com.example.backend.repositories.TaskRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static com.example.backend.services.ProjectTestData.profile;
import static com.example.backend.services.ProjectTestData.project;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class HistoryServiceTest {

    @Mock
    private ProfileService profileService;
    @Mock
    private ProjectRepository projectRepository;
    @Mock
    private RequestRepository requestRepository;
    @Mock
    private TaskRepository taskRepository;
    @Mock
    private ProjectFileRepository projectFileRepository;

    @InjectMocks
    private HistoryService historyService;

    private Profile me;
    private Profile bob;
    private Profile carol;
    private Project mine;
    private Project carols;
    private final LocalDateTime now = LocalDateTime.now();

    @BeforeEach
    void setUp() {
        me = profile("me");
        bob = profile("bob");
        carol = profile("carol");
        when(profileService.getCurrentUserProfile()).thenReturn(me);

        // A month of activity: project (10d), bob's request received (5d) and approved (4d),
        // my rejected request to carol (40d), a completed task (2d), an uploaded file (1d)
        mine = project(me);
        mine.setTitle("Collabro");
        mine.setCreatedAt(now.minusDays(10));
        mine.setStatus(com.example.backend.enums.ProjectStatus.ACTIVE);
        carols = project(carol);
        carols.setTitle("Carol's Idea");

        CollaborationRequest received = request(1L, bob, mine, RequestStatus.APPROVED, 5, 4);
        CollaborationRequest sent = request(2L, me, carols, RequestStatus.REJECTED, 40, 39);

        Task task = new Task();
        task.setId(UUID.randomUUID());
        task.setTitle("Write docs");
        task.setStatus(TaskStatus.COMPLETED);
        task.setProject(mine);
        task.setUpdatedAt(now.minusDays(2));

        ProjectFile file = new ProjectFile();
        file.setId(UUID.randomUUID());
        file.setFileName("spec.pdf");
        file.setProject(mine);
        file.setCreatedAt(now.minusDays(1));

        lenient().when(projectRepository.findByCreatedBy_Id(me.getId())).thenReturn(List.of(mine));
        lenient().when(requestRepository.findByProjectOwner(me)).thenReturn(List.of(received));
        lenient().when(requestRepository.findByRequester(me)).thenReturn(List.of(sent));
        lenient().when(taskRepository.findByAssignedToIdAndStatus(me.getId(), TaskStatus.COMPLETED))
                .thenReturn(List.of(task));
        lenient().when(projectFileRepository.findByUploadedById(me.getId())).thenReturn(List.of(file));
    }

    private CollaborationRequest request(Long id, Profile requester, Project project, RequestStatus status,
            int createdDaysAgo, int updatedDaysAgo) {
        CollaborationRequest request = new CollaborationRequest();
        request.setId(id);
        request.setRequester(requester);
        request.setProject(project);
        request.setStatus(status);
        request.setCreatedAt(now.minusDays(createdDaysAgo));
        request.setUpdatedAt(now.minusDays(updatedDaysAgo));
        return request;
    }

    private List<String> ids(Page<HistoryItemDto> page) {
        return page.getContent().stream().map(HistoryItemDto::getId).toList();
    }

    private Page<HistoryItemDto> history(String type, String timeframe, String search) {
        return historyService.getHistory(type, timeframe, search, PageRequest.of(0, 50));
    }

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
        assertEquals("bob", accepted.getRelatedUsername());
        assertEquals(mine.getId(), accepted.getProjectId());

        HistoryItemDto sent = items.stream().filter(i -> i.getId().startsWith("request:sent")).findFirst().orElseThrow();
        assertEquals("Asked to join \"Carol's Idea\"", sent.getTitle());
        assertEquals("rejected", sent.getStatus());
        assertEquals("carol", sent.getRelatedUsername());

        HistoryItemDto created = items.stream().filter(i -> i.getType().equals("project")).findFirst().orElseThrow();
        assertEquals("ongoing", created.getStatus());
    }

    @Test
    void getHistory_FiltersByType() {
        assertEquals(2, history("request", null, null).getTotalElements());
        assertEquals(1, history("TASK", null, null).getTotalElements());
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
    void getHistory_SearchesTitleDescriptionAndProjectName() {
        assertEquals(List.of("request:sent:2"), ids(history(null, null, "carol")));
        assertEquals(List.of("task:" + history("task", null, null).getContent().get(0).getId().substring(5)),
                ids(history(null, null, "write docs")));
        assertEquals(5, history(null, null, "COLLABRO").getTotalElements());
    }

    @Test
    void getHistory_Paginates() {
        Page<HistoryItemDto> second = historyService.getHistory(null, null, null, PageRequest.of(1, 4));

        assertEquals(6, second.getTotalElements());
        assertEquals(2, second.getContent().size());
        assertEquals(2, second.getTotalPages());
        assertTrue(historyService.getHistory(null, null, null, PageRequest.of(5, 4)).getContent().isEmpty());
    }

    @Test
    void getHistory_SkipsEventsWithoutATimestamp() {
        mine.setCreatedAt(null);

        assertEquals(5, history(null, null, null).getTotalElements());
    }

    @Test
    void getHistory_CountsMyOwnApprovedRequestAsJoining() {
        CollaborationRequest joined = request(3L, me, carols, RequestStatus.APPROVED, 3, 2);
        when(requestRepository.findByRequester(me)).thenReturn(List.of(joined));

        List<HistoryItemDto> items = history("collaboration", null, null).getContent();

        assertEquals(List.of("collaboration:joined:3", "collaboration:accepted:1"), ids(history("collaboration", null, null)));
        assertEquals("Joined \"Carol's Idea\"", items.get(0).getTitle());
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
}
