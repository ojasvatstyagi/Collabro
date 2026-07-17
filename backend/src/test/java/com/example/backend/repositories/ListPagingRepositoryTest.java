package com.example.backend.repositories;

import com.example.backend.enums.Proficiency;
import com.example.backend.enums.ProjectStatus;
import com.example.backend.enums.RequestStatus;
import com.example.backend.enums.TeamStatus;
import com.example.backend.models.CollaborationRequest;
import com.example.backend.models.Profile;
import com.example.backend.models.Project;
import com.example.backend.models.ProjectFile;
import com.example.backend.models.Skill;
import com.example.backend.models.SkillDefinition;
import com.example.backend.models.Task;
import com.example.backend.models.Team;
import com.example.backend.models.User;
import com.example.backend.utils.ListPaging;
import jakarta.persistence.EntityManagerFactory;
import org.hibernate.SessionFactory;
import org.hibernate.stat.Statistics;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;

import java.lang.reflect.Method;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.function.Function;

import static org.junit.jupiter.api.Assertions.*;

/**
 * The list endpoints page in the database: right rows per page, newest first, no row on two pages, the total for the
 * X-Total-Count header, and a number of queries that does not grow with the page size.
 */
@DataJpaTest(properties = "spring.jpa.properties.hibernate.generate_statistics=true")
class ListPagingRepositoryTest {

    @Autowired
    private TestEntityManager em;
    @Autowired
    private EntityManagerFactory entityManagerFactory;
    @Autowired
    private RequestRepository requestRepository;
    @Autowired
    private ProjectRepository projectRepository;
    @Autowired
    private TaskRepository taskRepository;
    @Autowired
    private ProjectFileRepository projectFileRepository;
    @Autowired
    private TeamRepository teamRepository;

    private int counter;

    private Profile profile(String username) {
        User user = new User();
        user.setUsername(username);
        user.setEmail(username + "@example.com");
        user.setPassword("x");
        em.persist(user);
        return em.persist(Profile.builder().user(user).firstname(username).lastname("T").build());
    }

    private Profile profileWithSkills(String username) {
        Profile profile = profile(username);
        for (int i = 0; i < 2; i++) {
            SkillDefinition definition = em.persist(SkillDefinition.builder().name("skill" + counter++).build());
            Skill skill = Skill.builder().definition(definition).proficiency(Proficiency.ADVANCED).profile(profile).build();
            profile.getSkills().add(skill);
            em.persist(skill);
        }
        return profile;
    }

    private Project project(Profile owner) {
        Project project = new Project();
        project.setTitle("p" + counter++);
        project.setCreatedBy(owner);
        project.setStatus(ProjectStatus.ACTIVE);
        project.setTechnologies(new ArrayList<>(List.of("Java", "React")));
        return em.persist(project);
    }

    private void requestsTo(Project project, int count) {
        for (int i = 0; i < count; i++) {
            CollaborationRequest request = new CollaborationRequest();
            request.setProject(project);
            request.setRequester(profileWithSkills("requester" + counter++));
            request.setStatus(i % 2 == 0 ? RequestStatus.PENDING : RequestStatus.APPROVED);
            em.persist(request);
        }
    }

    private Team teamOf(Project project, Profile owner, Profile... members) {
        Team team = new Team();
        team.setTeamName(project.getTitle() + " Team");
        team.setStatus(TeamStatus.ACTIVE);
        team.setCreatedBy(owner);
        team.setOwner(owner);
        team.setMembers(new ArrayList<>(List.of(members)));
        em.persist(team);
        project.setTeam(team);
        team.setProject(project);
        em.persist(project);
        return team;
    }

    private void reset() {
        em.flush();
        em.clear();
    }

