package com.example.backend.services;

import com.example.backend.dto.AchievementDto;
import com.example.backend.enums.Proficiency;
import com.example.backend.enums.ProjectStatus;
import com.example.backend.enums.TaskStatus;
import com.example.backend.enums.TeamStatus;
import com.example.backend.models.Profile;
import com.example.backend.models.Project;
import com.example.backend.models.Skill;
import com.example.backend.models.SkillDefinition;
import com.example.backend.models.Task;
import com.example.backend.models.Team;
import com.example.backend.models.User;
import jakarta.persistence.EntityManagerFactory;
import org.hibernate.SessionFactory;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

/** The badge counts against a real database, and what measuring them costs. */
@DataJpaTest(properties = "spring.jpa.properties.hibernate.generate_statistics=true")
@Import(AchievementService.class)
class AchievementIntegrationTest {

    @Autowired
    private TestEntityManager em;
    @Autowired
    private EntityManagerFactory entityManagerFactory;
    @Autowired
    private AchievementService achievementService;
    @MockitoBean
    private ProfileService profileService;

    private int counter;

    private Profile person(String name) {
        User user = new User();
        user.setUsername(name);
        user.setEmail(name + "@example.com");
        user.setPassword("x");
        em.persist(user);
        return em.persist(Profile.builder().user(user).firstname(name).lastname("T").build());
    }

    private Project project(Profile owner, ProjectStatus status, Profile... teamMembers) {
        Project project = new Project();
        project.setTitle("p" + counter++);
        project.setCreatedBy(owner);
        project.setStatus(status);
        if (teamMembers.length > 0) {
            Team team = new Team();
            team.setTeamName("t" + counter);
            team.setStatus(TeamStatus.ACTIVE);
            team.setCreatedBy(owner);
            team.setOwner(owner);
            team.setMembers(new ArrayList<>(List.of(teamMembers)));
            em.persist(team);
            project.setTeam(team);
        }
        return em.persist(project);
    }

    private void completedTasks(Project project, Profile assignee, int count, TaskStatus status) {
        for (int i = 0; i < count; i++) {
            Task task = new Task();
            task.setTitle("t" + counter++);
            task.setDeadline(LocalDateTime.now().plusDays(1));
            task.setStatus(status);
            task.setProject(project);
            task.setAssignedTo(assignee);
            em.persist(task);
        }
    }

    private void skills(Profile profile, int count) {
        for (int i = 0; i < count; i++) {
            SkillDefinition definition = em.persist(SkillDefinition.builder().name("skill" + counter++).build());
            em.persist(Skill.builder().definition(definition).proficiency(Proficiency.ADVANCED).profile(profile).build());
        }
    }

    private Map<String, AchievementDto> badgesOf(Profile profile) {
        em.flush();
        em.clear();
        when(profileService.getCurrentUserProfile()).thenReturn(em.find(Profile.class, profile.getId()));
        return achievementService.getMyAchievements().getAchievements().stream()
                .collect(Collectors.toMap(AchievementDto::getId, Function.identity()));
    }

    @Test
    void theCountsMatchWhatTheDatabaseHolds() {
        Profile me = person("me");
        Profile a = person("a");
        Profile b = person("b");
        Profile c = person("c");
        Profile d = person("d");
        // I own: one without a team, one with two members, one with four (so the largest is 4 + me = 5), one completed
        Project noTeam = project(me, ProjectStatus.ACTIVE);
        project(me, ProjectStatus.ACTIVE, a, b);
        Project big = project(me, ProjectStatus.ACTIVE, a, b, c, d);
        project(me, ProjectStatus.COMPLETED);
        // and I am a member of two other people's teams
        project(a, ProjectStatus.ACTIVE, me);
        project(b, ProjectStatus.ACTIVE, me, c);
        project(c, ProjectStatus.ACTIVE, a, b); // not mine
        completedTasks(big, me, 4, TaskStatus.COMPLETED);
        completedTasks(big, me, 3, TaskStatus.PENDING);   // not completed
        completedTasks(big, a, 9, TaskStatus.COMPLETED);  // not mine
        skills(me, 3);
        skills(a, 7);                                      // not mine
        assertNotNull(noTeam.getId());

        Map<String, AchievementDto> badges = badgesOf(me);

        assertEquals(4, badges.get("builder").getProgress().getCurrent());       // projects created (needs 5)
        assertFalse(badges.get("builder").isUnlocked());
        assertTrue(badges.get("finisher").isUnlocked());                          // one completed
        assertEquals(2, badges.get("collaborator").getProgress().getCurrent());  // teams joined (needs 3)
        assertEquals(5, badges.get("big_team").getProgress().getCurrent());      // largest team 4 members + me (needs 6)
        assertTrue(badges.get("team_leader").isUnlocked());
        assertEquals(4, badges.get("task_master").getProgress().getCurrent());   // completed tasks (needs 25)
        assertTrue(badges.get("task_starter").isUnlocked());
        assertTrue(badges.get("skilled").isUnlocked());                           // 3 skills
        assertEquals(3, badges.get("polyglot").getProgress().getCurrent());
    }

    @Test
    void aProfileWithNoTeamsAtAllHasNoLargestTeam() {
        Profile me = person("me");
        project(me, ProjectStatus.ACTIVE);

        Map<String, AchievementDto> badges = badgesOf(me);

        assertEquals(0, badges.get("team_leader").getProgress().getCurrent());
    }

    private long statements(Profile profile) {
        em.flush();
        em.clear();
        when(profileService.getCurrentUserProfile()).thenReturn(em.find(Profile.class, profile.getId()));
        var statistics = entityManagerFactory.unwrap(SessionFactory.class).getStatistics();
        statistics.clear();
        achievementService.getMyAchievements();
        return statistics.getPrepareStatementCount();
    }

    @Test
    void measuringTheBadgesCostsTheSameNumberOfQueriesForAQuietAccountAndABusyOne() {
        Profile quiet = person("quiet");
        project(quiet, ProjectStatus.ACTIVE);
        Profile busy = person("busy");
        Profile member = person("member");
        for (int i = 0; i < 40; i++) {
            Project p = project(busy, i % 4 == 0 ? ProjectStatus.COMPLETED : ProjectStatus.ACTIVE, member, person("m" + i));
            completedTasks(p, busy, 5, TaskStatus.COMPLETED);
            project(member, ProjectStatus.ACTIVE, busy);
        }
        skills(busy, 25);

        long quietQueries = statements(quiet);
        long busyQueries = statements(busy);

        assertEquals(quietQueries, busyQueries, "measuring must not cost more queries on a busy account");
        assertTrue(busyQueries <= 9, "expected one count per metric, got " + busyQueries);
    }
}
