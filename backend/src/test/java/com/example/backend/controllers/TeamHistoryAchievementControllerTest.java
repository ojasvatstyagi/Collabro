package com.example.backend.controllers;

import com.example.backend.dto.AchievementDto;
import com.example.backend.dto.AchievementOverviewDto;
import com.example.backend.dto.HistoryItemDto;
import com.example.backend.dto.HistoryStatsDto;
import com.example.backend.dto.PublicProfileDto;
import com.example.backend.dto.TeamSummaryDto;
import com.example.backend.exceptions.GlobalExceptionHandler;
import com.example.backend.services.AchievementService;
import com.example.backend.services.HistoryService;
import com.example.backend.services.TeamService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class TeamHistoryAchievementControllerTest {

    @Mock
    private TeamService teamService;
    @Mock
    private HistoryService historyService;
    @Mock
    private AchievementService achievementService;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(new TeamController(teamService),
                new HistoryController(historyService), new AchievementController(achievementService))
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    void myTeams_ReturnsTheTeamsWithoutAnyContactDetails() throws Exception {
        when(teamService.getMyTeams(any(Pageable.class))).thenReturn(new PageImpl<>(List.of(TeamSummaryDto.builder()
                .id(7L).name("Collabro Team").role("OWNER").memberCount(2)
                .owner(PublicProfileDto.builder().username("me").build())
                .members(List.of(PublicProfileDto.builder().username("alice").build())).build())));

        mockMvc.perform(get("/api/teams/me"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(7))
                .andExpect(jsonPath("$[0].role").value("OWNER"))
                .andExpect(jsonPath("$[0].members[0].username").value("alice"))
                .andExpect(jsonPath("$[0].members[0].email").doesNotExist());
    }

    @Test
    void history_PassesFiltersAndClampsPaging() throws Exception {
        when(historyService.getHistory(any(), any(), any(), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(HistoryItemDto.builder().id("project:1").type("project")
                        .title("Created \"X\"").timestamp(LocalDateTime.now()).build()), PageRequest.of(0, 100), 1));

        mockMvc.perform(get("/api/history").param("type", "task").param("timeframe", "week").param("search", "docs")
                .param("page", "-3").param("size", "9999"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].id").value("project:1"))
                .andExpect(jsonPath("$.totalElements").value(1));

        ArgumentCaptor<Pageable> page = ArgumentCaptor.forClass(Pageable.class);
        verify(historyService).getHistory(eq("task"), eq("week"), eq("docs"), page.capture());
        assertEquals(0, page.getValue().getPageNumber());
        assertEquals(100, page.getValue().getPageSize());
    }

    @Test
    void history_WithoutFilters_UsesAllTimeAndAPageOfFifty() throws Exception {
        when(historyService.getHistory(any(), any(), any(), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(), PageRequest.of(0, 50), 0));

        mockMvc.perform(get("/api/history")).andExpect(status().isOk());

        ArgumentCaptor<Pageable> page = ArgumentCaptor.forClass(Pageable.class);
        verify(historyService).getHistory(isNull(), isNull(), isNull(), page.capture());
        assertEquals(50, page.getValue().getPageSize());
    }

    @Test
    void historyStats_AreReturned() throws Exception {
        when(historyService.getStats()).thenReturn(HistoryStatsDto.builder().totalActivities(6).tasksCompleted(2).build());

        mockMvc.perform(get("/api/history/stats"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalActivities").value(6))
                .andExpect(jsonPath("$.tasksCompleted").value(2));
    }

    @Test
    void achievements_UseTheNamesTheFrontendExpects() throws Exception {
        when(achievementService.getMyAchievements()).thenReturn(AchievementOverviewDto.builder()
                .stats(AchievementOverviewDto.Stats.builder().level(2).rank("Contributor").build())
                .achievements(List.of(AchievementDto.builder().id("first_idea").name("First Idea").unlocked(true)
                        .progress(new AchievementDto.Progress(1, 1)).requirements(List.of("Create 1 project")).build()))
                .build());

        mockMvc.perform(get("/api/achievements/me"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.stats.rank").value("Contributor"))
                .andExpect(jsonPath("$.achievements[0].isUnlocked").value(true))
                .andExpect(jsonPath("$.achievements[0].unlocked").doesNotExist())
                .andExpect(jsonPath("$.achievements[0].progress.required").value(1));
    }
}