    /** Walks every page of {@code query} and checks each row appears exactly once. */
    private <T, K> List<T> allPages(int size, Function<Pageable, Page<T>> query, Function<T, K> key, long expectedTotal) {
        List<T> seen = new ArrayList<>();
        Set<K> keys = new HashSet<>();
        int pages = 0;
        Page<T> page;
        do {
            page = query.apply(ListPaging.of(pages, size, ListPaging.newestFirst("createdAt")));
            assertEquals(expectedTotal, page.getTotalElements());
            assertTrue(page.getNumberOfElements() <= size);
            for (T row : page.getContent()) {
                assertTrue(keys.add(key.apply(row)), "a row appeared on two pages");
                seen.add(row);
            }
            pages++;
        } while (page.hasNext());
        assertEquals(expectedTotal, seen.size(), "a row appeared on no page");
        assertEquals((int) Math.ceil(expectedTotal / (double) size), pages);
        return seen;
    }

    private long statements(Runnable work) {
        Statistics statistics = entityManagerFactory.unwrap(SessionFactory.class).getStatistics();
        statistics.clear();
        work.run();
        return statistics.getPrepareStatementCount();
    }

    // ---- correctness ----

    @Test
    void receivedRequests_ArePagedNewestFirstWithTheStatusFilterAndATotal() {
        Profile owner = profile("owner");
        requestsTo(project(owner), 23);
        reset();
        Profile me = em.find(Profile.class, owner.getId());

        List<CollaborationRequest> all = allPages(10, p -> requestRepository.findByProjectOwner(me, p),
                CollaborationRequest::getId, 23);
        for (int i = 1; i < all.size(); i++) {
            assertTrue(all.get(i - 1).getId() > all.get(i).getId() || !all.get(i - 1).getCreatedAt().isBefore(all.get(i).getCreatedAt()),
                    "newest first");
        }
        long pending = 12; // i % 2 == 0 among 23
        List<CollaborationRequest> filtered = allPages(5, p -> requestRepository.findByProjectOwnerAndStatus(me, RequestStatus.PENDING, p),
                CollaborationRequest::getId, pending);
        assertTrue(filtered.stream().allMatch(r -> r.getStatus() == RequestStatus.PENDING));
    }

    @Test
    void sentRequests_ArePaged() {
        Profile owner = profile("owner");
        Profile requester = profileWithSkills("requester");
        for (int i = 0; i < 7; i++) {
            CollaborationRequest request = new CollaborationRequest();
            request.setProject(project(owner));
            request.setRequester(requester);
            request.setStatus(RequestStatus.PENDING);
            em.persist(request);
        }
        reset();
        Profile me = em.find(Profile.class, requester.getId());

        allPages(3, p -> requestRepository.findByRequester(me, p), CollaborationRequest::getId, 7);
        allPages(3, p -> requestRepository.findByRequesterAndStatus(me, RequestStatus.PENDING, p), CollaborationRequest::getId, 7);
    }

    @Test
    void projects_AreListedPagedForTheCreatorAndForMembers() {
        Profile owner = profile("owner");
        Profile member = profile("member");
        for (int i = 0; i < 9; i++) {
            Project project = project(owner);
            if (i < 4) {
                teamOf(project, owner, member);
            }
        }
        reset();

        allPages(4, p -> projectRepository.findByCreatedBy_Id(owner.getId(), p), Project::getId, 9);
        allPages(3, p -> projectRepository.findByTeam_Members_Id(member.getId(), p), Project::getId, 4);
    }

    @Test
    void tasksAndFiles_AreScopedToTheProjectAndPaged() {
        Profile owner = profile("owner");
        Project project = project(owner);
        Project other = project(owner);
        for (int i = 0; i < 6; i++) {
            Task task = new Task();
            task.setTitle("t" + i);
            task.setDeadline(LocalDateTime.now().plusDays(1));
            task.setProject(i < 5 ? project : other);
            em.persist(task);
            ProjectFile file = new ProjectFile();
            file.setFileName("f" + i);
            file.setFileUrl("u" + i);
            file.setProject(i < 5 ? project : other);
            file.setUploadedBy(owner);
            em.persist(file);
        }
        reset();

        allPages(2, p -> taskRepository.findByProjectId(project.getId(), p), Task::getId, 5);
        allPages(2, p -> projectFileRepository.findByProjectId(project.getId(), p), ProjectFile::getId, 5);
    }

