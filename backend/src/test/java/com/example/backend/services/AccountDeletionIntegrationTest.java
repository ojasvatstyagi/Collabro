package com.example.backend.services;

import com.example.backend.dto.ProfileSearchCriteria;
import com.example.backend.models.ChatMessage;
import com.example.backend.models.Profile;
import com.example.backend.models.Project;
import com.example.backend.models.RefreshToken;
import com.example.backend.models.User;
import com.example.backend.repositories.ProfileRepository;
import com.example.backend.repositories.ProjectRepository;
import com.example.backend.repositories.RefreshTokenRepository;
import com.example.backend.repositories.UserRepository;
import com.example.backend.specifications.ProfileSpecifications;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Account deletion against a real database. Deleting the user row would cascade through the profile into the
 * user's projects and every message or task that references it, so the account is deactivated instead.
 */
@DataJpaTest
class AccountDeletionIntegrationTest {

    @Autowired
    private TestEntityManager em;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private ProfileRepository profileRepository;
    @Autowired
    private ProjectRepository projectRepository;
    @Autowired
    private RefreshTokenRepository refreshTokenRepository;

    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
    private AccountService accountService;
    private User alice;
    private Profile aliceProfile;
    private Project aliceProject;

    @BeforeEach
    void setUp() {
        accountService = new AccountService(userRepository, profileRepository, refreshTokenRepository, encoder);

        alice = persistUser("alice");
        aliceProfile = persistProfile(alice);
        User bob = persistUser("bob");
        Profile bobProfile = persistProfile(bob);

        aliceProject = new Project();
        aliceProject.setTitle("Alice's project");
        aliceProject.setCreatedBy(aliceProfile);
        aliceProject.setStatus(com.example.backend.enums.ProjectStatus.ACTIVE);
        em.persist(aliceProject);

        // Something that references alice's profile and would block a hard delete
        ChatMessage message = new ChatMessage();
        message.setContent("hello");
        message.setProject(aliceProject);
        message.setSender(aliceProfile);
        em.persist(message);

        RefreshToken session = RefreshToken.builder().token("hash").user(alice)
                .expiryDate(LocalDateTime.now().plusDays(1)).build();
        em.persist(session);
        em.flush();
        em.clear();
        assertNotNull(bobProfile.getId());
    }

    private User persistUser(String username) {
        User user = new User();
        user.setUsername(username);
        user.setEmail(username + "@example.com");
        user.setPassword(encoder.encode("secret-pass"));
        return em.persist(user);
    }

    private Profile persistProfile(User user) {
        return em.persist(Profile.builder().user(user).firstname(user.getUsername()).lastname("Test").build());
    }

    private void deleteAlice() {
        accountService.deleteAccount(userRepository.findById(alice.getId()).orElseThrow(), "secret-pass");
        em.flush();
        em.clear();
    }

    @Test
    void aDeletedUser_CanNoLongerBeFoundSoCannotLogIn() {
        deleteAlice();

        assertTrue(userRepository.findByUsername("alice").isEmpty());
        assertTrue(userRepository.findByEmail("alice@example.com").isEmpty());
        assertTrue(userRepository.findByUsername("bob").isPresent());
    }

    @Test
    void deletingAnAccount_EndsItsSessions() {
        deleteAlice();

        assertTrue(refreshTokenRepository.findByToken("hash").isEmpty());
    }

    @Test
    void deletingAnAccount_DoesNotCascadeIntoItsProjectsOrMessages() {
        deleteAlice();

        assertTrue(projectRepository.findById(aliceProject.getId()).isPresent(), "the project must survive");
        assertEquals(1L, em.getEntityManager()
                .createQuery("select count(m) from ChatMessage m", Long.class).getSingleResult());
    }

    @Test
    void aProjectWhoseOwnerWasDeleted_CanStillBeLoadedAndDisplayed() {
        deleteAlice();

        Project project = projectRepository.findById(aliceProject.getId()).orElseThrow();

        assertDoesNotThrow(() -> project.getCreatedBy().displayUsername());
        assertEquals("deleted user", project.getCreatedBy().displayUsername());
    }

    @Test
    void aDeletedProfile_IsNotListedInSearch() {
        deleteAlice();

        List<String> found = profileRepository
                .findAll(ProfileSpecifications.withCriteria(new ProfileSearchCriteria()), PageRequest.of(0, 20))
                .map(Profile::getFirstname).getContent();

        assertEquals(List.of("bob"), found);
    }
}
