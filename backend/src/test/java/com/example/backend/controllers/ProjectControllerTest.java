package com.example.backend.controllers;

import com.example.backend.dto.ProjectDto;
import com.example.backend.exceptions.GlobalExceptionHandler;
import com.example.backend.services.ProjectService;
import com.example.backend.services.RequestService;
import com.example.backend.services.TaskService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class ProjectControllerTest {

    @Mock
    private ProjectService projectService;
    @Mock
    private RequestService requestService;
    @Mock
    private TaskService taskService;

    @InjectMocks
    private ProjectController controller;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(controller)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    private static final String VALID_PROJECT = """
            {"title":"Collabro","description":"d","teamSize":4,"isRemote":true,"isOpenSource":true}""";

    // ---- input validation ----

    @Test
    void createProject_WithValidBody_ReturnsCreatedAndKeepsTheFlags() throws Exception {
        when(projectService.createProject(any(ProjectDto.class))).thenAnswer(inv -> inv.getArgument(0));

        mockMvc.perform(post("/api/projects").contentType(MediaType.APPLICATION_JSON).content(VALID_PROJECT))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.isRemote").value(true))
                .andExpect(jsonPath("$.isOpenSource").value(true));

        ArgumentCaptor<ProjectDto> captor = ArgumentCaptor.forClass(ProjectDto.class);
        verify(projectService).createProject(captor.capture());
        // The frontend sends isRemote / isOpenSource; these used to be dropped on the floor
        assertEquals(true, captor.getValue().isRemote());
        assertEquals(true, captor.getValue().isOpenSource());
    }

    @Test
    void createProject_WithBlankTitle_ReturnsBadRequestWithoutCallingTheService() throws Exception {
        mockMvc.perform(post("/api/projects").contentType(MediaType.APPLICATION_JSON)
                .content("{\"title\":\"  \",\"teamSize\":3}"))
                .andExpect(status().isBadRequest())
                .andExpect(content().string(org.hamcrest.Matchers.containsString("Title is required")));

        verifyNoInteractions(projectService);
    }

    @Test
    void createProject_WithTitleOverTheColumnLength_ReturnsBadRequest() throws Exception {
        mockMvc.perform(post("/api/projects").contentType(MediaType.APPLICATION_JSON)
                .content("{\"title\":\"" + "x".repeat(256) + "\",\"teamSize\":3}"))
                .andExpect(status().isBadRequest());

        verifyNoInteractions(projectService);
    }

    @Test
    void createProject_WithInvalidTeamSize_ReturnsBadRequest() throws Exception {
        for (int size : new int[] { 0, -2, 101 }) {
            mockMvc.perform(post("/api/projects").contentType(MediaType.APPLICATION_JSON)
                    .content("{\"title\":\"ok\",\"teamSize\":" + size + "}"))
                    .andExpect(status().isBadRequest());
        }
        verifyNoInteractions(projectService);
    }

    @Test
    void updateProject_IsValidatedToo() throws Exception {
        mockMvc.perform(put("/api/projects/" + UUID.randomUUID()).contentType(MediaType.APPLICATION_JSON)
                .content("{\"title\":\"\",\"teamSize\":3}"))
                .andExpect(status().isBadRequest());

        verify(projectService, never()).updateProject(any(), any());
    }

    @Test
    void createProjectTask_WithOversizedTitle_ReturnsBadRequest() throws Exception {
        mockMvc.perform(post("/api/projects/" + UUID.randomUUID() + "/tasks")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"title\":\"" + "x".repeat(256) + "\"}"))
                .andExpect(status().isBadRequest());

        verifyNoInteractions(taskService);
    }

    // ---- paging and sorting ----

    private Pageable requestedPage(String query) throws Exception {
        when(projectService.getAllProjects(isNull(), isNull(), isNull(), isNull(), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(), PageRequest.of(0, 10), 0));
        mockMvc.perform(get("/api/projects" + query)).andExpect(status().isOk());
        ArgumentCaptor<Pageable> captor = ArgumentCaptor.forClass(Pageable.class);
        verify(projectService).getAllProjects(isNull(), isNull(), isNull(), isNull(), captor.capture());
        return captor.getValue();
    }

    @Test
    void getAllProjects_DefaultsToNewestFirst() throws Exception {
        Pageable pageable = requestedPage("");

        assertEquals(10, pageable.getPageSize());
        assertEquals(Sort.Direction.DESC, pageable.getSort().getOrderFor("createdAt").getDirection());
    }

    @Test
    void getAllProjects_CapsThePageSize() throws Exception {
        assertEquals(50, requestedPage("?size=100000").getPageSize());
    }

    @Test
    void getAllProjects_ClampsNonsensePagingValues() throws Exception {
        Pageable pageable = requestedPage("?page=-5&size=0");

        assertEquals(0, pageable.getPageNumber());
        assertEquals(1, pageable.getPageSize());
    }

    @Test
    void getAllProjects_HonoursAWhitelistedSort() throws Exception {
        Pageable pageable = requestedPage("?sort=title,asc");

        assertEquals(Sort.Direction.ASC, pageable.getSort().getOrderFor("title").getDirection());
    }

    @Test
    void getAllProjects_RejectsSortingByAnythingElse() throws Exception {
        mockMvc.perform(get("/api/projects").param("sort", "createdBy.user.password,asc"))
                .andExpect(status().isBadRequest())
                .andExpect(content().string(org.hamcrest.Matchers.containsString("Cannot sort by")));

        verifyNoInteractions(projectService);
    }

    @Test
    void getAllProjects_WithAnEmptySortParameter_FallsBackToTheDefault() throws Exception {
        when(projectService.getAllProjects(isNull(), isNull(), isNull(), isNull(), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(), PageRequest.of(0, 10), 0));

        mockMvc.perform(get("/api/projects").param("sort", "")).andExpect(status().isOk());
    }

    @Test
    void getProjectTeam_ReturnsOnlyThePublicProfileFields() throws Exception {
        UUID id = UUID.randomUUID();
        when(projectService.getProjectTeam(id)).thenReturn(List.of(
                com.example.backend.dto.PublicProfileDto.builder().username("alice").firstname("Alice").build()));

        mockMvc.perform(get("/api/projects/" + id + "/team"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].username").value("alice"))
                .andExpect(jsonPath("$[0].email").doesNotExist())
                .andExpect(jsonPath("$[0].phone").doesNotExist());
    }

    @Test
    void leaveProject_Returns204() throws Exception {
        UUID id = UUID.randomUUID();

        mockMvc.perform(post("/api/projects/" + id + "/leave")).andExpect(status().isNoContent());

        verify(projectService).leaveProject(id);
    }

    @Test
    void deleteProject_Returns204() throws Exception {
        UUID id = UUID.randomUUID();

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete("/api/projects/" + id))
                .andExpect(status().isNoContent());

        verify(projectService).deleteProject(id);
    }

    @Test
    void deleteProject_ByANonOwner_Returns403() throws Exception {
        UUID id = UUID.randomUUID();
        org.mockito.Mockito.doThrow(new com.example.backend.exceptions.ForbiddenException("Only the project owner can delete the project"))
                .when(projectService).deleteProject(id);

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete("/api/projects/" + id))
                .andExpect(status().isForbidden());
    }
}
