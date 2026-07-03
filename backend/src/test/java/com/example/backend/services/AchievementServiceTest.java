package com.example.backend.services;

import com.example.backend.dto.AchievementDto;
import com.example.backend.dto.AchievementOverviewDto;
import com.example.backend.enums.ProjectStatus;
import com.example.backend.enums.TaskStatus;
import com.example.backend.models.Profile;
import com.example.backend.models.Project;
import com.example.backend.models.Skill;
import com.example.backend.models.SkillDefinition;
import com.example.backend.models.Task;
import com.example.backend.repositories.ChatMessageRepository;
import com.example.backend.repositories.ProjectFileRepository;
import com.example.backend.repositories.ProjectRepository;
import com.example.backend.repositories.TaskRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

import static com.example.backend.services.ProjectTestData.profile;
import static com.example.backend.services.ProjectTestData.project;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AchievementServiceTest {

    @Mock
    private ProfileService profileService;
    @Mock
    private ProjectRepository projectRepository;
    @Mock
    private TaskRepository taskRepository;
    @Mock
    private ChatMessageRepository chatMessageRepository;
    @Mock
    private ProjectFileRepository projectFileRepository;

    @InjectMocks
    private AchievementService achievementService;

    private Profile me;

    @BeforeEach
    void setUp() {
        me = profile("me");
        lenient().when(profileService.getCurrentUserProfile()).thenReturn(me);
    }

    private Map<String, AchievementDto> badges() {
        return achievementService.getMyAchievements().getAchievements().stream()
                .collect(Collectors.toMap(AchievementDto::getId, Function.identity()));
    }

    private void completedTasks(int count) {
        when(taskRepository.findByAssignedToIdAndStatus(me.getId(), TaskStatus.COMPLETED))
                .thenReturn(IntStream.range(0, count).mapToObj(i -> new Task()).toList());
    }

    private void skills(int count) {
        for (int i = 0; i < count; i++) {
            me.getSkills().add(Skill.builder().definition(SkillDefinition.builder().name("s" + i).build()).build());
        }
    }

    @Test
    void aNewUser_HasNothingUnlockedAndStartsAtLevelOne() {
        AchievementOverviewDto overview = achievementService.getMyAchievements();

        assertTrue(overview.getAchievements().stream().noneMatch(AchievementDto::isUnlocked));
        assertEquals(0, overview.getStats().getBadgesEarned());
        assertEquals(0, overview.getStats().getTotalPoints());
        assertEquals(1, overview.getStats().getLevel());
        assertEquals("Newcomer", overview.getStats().getRank());
        assertEquals(AchievementService.CATALOG.size(), overview.getStats().getTotalBadges());
    }

    @Test
    void badges_UnlockAtTheirThresholdAndShowProgressTowardsTheNext() {
        when(projectRepository.findByCreatedBy_Id(me.getId())).thenReturn(List.of(project(me), project(me)));
        completedTasks(3);

        Map<String, AchievementDto> badges = badges();

        assertTrue(badges.get("first_idea").isUnlocked());
        assertFalse(badges.get("builder").isUnlocked());
        assertEquals(2, badges.get("builder").getProgress().getCurrent());
        assertEquals(5, badges.get("builder").getProgress().getRequired());
        assertTrue(badges.get("task_starter").isUnlocked());
        assertFalse(badges.get("task_master").isUnlocked());
        assertEquals(3, badges.get("task_master").getProgress().getCurrent());
    }

    @Test
    void progress_NeverExceedsWhatTheBadgeRequires() {
        completedTasks(60);

        AchievementDto master = badges().get("task_master");

        assertTrue(master.isUnlocked());
        assertEquals(25, master.getProgress().getCurrent());
    }

    @Test
    void points_AddUpIntoLevelsAndRanks() {
        // task_master 60 + task_starter 10 + skilled 10 + polyglot 35 = 115 points
        completedTasks(30);
        skills(10);

        AchievementOverviewDto.Stats stats = achievementService.getMyAchievements().getStats();

        assertEquals(115, stats.getTotalPoints());
        assertEquals(2, stats.getLevel());
        assertEquals("Contributor", stats.getRank());
        assertEquals(15, stats.getExperience().getCurrent());
        assertEquals(100, stats.getExperience().getRequired());
        assertEquals(4, stats.getBadgesEarned());
    }

    @Test
    void leadingATeam_CountsTheOwnerAsAMember() {
        Project led = project(me, profile("a"), profile("b"));
        when(projectRepository.findByCreatedBy_Id(me.getId())).thenReturn(List.of(led));

        Map<String, AchievementDto> badges = badges();

        assertTrue(badges.get("team_leader").isUnlocked());
        assertFalse(badges.get("big_team").isUnlocked());
        assertEquals(3, badges.get("big_team").getProgress().getCurrent());
    }

    @Test
    void completingAProject_UnlocksFinisher() {
        Project done = project(me);
        done.setStatus(ProjectStatus.COMPLETED);
        when(projectRepository.findByCreatedBy_Id(me.getId())).thenReturn(List.of(done, project(me)));

        assertTrue(badges().get("finisher").isUnlocked());
        assertEquals(1, achievementService.getMyAchievements().getStats().getProjectsCompleted());
    }

    @Test
    void joiningTeamsMessagesFilesAndProfile_AreCounted() {
        when(projectRepository.findByTeam_Members_Id(me.getId()))
                .thenReturn(List.of(project(profile("x")), project(profile("y")), project(profile("z"))));
        when(chatMessageRepository.countBySenderId(me.getId())).thenReturn(50L);
        when(projectFileRepository.countByUploadedById(me.getId())).thenReturn(4L);
        me.setProfileComplete(true);

        Map<String, AchievementDto> badges = badges();

        assertTrue(badges.get("collaborator").isUnlocked());
        assertTrue(badges.get("communicator").isUnlocked());
        assertFalse(badges.get("file_sharer").isUnlocked());
        assertEquals(4, badges.get("file_sharer").getProgress().getCurrent());
        assertTrue(badges.get("profile_pro").isUnlocked());
    }

    @Test
    void theCatalog_HasUniqueIdsAndSaneThresholds() {
        Set<String> ids = AchievementService.CATALOG.stream().map(AchievementService.Badge::id)
                .collect(Collectors.toSet());

        assertEquals(AchievementService.CATALOG.size(), ids.size());
        assertTrue(AchievementService.CATALOG.stream().allMatch(b -> b.required() >= 1 && b.points() > 0));
        assertTrue(Collections.disjoint(ids, Set.of("")));
    }

    @Test
    void ranks_GrowWithLevel() {
        assertEquals("Newcomer", AchievementService.rank(1));
        assertEquals("Contributor", AchievementService.rank(2));
        assertEquals("Collaborator", AchievementService.rank(4));
        assertEquals("Veteran", AchievementService.rank(7));
    }
}
