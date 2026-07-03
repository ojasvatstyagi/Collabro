package com.example.backend.services;

import com.example.backend.dto.PublicProfileDto;
import com.example.backend.dto.TeamSummaryDto;
import com.example.backend.enums.TeamStatus;
import com.example.backend.models.Profile;
import com.example.backend.models.Project;
import com.example.backend.models.Team;
import com.example.backend.repositories.TeamRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;

import static com.example.backend.services.ProjectTestData.profile;
import static com.example.backend.services.ProjectTestData.project;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TeamServiceTest {

    @Mock
    private TeamRepository teamRepository;
    @Mock
    private ProfileService profileService;

    @InjectMocks
    private TeamService teamService;

    private Profile me;

    @BeforeEach
    void setUp() {
        me = profile("me");
        lenient().when(profileService.getCurrentUserProfile()).thenReturn(me);
        lenient().when(profileService.toPublicDto(any(Profile.class))).thenAnswer(inv -> {
            Profile p = inv.getArgument(0);
            return PublicProfileDto.builder().id(p.getId()).username(p.displayUsername()).build();
        });
    }

    private Team teamOf(Project project, LocalDateTime createdAt) {
        Team team = project.getTeam();
        team.setTeamName(project.getTitle() + " Team");
        team.setCreatedAt(createdAt);
        return team;
    }

    @Test
    void getMyTeams_DescribesMyRoleAndCountsTheOwner() {
        Profile owner = profile("owner");
        Project joined = project(owner, me, profile("third"));
        Team team = teamOf(joined, LocalDateTime.now());
        when(teamRepository.findActiveTeamsOf(me.getId(), TeamStatus.ACTIVE)).thenReturn(List.of(team));

        List<TeamSummaryDto> teams = teamService.getMyTeams();

        assertEquals(1, teams.size());
        TeamSummaryDto dto = teams.get(0);
        assertEquals("MEMBER", dto.getRole());
        assertEquals("owner", dto.getOwner().getUsername());
        assertEquals(2, dto.getMembers().size());
        assertEquals(3, dto.getMemberCount());
        assertEquals(joined.getId(), dto.getProjectId());
        assertEquals("Collabro Team", dto.getName());
    }

    @Test
    void getMyTeams_MarksTeamsIOwnAsOwner() {
        Project mine = project(me, profile("alice"));
        when(teamRepository.findActiveTeamsOf(me.getId(), TeamStatus.ACTIVE))
                .thenReturn(List.of(teamOf(mine, LocalDateTime.now())));

        assertEquals("OWNER", teamService.getMyTeams().get(0).getRole());
    }

    @Test
    void getMyTeams_ListsNewestFirstAndSkipsTeamsWithoutAProject() {
        Project older = project(me, profile("a"));
        older.setTitle("Older");
        Project newer = project(me, profile("b"));
        newer.setTitle("Newer");
        Team orphan = new Team();
        orphan.setStatus(TeamStatus.ACTIVE);
        when(teamRepository.findActiveTeamsOf(me.getId(), TeamStatus.ACTIVE)).thenReturn(List.of(
                teamOf(older, LocalDateTime.now().minusDays(5)), orphan, teamOf(newer, LocalDateTime.now())));

        List<String> names = teamService.getMyTeams().stream().map(TeamSummaryDto::getName).toList();

        assertEquals(List.of("Newer Team", "Older Team"), names);
    }

    @Test
    void getMyTeams_WithNoTeams_ReturnsAnEmptyList() {
        assertTrue(teamService.getMyTeams().isEmpty());
    }
}
