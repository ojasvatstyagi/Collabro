package com.example.backend.services;

import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.PageImpl;
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

    private static final Pageable PAGE = PageRequest.of(0, 20);

    private void myTeamsAre(Team... teams) {
        when(teamRepository.pageActiveTeamsOf(me.getId(), TeamStatus.ACTIVE, PAGE))
                .thenReturn(new PageImpl<>(List.of(teams), PAGE, teams.length));
    }

    @Test
    void getMyTeams_DescribesMyRoleAndCountsTheOwner() {
        Profile owner = profile("owner");
        Project joined = project(owner, me, profile("third"));
        myTeamsAre(teamOf(joined, LocalDateTime.now()));

        List<TeamSummaryDto> teams = teamService.getMyTeams(PAGE).getContent();

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
        myTeamsAre(teamOf(mine, LocalDateTime.now()));

        assertEquals("OWNER", teamService.getMyTeams(PAGE).getContent().get(0).getRole());
    }

    @Test
    void getMyTeams_KeepsTheTotalSoTheCallerCanTellThereAreMorePages() {
        Project mine = project(me, profile("alice"));
        when(teamRepository.pageActiveTeamsOf(me.getId(), TeamStatus.ACTIVE, PAGE))
                .thenReturn(new PageImpl<>(List.of(teamOf(mine, LocalDateTime.now())), PAGE, 45));

        assertEquals(45, teamService.getMyTeams(PAGE).getTotalElements());
    }

    @Test
    void getMyTeams_WithNoTeams_ReturnsAnEmptyPage() {
        myTeamsAre();

        assertTrue(teamService.getMyTeams(PAGE).isEmpty());
    }
}