    @Test
    void teams_AreThoseIOwnOrBelongTo_PagedWithoutDuplicatesAndSkipTeamsWithoutAProject() {
        Profile me = profile("me");
        Profile other = profile("other");
        Profile third = profile("third");
        for (int i = 0; i < 3; i++) {
            teamOf(project(me), me, other, third);   // I own it
        }
        for (int i = 0; i < 4; i++) {
            teamOf(project(other), other, me, third); // I am one of two members
        }
        teamOf(project(other), other, third);          // not mine
        Team orphan = new Team();                        // no project at all
        orphan.setStatus(TeamStatus.ACTIVE);
        orphan.setCreatedBy(me);
        orphan.setOwner(me);
        em.persist(orphan);
        reset();

        List<Team> mine = allPages(3, p -> teamRepository.pageActiveTeamsOf(me.getId(), TeamStatus.ACTIVE, p), Team::getId, 7);
        assertTrue(mine.stream().noneMatch(t -> t.getId().equals(orphan.getId())));
    }

    // ---- cost ----

    @Test
    void readingARequestsPage_NeedsTheSameNumberOfQueriesForThreeRowsOrTwentyFive() {
        Profile smallOwner = profile("small");
        requestsTo(project(smallOwner), 3);
        Profile bigOwner = profile("big");
        requestsTo(project(bigOwner), 25);
        reset();

        long few = statements(() -> readRequests(smallOwner, 3));
        reset();
        long many = statements(() -> readRequests(bigOwner, 25));

        assertEquals(few, many, "the number of queries must not grow with the page size");
        assertTrue(many <= 6, "expected a handful of queries, got " + many);
    }

    private void readRequests(Profile owner, int size) {
        Page<CollaborationRequest> page = requestRepository.findByProjectOwner(em.find(Profile.class, owner.getId()),
                ListPaging.of(0, size, ListPaging.newestFirst("createdAt")));
        assertEquals(size, page.getNumberOfElements());
        for (CollaborationRequest request : page) {
            request.getProject().getTitle();
            request.getProject().getCreatedBy().displayUsername();
            request.getRequester().displayUsername();
            request.getRequester().getSkills().forEach(Skill::getName);
        }
    }

    @Test
    void readingAProjectsPage_NeedsTheSameNumberOfQueriesForThreeRowsOrTwentyFive() {
        Profile small = profile("small");
        Profile big = profile("big");
        for (int i = 0; i < 3; i++) project(small);
        for (int i = 0; i < 25; i++) project(big);
        reset();

        long few = statements(() -> readProjects(small, 3));
        reset();
        long many = statements(() -> readProjects(big, 25));

        assertEquals(few, many, "the number of queries must not grow with the page size");
        assertTrue(many <= 6, "expected a handful of queries, got " + many);
    }

    private void readProjects(Profile owner, int size) {
        Page<Project> page = projectRepository.findByCreatedBy_Id(owner.getId(),
                ListPaging.of(0, size, ListPaging.newestFirst("createdAt")));
        assertEquals(size, page.getNumberOfElements());
        for (Project project : page) {
            project.getTechnologies().size();
            project.getCreatedBy().displayUsername();
            project.getCreatedBy().getProfilePictureUrl();
        }
    }

    @Test
    void pagedRequestQueriesNeverFetchACollection_BecauseHibernateWouldThenPageInMemory() {
        for (Method method : RequestRepository.class.getDeclaredMethods()) {
            if (!Page.class.isAssignableFrom(method.getReturnType())) {
                continue;
            }
            EntityGraph graph = method.getAnnotation(EntityGraph.class);
            if (graph != null) {
                assertTrue(Arrays.stream(graph.attributePaths()).noneMatch(path -> path.endsWith("skills") || path.contains("skills.")),
                        method.getName() + " must not fetch a collection in a paged query");
            }
        }
    }
}
