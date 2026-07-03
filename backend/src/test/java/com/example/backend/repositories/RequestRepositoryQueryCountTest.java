package com.example.backend.repositories;

import com.example.backend.enums.Proficiency;
import com.example.backend.enums.ProjectStatus;
import com.example.backend.enums.RequestStatus;
import com.example.backend.models.CollaborationRequest;
import com.example.backend.models.Profile;
import com.example.backend.models.Project;
import com.example.backend.models.Skill;
import com.example.backend.models.SkillDefinition;
import com.example.backend.models.User;
import jakarta.persistence.EntityManagerFactory;
import org.hibernate.SessionFactory;
import org.hibernate.stat.Statistics;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/** Listing requests used to run extra queries for every row (requester, user, skills, project, owner). */
@DataJpaTest(properties = "spring.jpa.properties.hibernate.generate_statistics=true")
class RequestRepositoryQueryCountTest {

    @Autowired
    private TestEntityManager em;
    @Autowired
    private RequestRepository requestRepository;
    @Autowired
    private EntityManagerFactory entityManagerFactory;

    private int usernameCounter;
    private SkillDefinition java;

    private Profile profile(String username) {
        User user = new User();
        user.setUsername(username);
        user.setEmail(username + "@example.com");
        user.setPassword("x");
        em.persist(user);
        return em.persist(Profile.builder().user(user).firstname(username).lastname("T").build());
    }

    private Project projectWithRequests(String ownerName, int requesters) {
        Profile owner = profile(ownerName);
        Project project = new Project();
        project.setTitle("p-" + ownerName);
        project.setCreatedBy(owner);
        project.setStatus(ProjectStatus.ACTIVE);
        em.persist(project);
        for (int i = 0; i < requesters; i++) {
            Profile requester = profile("user" + usernameCounter++);
            for (String name : List.of("a", "b")) {
                SkillDefinition definition = em.persist(SkillDefinition.builder().name(name + usernameCounter).build());
                Skill skill = Skill.builder().definition(definition).proficiency(Proficiency.ADVANCED)
                        .profile(requester).build();
                requester.getSkills().add(skill);
                em.persist(skill);
            }
            CollaborationRequest request = new CollaborationRequest();
            request.setProject(project);
            request.setRequester(requester);
            request.setStatus(RequestStatus.PENDING);
            em.persist(request);
        }
        return project;
    }

    /** Statements needed to list and fully read (as the DTO mapping does) the requests received by an owner. */
    private long statementsToReadAll(Profile owner) {
        em.flush();
        em.clear();
        Statistics statistics = entityManagerFactory.unwrap(SessionFactory.class).getStatistics();
        statistics.clear();

        List<CollaborationRequest> requests = requestRepository.findByProjectOwner(em.find(Profile.class, owner.getId()));
        for (CollaborationRequest request : requests) {
            request.getProject().getTitle();
            request.getProject().getCreatedBy().displayUsername();
            request.getRequester().displayUsername();
            request.getRequester().getSkills().forEach(Skill::getName);
        }
        return statistics.getPrepareStatementCount();
    }

    @Test
    void readingRequests_NeedsTheSameNumberOfQueriesWhetherThereAreThreeOrTwentyFive() {
        Project few = projectWithRequests("ownerFew", 3);
        Project many = projectWithRequests("ownerMany", 25);

        long statementsForThree = statementsToReadAll(few.getCreatedBy());
        long statementsForTwentyFive = statementsToReadAll(many.getCreatedBy());

        assertEquals(statementsForThree, statementsForTwentyFive,
                "the number of queries must not grow with the number of requests");
        assertTrue(statementsForTwentyFive <= 3, "expected a handful of queries, got " + statementsForTwentyFive);
    }

    @Test
    void theRequestsAreStillAllReturned_WithEachSkillOnce() {
        Project project = projectWithRequests("owner", 5);
        em.flush();
        em.clear();

        List<CollaborationRequest> requests = requestRepository.findByProjectOwner(
                em.find(Profile.class, project.getCreatedBy().getId()));

        assertEquals(5, requests.size());
        assertTrue(requests.stream().allMatch(r -> r.getRequester().getSkills().size() == 2));
    }
}
