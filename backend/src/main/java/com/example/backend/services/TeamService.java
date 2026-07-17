package com.example.backend.services;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import com.example.backend.dto.PublicProfileDto;
import com.example.backend.dto.TeamSummaryDto;
import com.example.backend.enums.TeamStatus;
import com.example.backend.models.Profile;
import com.example.backend.models.Project;
import com.example.backend.models.Team;
import com.example.backend.repositories.TeamRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;

/**
 * A team is the member group of one project, created when its first join request is approved. This lists
 * the ones the current user owns or belongs to; there is no separate team entity to create or browse.
 */
@Service
@RequiredArgsConstructor
public class TeamService {

    private final TeamRepository teamRepository;
    private final ProfileService profileService;

    @Transactional(readOnly = true)
    public Page<TeamSummaryDto> getMyTeams(Pageable pageable) {
        Profile me = profileService.getCurrentUserProfile();
        return teamRepository.pageActiveTeamsOf(me.getId(), TeamStatus.ACTIVE, pageable).map(team -> toDto(team, me));
    }

    private TeamSummaryDto toDto(Team team, Profile me) {
        Project project = team.getProject();
        List<PublicProfileDto> members = team.getMembers().stream().map(profileService::toPublicDto).toList();
        boolean owner = project.getCreatedBy().getId().equals(me.getId());
        return TeamSummaryDto.builder()
                .id(team.getId())
                .name(team.getTeamName())
                .projectId(project.getId())
                .projectTitle(project.getTitle())
                .projectStatus(project.getStatus() != null ? project.getStatus().name() : null)
                .role(owner ? "OWNER" : "MEMBER")
                .owner(profileService.toPublicDto(project.getCreatedBy()))
                .members(members)
                .memberCount(members.size() + 1)
                .createdAt(team.getCreatedAt())
                .build();
    }
}
