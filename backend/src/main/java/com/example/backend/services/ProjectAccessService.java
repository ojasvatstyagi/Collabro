package com.example.backend.services;

import com.example.backend.exceptions.ForbiddenException;
import com.example.backend.models.Profile;
import com.example.backend.models.Project;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.UUID;

/**
 * Central place for "who may touch this project" rules: the project owner, plus members of its team.
 */
@Service
@RequiredArgsConstructor
public class ProjectAccessService {

    private final ProfileService profileService;

    public boolean isOwner(Project project, Profile profile) {
        return project.getCreatedBy() != null && project.getCreatedBy().getId().equals(profile.getId());
    }

    public boolean isMember(Project project, Profile profile) {
        return isOwner(project, profile) || isTeamMember(project, profile.getId());
    }

    /** True if the profile is the owner or a team member of the project. */
    public boolean isMember(Project project, UUID profileId) {
        if (project.getCreatedBy() != null && project.getCreatedBy().getId().equals(profileId)) {
            return true;
        }
        return isTeamMember(project, profileId);
    }

    public Profile requireOwner(Project project) {
        Profile current = profileService.getCurrentUserProfile();
        if (!isOwner(project, current)) {
            throw new ForbiddenException("Only the project owner can do this");
        }
        return current;
    }

    public Profile requireMember(Project project) {
        Profile current = profileService.getCurrentUserProfile();
        if (!isMember(project, current)) {
            throw new ForbiddenException("You must be a member of this project to do this");
        }
        return current;
    }

    private boolean isTeamMember(Project project, UUID profileId) {
        return project.getTeam() != null
                && project.getTeam().getMembers().stream().anyMatch(member -> member.getId().equals(profileId));
    }
}
