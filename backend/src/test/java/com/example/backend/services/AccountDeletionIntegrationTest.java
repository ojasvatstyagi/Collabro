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
    @Autowired
    private com.example.backend.repositories.PasswordTokenRepository passwordTokenRepository;

    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
    private final FileStorageService fileStorageService = org.mockito.Mockito.mock(FileStorageService.class);
    private AccountService accountService;
    private User alice;
    private Profile aliceProfile;
    private Project aliceProject;

    @BeforeEach
    void setUp() {
        accountService = new AccountService(userRepository, profileRepository, refreshTokenRepository, passwordTokenRepository, fileStorageService, encoder);

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
    void aDeletedUsersUsernameAndEmail_CanBeRegisteredAgain() {
        deleteAlice();

        // Before the rename the unique columns still held both, and this insert failed with a constraint violation
        User again = persistUser("alice");
        em.flush();
        em.clear();

        assertEquals(again.getId(), userRepository.findByUsername("alice").orElseThrow().getId());
        assertEquals(again.getId(), userRepository.findByEmail("alice@example.com").orElseThrow().getId());
    }

    @Test
    void theSameNameCanBeUsedAndDeletedOverAndOver() {
        deleteAlice();
        User second = persistUser("alice");
        em.flush();
        em.clear();

        accountService.deleteAccount(userRepository.findById(second.getId()).orElseThrow(), "secret-pass");
        em.flush();
        em.clear();

        User third = persistUser("alice");
        em.flush(); // two earlier lives of "alice" are in the table, each under a name of its own
        em.clear();
        assertEquals(third.getId(), userRepository.findByUsername("alice").orElseThrow().getId());
    }

    @Test
    void deletingAnAccount_RemovesTheOneTimeCodesOfItsAddress() {
        com.example.backend.models.PasswordToken code = new com.example.backend.models.PasswordToken();
        code.setEmail("alice@example.com");
        code.setOtp("123456");
        code.setTokenType(com.example.backend.enums.TokenType.PASSWORD_RESET);
        code.setCreatedAt(LocalDateTime.now());
        code.setExpiryTime(LocalDateTime.now().plusMinutes(10));
        passwordTokenRepository.save(code);
        em.flush();
        em.clear();

        deleteAlice();

        assertEquals(0, passwordTokenRepository.count(),
                "a code left behind would make a fresh registration of this address wait out the resend cooldown");
    }

    private long count(String table) {
        return ((Number) em.getEntityManager().createNativeQuery("select count(*) from " + table).getSingleResult()).longValue();
    }

    @Test
    void deletingAnAccount_ErasesTheProfileDetailsAndTheRowsHangingOffIt_ButNotSomeoneElses() {
        // alice and bob each have a skill, a social link, an interest and personal details
        for (Profile profile : List.of(em.find(Profile.class, aliceProfile.getId()),
                em.find(Profile.class, em.getEntityManager()
                        .createQuery("select p.id from Profile p where p.firstname = 'bob'", java.util.UUID.class).getSingleResult()))) {
            com.example.backend.models.SkillDefinition definition = em.persist(com.example.backend.models.SkillDefinition.builder()
                    .name("skill-" + profile.getFirstname()).build());
            em.persist(com.example.backend.models.Skill.builder().definition(definition)
                    .proficiency(com.example.backend.enums.Proficiency.ADVANCED).profile(profile).build());
            com.example.backend.models.SocialLink link = new com.example.backend.models.SocialLink();
            link.setPlatform(com.example.backend.enums.SocialPlatform.values()[0]);
            link.setUrl("https://example.com/" + profile.getFirstname());
            link.setProfile(profile);
            em.persist(link);
            profile.setBio("bio of " + profile.getFirstname());
            profile.setPhone("12345");
            profile.setLocation("Somewhere");
            profile.getProjectInterests().add("AI");
        }
        em.flush();
        em.clear();
        assertEquals(2, count("skills"));
        assertEquals(2, count("social_links"));
        assertEquals(2, count("profile_project_interests"));

        deleteAlice();

        Profile erased = profileRepository.findById(aliceProfile.getId()).orElseThrow();
        assertEquals("Deleted", erased.getFirstname());
        assertEquals("User", erased.getLastname());
        assertNull(erased.getBio());
        assertNull(erased.getPhone());
        assertNull(erased.getLocation());
        assertNotNull(erased.getDeletedAt());
        assertEquals(1, count("skills"), "only alice's skill goes");
        assertEquals(1, count("social_links"));
        assertEquals(1, count("profile_project_interests"));
        Profile bob = profileRepository.findAll().stream().filter(p -> "bob".equals(p.getFirstname())).findFirst().orElseThrow();
        assertEquals("bio of bob", bob.getBio());
        assertEquals("12345", bob.getPhone());
        assertEquals(1, bob.getSkills().size());
        // and what she contributed to the project is still there
        assertEquals(1L, em.getEntityManager().createQuery("select count(m) from ChatMessage m", Long.class).getSingleResult());
    }

    @Test
    void deletingAnAccount_DeletesItsPictureFile() {
        Profile profile = em.find(Profile.class, aliceProfile.getId());
        profile.setProfilePictureUrl("profile-pictures/alice.png");
        em.flush();
        em.clear();

        deleteAlice();

        org.mockito.Mockito.verify(fileStorageService).deleteFile("profile-pictures/alice.png");
        assertNull(profileRepository.findById(aliceProfile.getId()).orElseThrow().getProfilePictureUrl());
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
