package com.example.backend.services;

import com.example.backend.dto.CollaborationRequestDTO;
import com.example.backend.enums.RequestStatus;
import com.example.backend.enums.TeamStatus;
import com.example.backend.exceptions.BadRequestException;
import com.example.backend.models.CollaborationRequest;
import com.example.backend.models.Profile;
import com.example.backend.models.Project;
import com.example.backend.models.Team;
import com.example.backend.models.User;
import com.example.backend.repositories.ProjectRepository;
import com.example.backend.repositories.RequestRepository;
import com.example.backend.repositories.TeamRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import java.util.ArrayList;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RequestServiceTest {

    @Mock
    private RequestRepository requestRepository;
    @Mock
    private ProjectRepository projectRepository;
    @Mock
    private ProfileService profileService;
    @Mock
    private TeamRepository teamRepository;

    @InjectMocks
    private RequestService requestService;

    private Profile owner;
    private Profile alice;
    private Profile bob;
    private Project project;

    @BeforeEach
    void setUp() {
        owner = profile("owner");
        alice = profile("alice");
        bob = profile("bob");

        project = new Project();
        project.setId(UUID.randomUUID());
        project.setTitle("Collabro");
        project.setCreatedBy(owner);
    }

    private Profile profile(String username) {
        User user = new User();
        user.setId(UUID.randomUUID());
        user.setUsername(username);
        return Profile.builder()
                .id(UUID.randomUUID())
                .user(user)
                .firstname(username)
                .lastname("Test")
                .skills(new ArrayList<>())
                .build();
    }

    private CollaborationRequest pendingRequest(Long id, Profile requester) {
        CollaborationRequest request = new CollaborationRequest();
        request.setId(id);
        request.setProject(project);
        request.setRequester(requester);
        request.setStatus(RequestStatus.PENDING);
        return request;
    }

    private Team existingTeam(Profile... members) {
        Team team = new Team();
        team.setTeamName("Collabro Team");
        team.setStatus(TeamStatus.ACTIVE);
        team.setCreatedBy(owner);
        team.setOwner(owner);
        team.setProject(project);
        for (Profile member : members) {
            team.getMembers().add(member);
        }
        project.setTeam(team);
        return team;
    }

    // ---- approveRequest ----

    @Test
    void approveRequest_FirstApproval_CreatesActiveTeamOwnedByProjectOwner() {
        CollaborationRequest request = pendingRequest(1L, alice);
        when(requestRepository.findById(1L)).thenReturn(Optional.of(request));
        when(profileService.getCurrentUserProfile()).thenReturn(owner);
        when(requestRepository.save(request)).thenReturn(request);
        when(teamRepository.save(any(Team.class))).thenAnswer(inv -> inv.getArgument(0));

        CollaborationRequestDTO result = requestService.approveRequest(1L);

        assertEquals(RequestStatus.APPROVED, result.getStatus());
        Team team = project.getTeam();
        assertNotNull(team);
        assertEquals(TeamStatus.ACTIVE, team.getStatus());
        assertEquals(owner, team.getCreatedBy());
        assertEquals(owner, team.getOwner());
        assertEquals(1, team.getMembers().size());
        assertTrue(team.getMembers().contains(alice));
    }

    @Test
    void approveRequest_SecondApproval_AddsMemberToExistingTeam() {
        Team team = existingTeam(alice);
        CollaborationRequest request = pendingRequest(2L, bob);
        when(requestRepository.findById(2L)).thenReturn(Optional.of(request));
        when(profileService.getCurrentUserProfile()).thenReturn(owner);
        when(requestRepository.save(request)).thenReturn(request);

        requestService.approveRequest(2L);

        // Profiles compare by id, so bob must not be mistaken for alice
        assertEquals(2, team.getMembers().size());
        assertTrue(team.getMembers().contains(alice));
        assertTrue(team.getMembers().contains(bob));
        verify(teamRepository).save(team);
    }

    @Test
    void approveRequest_RequesterAlreadyOnTeam_DoesNotAddDuplicate() {
        Team team = existingTeam(alice);
        CollaborationRequest request = pendingRequest(3L, alice);
        when(requestRepository.findById(3L)).thenReturn(Optional.of(request));
        when(profileService.getCurrentUserProfile()).thenReturn(owner);
        when(requestRepository.save(request)).thenReturn(request);

        requestService.approveRequest(3L);

        assertEquals(1, team.getMembers().size());
        verify(teamRepository, never()).save(any(Team.class));
    }

    @Test
    void approveRequest_ByNonOwner_ThrowsAccessDenied() {
        CollaborationRequest request = pendingRequest(4L, alice);
        when(requestRepository.findById(4L)).thenReturn(Optional.of(request));
        when(profileService.getCurrentUserProfile()).thenReturn(bob);

        assertThrows(AccessDeniedException.class, () -> requestService.approveRequest(4L));

        assertEquals(RequestStatus.PENDING, request.getStatus());
        verify(requestRepository, never()).save(any(CollaborationRequest.class));
    }

    @Test
    void approveRequest_NotPending_ThrowsBadRequest() {
        CollaborationRequest request = pendingRequest(5L, alice);
        request.setStatus(RequestStatus.REJECTED);
        when(requestRepository.findById(5L)).thenReturn(Optional.of(request));
        when(profileService.getCurrentUserProfile()).thenReturn(owner);

        assertThrows(BadRequestException.class, () -> requestService.approveRequest(5L));
    }

    // ---- createJoinRequest ----

    @Test
    void createJoinRequest_ForNewRequesterOnTeamWithMembers_Succeeds() {
        existingTeam(alice);
        when(profileService.getCurrentUserProfile()).thenReturn(bob);
        when(projectRepository.findById(project.getId())).thenReturn(Optional.of(project));
        when(requestRepository.findByProjectAndRequester(project, bob)).thenReturn(Optional.empty());
        when(requestRepository.save(any(CollaborationRequest.class))).thenAnswer(inv -> inv.getArgument(0));

        CollaborationRequest result = requestService.createJoinRequest(project.getId(), "Let me in");

        assertEquals(RequestStatus.PENDING, result.getStatus());
        assertEquals(bob, result.getRequester());
        assertEquals("Let me in", result.getMessage());
    }

    @Test
    void createJoinRequest_WhenAlreadyTeamMember_ThrowsBadRequest() {
        existingTeam(alice);
        when(profileService.getCurrentUserProfile()).thenReturn(alice);
        when(projectRepository.findById(project.getId())).thenReturn(Optional.of(project));

        assertThrows(BadRequestException.class,
                () -> requestService.createJoinRequest(project.getId(), "hi"));
    }

    @Test
    void createJoinRequest_ForOwnProject_ThrowsBadRequest() {
        when(profileService.getCurrentUserProfile()).thenReturn(owner);
        when(projectRepository.findById(project.getId())).thenReturn(Optional.of(project));

        assertThrows(BadRequestException.class,
                () -> requestService.createJoinRequest(project.getId(), "hi"));
    }

    @Test
    void createJoinRequest_Duplicate_ThrowsBadRequest() {
        when(profileService.getCurrentUserProfile()).thenReturn(alice);
        when(projectRepository.findById(project.getId())).thenReturn(Optional.of(project));
        when(requestRepository.findByProjectAndRequester(project, alice))
                .thenReturn(Optional.of(pendingRequest(6L, alice)));

        assertThrows(BadRequestException.class,
                () -> requestService.createJoinRequest(project.getId(), "hi"));
        verify(requestRepository, never()).save(any(CollaborationRequest.class));
    }

    // ---- getRequestById ----

    @Test
    void getRequestById_ForTheProjectOwner_ReturnsADtoNotTheEntity() {
        CollaborationRequest request = pendingRequest(7L, alice);
        when(requestRepository.findById(7L)).thenReturn(Optional.of(request));
        when(profileService.getCurrentUserProfile()).thenReturn(owner);

        CollaborationRequestDTO dto = requestService.getRequestById(7L);

        assertEquals(7L, dto.getId());
        assertEquals(project.getId(), dto.getProjectId());
        assertEquals("alice", dto.getRequester().getUsername());
        assertEquals("alice Test", dto.getRequester().getDisplayName());
    }

    @Test
    void getRequestById_ARequesterWithoutANameIsShownByUsername() {
        alice.setFirstname("");
        alice.setLastname("");
        CollaborationRequest request = pendingRequest(7L, alice);
        when(requestRepository.findById(7L)).thenReturn(Optional.of(request));
        when(profileService.getCurrentUserProfile()).thenReturn(owner);

        assertEquals("alice", requestService.getRequestById(7L).getRequester().getDisplayName());
    }

    @Test
    void getRequestById_ForTheRequester_IsAllowed() {
        when(requestRepository.findById(8L)).thenReturn(Optional.of(pendingRequest(8L, alice)));
        when(profileService.getCurrentUserProfile()).thenReturn(alice);

        assertEquals(8L, requestService.getRequestById(8L).getId());
    }

    @Test
    void getRequestById_ForAnyoneElse_ThrowsAccessDenied() {
        when(requestRepository.findById(9L)).thenReturn(Optional.of(pendingRequest(9L, alice)));
        when(profileService.getCurrentUserProfile()).thenReturn(bob);

        assertThrows(AccessDeniedException.class, () -> requestService.getRequestById(9L));
    }

    @Test
    void createJoinRequest_AfterARejection_ReplacesTheOldRequest() {
        CollaborationRequest rejected = pendingRequest(10L, alice);
        rejected.setStatus(RequestStatus.REJECTED);
        when(profileService.getCurrentUserProfile()).thenReturn(alice);
        when(projectRepository.findById(project.getId())).thenReturn(Optional.of(project));
        when(requestRepository.findByProjectAndRequester(project, alice)).thenReturn(Optional.of(rejected));
        when(requestRepository.save(any(CollaborationRequest.class))).thenAnswer(inv -> inv.getArgument(0));

        CollaborationRequest result = requestService.createJoinRequest(project.getId(), "second try");

        verify(requestRepository).delete(rejected);
        assertEquals(RequestStatus.PENDING, result.getStatus());
        assertEquals("second try", result.getMessage());
    }

    @Test
    void createJoinRequest_AfterLeavingATeam_ReplacesTheStaleApprovedRequest() {
        CollaborationRequest stale = pendingRequest(11L, alice);
        stale.setStatus(RequestStatus.APPROVED);
        existingTeam(); // the team exists, but alice is no longer on it
        when(profileService.getCurrentUserProfile()).thenReturn(alice);
        when(projectRepository.findById(project.getId())).thenReturn(Optional.of(project));
        when(requestRepository.findByProjectAndRequester(project, alice)).thenReturn(Optional.of(stale));
        when(requestRepository.save(any(CollaborationRequest.class))).thenAnswer(inv -> inv.getArgument(0));

        CollaborationRequest result = requestService.createJoinRequest(project.getId(), "back again");

        verify(requestRepository).delete(stale);
        assertEquals(RequestStatus.PENDING, result.getStatus());
    }

    @Test
    void getRequestById_NamesTheProjectOwnerSoTheRequesterCanSeeWhoDecides() {
        CollaborationRequest request = pendingRequest(7L, alice);
        when(requestRepository.findById(7L)).thenReturn(Optional.of(request));
        when(profileService.getCurrentUserProfile()).thenReturn(alice);

        CollaborationRequestDTO dto = requestService.getRequestById(7L);

        assertEquals("owner", dto.getOwnerUsername());
        assertEquals("owner Test", dto.getOwnerDisplayName());
    }

    @Test
    void getRequestById_AnOwnerWithoutANameIsShownByUsername() {
        owner.setFirstname("");
        owner.setLastname("");
        CollaborationRequest request = pendingRequest(7L, alice);
        when(requestRepository.findById(7L)).thenReturn(Optional.of(request));
        when(profileService.getCurrentUserProfile()).thenReturn(alice);

        assertEquals("owner", requestService.getRequestById(7L).getOwnerDisplayName());
    }
}
