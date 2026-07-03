package com.example.backend.services;

import com.example.backend.exceptions.ForbiddenException;
import com.example.backend.models.Profile;
import com.example.backend.models.Project;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static com.example.backend.services.ProjectTestData.profile;
import static com.example.backend.services.ProjectTestData.project;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProjectAccessServiceTest {

    @Mock
    private ProfileService profileService;

    private ProjectAccessService access;
    private Profile owner;
    private Profile member;
    private Profile outsider;
    private Project project;

    @BeforeEach
    void setUp() {
        access = new ProjectAccessService(profileService);
        owner = profile("owner");
        member = profile("member");
        outsider = profile("outsider");
        project = project(owner, member);
    }

    @Test
    void isMember_CoversOwnerAndTeamMembersButNotOutsiders() {
        assertTrue(access.isMember(project, owner));
        assertTrue(access.isMember(project, member));
        assertFalse(access.isMember(project, outsider));
    }

    @Test
    void isMember_ProjectWithoutTeam_OnlyOwner() {
        Project noTeam = project(owner);
        assertTrue(access.isMember(noTeam, owner));
        assertFalse(access.isMember(noTeam, member));
    }

    @Test
    void isOwner_OnlyTrueForCreator() {
        assertTrue(access.isOwner(project, owner));
        assertFalse(access.isOwner(project, member));
    }

    @Test
    void requireMember_ForOutsider_ThrowsForbidden() {
        when(profileService.getCurrentUserProfile()).thenReturn(outsider);
        assertThrows(ForbiddenException.class, () -> access.requireMember(project));
    }

    @Test
    void requireMember_ForTeamMember_ReturnsCurrentProfile() {
        when(profileService.getCurrentUserProfile()).thenReturn(member);
        assertEquals(member, access.requireMember(project));
    }

    @Test
    void requireOwner_ForTeamMember_ThrowsForbidden() {
        when(profileService.getCurrentUserProfile()).thenReturn(member);
        assertThrows(ForbiddenException.class, () -> access.requireOwner(project));
    }

    @Test
    void requireOwner_ForOwner_ReturnsCurrentProfile() {
        when(profileService.getCurrentUserProfile()).thenReturn(owner);
        assertEquals(owner, access.requireOwner(project));
    }
}
