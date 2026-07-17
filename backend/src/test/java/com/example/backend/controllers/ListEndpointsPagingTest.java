package com.example.backend.controllers;

import com.example.backend.dto.CollaborationRequestDTO;
import com.example.backend.dto.ProjectDto;
import com.example.backend.dto.ProjectFileDto;
import com.example.backend.dto.TaskDto;
import com.example.backend.dto.TeamSummaryDto;
import com.example.backend.enums.RequestStatus;
import com.example.backend.exceptions.GlobalExceptionHandler;
import com.example.backend.services.ProjectFileService;
import com.example.backend.services.ProjectService;
import com.example.backend.services.RequestService;
import com.example.backend.services.TaskService;
import com.example.backend.services.TeamService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Every list endpoint keeps returning a plain array, never returns more than the ceiling, accepts optional paging
 * parameters (clamped) and reports where it is in the X-* headers.
 */
@ExtendWith(MockitoExtension.class)
class ListEndpointsPagingTest {

    @Mock
    private ProjectService projectService;
    @Mock
    private RequestService requestService;
    @Mock
    private TaskService taskService;
    @Mock
    private ProjectFileService projectFileService;
    @Mock
    private TeamService teamService;

    @InjectMocks
    private ProjectController projectController;
    @InjectMocks
    private RequestController requestController;
    @InjectMocks
    private ProjectFileController projectFileController;
    @InjectMocks
    private TeamController teamController;

    private MockMvc mockMvc;
    private final UUID id = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(projectController, requestController, projectFileController, teamController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    private static final Sort NEWEST_FIRST = Sort.by(Sort.Order.desc("createdAt"), Sort.Order.desc("id"));

    private ProjectDto project() {
        return ProjectDto.builder().id(id).title("Apollo").build();
    }

    @Test
    void myProjects_WithoutParameters_ReturnTheFirst200NewestFirstAndSayHowManyThereAre() throws Exception {
        when(projectService.getMyProjects(any())).thenReturn(new PageImpl<>(List.of(project()), PageRequest.of(0, 200, NEWEST_FIRST), 350));

        mockMvc.perform(get("/api/projects/me"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].title").value("Apollo"))   // still a plain array
                .andExpect(header().string("X-Total-Count", "350"))
                .andExpect(header().string("X-Page", "0"))
                .andExpect(header().string("X-Page-Size", "200"));

        ArgumentCaptor<Pageable> captor = ArgumentCaptor.forClass(Pageable.class);
        verify(projectService).getMyProjects(captor.capture());
        assertEquals(PageRequest.of(0, 200, NEWEST_FIRST), captor.getValue());
    }

    @Test
    void joinedProjects_ClampTheRequestedPageSize() throws Exception {
        when(projectService.getJoinedProjects(any())).thenReturn(new PageImpl<>(List.of(project())));

        mockMvc.perform(get("/api/projects/joined").param("page", "2").param("size", "5000")).andExpect(status().isOk());
        mockMvc.perform(get("/api/projects/joined").param("page", "-4").param("size", "0")).andExpect(status().isOk());

        ArgumentCaptor<Pageable> captor = ArgumentCaptor.forClass(Pageable.class);
        verify(projectService, org.mockito.Mockito.times(2)).getJoinedProjects(captor.capture());
        assertEquals(PageRequest.of(2, 100, NEWEST_FIRST), captor.getAllValues().get(0));
        assertEquals(PageRequest.of(0, 1, NEWEST_FIRST), captor.getAllValues().get(1));
    }

    @Test
    void givingOnlyAPage_UsesTheDefaultSize() throws Exception {
        when(projectService.getProjectsByProfileId(eq(id), any())).thenReturn(new PageImpl<>(List.of(project())));

        mockMvc.perform(get("/api/projects/user/" + id).param("page", "1")).andExpect(status().isOk());

        ArgumentCaptor<Pageable> captor = ArgumentCaptor.forClass(Pageable.class);
        verify(projectService).getProjectsByProfileId(eq(id), captor.capture());
        assertEquals(PageRequest.of(1, 20, NEWEST_FIRST), captor.getValue());
    }

    @Test
    void tasks_AreAPlainArrayWithTheTotalInAHeader() throws Exception {
        when(taskService.getTasksByProject(eq(id), any())).thenReturn(new PageImpl<>(List.of(TaskDto.builder().title("t").build()), PageRequest.of(0, 1), 3));

        mockMvc.perform(get("/api/projects/" + id + "/tasks"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(header().string("X-Total-Count", "3"));
    }

    @Test
    void files_AreAPlainArrayWithTheTotalInAHeader() throws Exception {
        when(projectFileService.getProjectFiles(eq(id), any())).thenReturn(new PageImpl<>(List.of(new ProjectFileDto()), PageRequest.of(0, 1), 9));

        mockMvc.perform(get("/api/projects/" + id + "/files"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(header().string("X-Total-Count", "9"));
    }

    @Test
    void teams_AreAPlainArrayWithTheTotalInAHeader() throws Exception {
        when(teamService.getMyTeams(any())).thenReturn(new PageImpl<>(List.of(TeamSummaryDto.builder().id(1L).name("T").build()), PageRequest.of(0, 1), 2));

        mockMvc.perform(get("/api/teams/me"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("T"))
                .andExpect(header().string("X-Total-Count", "2"));
    }

    @Test
    void receivedRequests_KeepTheEnvelopeAndAddTheTotalAndThePagingHeaders() throws Exception {
        when(requestService.getReceivedRequests(eq(RequestStatus.PENDING), any()))
                .thenReturn(new PageImpl<>(List.of(new CollaborationRequestDTO()), PageRequest.of(1, 10), 31));

        mockMvc.perform(get("/api/requests/received").param("status", "PENDING").param("page", "1").param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.length()").value(1))
                .andExpect(jsonPath("$.count").value(1))
                .andExpect(jsonPath("$.total").value(31))
                .andExpect(header().string("X-Total-Count", "31"))
                .andExpect(header().string("X-Page", "1"));

        ArgumentCaptor<Pageable> captor = ArgumentCaptor.forClass(Pageable.class);
        verify(requestService).getReceivedRequests(eq(RequestStatus.PENDING), captor.capture());
        assertEquals(PageRequest.of(1, 10, NEWEST_FIRST), captor.getValue());
    }

    @Test
    void sentRequests_AreCappedLikeTheOthers() throws Exception {
        when(requestService.getSentRequests(eq(null), any())).thenReturn(new PageImpl<>(List.of()));

        mockMvc.perform(get("/api/requests/sent")).andExpect(status().isOk()).andExpect(jsonPath("$.total").value(0));

        ArgumentCaptor<Pageable> captor = ArgumentCaptor.forClass(Pageable.class);
        verify(requestService).getSentRequests(eq(null), captor.capture());
        assertEquals(PageRequest.of(0, 200, NEWEST_FIRST), captor.getValue());
    }
}
