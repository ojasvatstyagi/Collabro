package com.example.backend.services;

import com.example.backend.enums.TokenType;
import com.example.backend.models.PasswordToken;
import com.example.backend.models.Profile;
import com.example.backend.models.User;
import com.example.backend.repositories.PasswordTokenRepository;
import com.example.backend.repositories.ProfileRepository;
import com.example.backend.repositories.UserRepository;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Duration;
import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;

/** Against a real (H2) database: the rows really go, the names really become free, and nothing else is touched. */
@DataJpaTest
@Import({ AccountCleanupService.class, AccountCleanupJob.class })
class AccountCleanupIntegrationTest {

    @Autowired
    private TestEntityManager em;
    @Autowired
    private EntityManager entityManager;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private ProfileRepository profileRepository;
    @Autowired
    private PasswordTokenRepository passwordTokenRepository;
    @Autowired
    private AccountCleanupService service;
    @Autowired
    private AccountCleanupJob job;
    @MockitoBean
    private FileStorageService fileStorageService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(job, "enabled", true);
        ReflectionTestUtils.setField(job, "unverifiedAfter", Duration.ofDays(7));
        ReflectionTestUtils.setField(job, "codesAfter", Duration.ofDays(1));
    }

    private User account(String name, boolean verified, LocalDateTime registered) {
        User user = new User();
        user.setUsername(name);
        user.setEmail(name + "@example.com");
        user.setPassword("x");
        user.setVerified(verified);
        em.persist(user);
        em.persist(Profile.builder().user(user).firstname(name).lastname("T").build());
        PasswordToken token = new PasswordToken();
        token.setEmail(user.getEmail());
        token.setOtp("123456");
        token.setTokenType(TokenType.EMAIL_VERIFICATION);
        token.setCreatedAt(LocalDateTime.now());
        token.setExpiryTime(LocalDateTime.now().plusMinutes(10));
        passwordTokenRepository.save(token);
        em.flush();
        user.setCreatedAt(registered); // @CreationTimestamp stamps "now"; the column is updatable for exactly this
        em.flush();
        em.clear();
        return user;
    }

    private long count(String table) {
        return ((Number) entityManager.createNativeQuery("select count(*) from " + table).getSingleResult()).longValue();
    }

    private long countWhere(String table, String where) {
        return ((Number) entityManager.createNativeQuery("select count(*) from " + table + " where " + where).getSingleResult()).longValue();
    }

    @Test
    void anOldUnverifiedAccountIsReallyDeleted_WithItsProfileAndCodes_AndItsNameBecomesFree() {
        account("stale", false, LocalDateTime.now().minusDays(8));

        int removed = job.removeUnverifiedAccounts();

        assertEquals(1, removed);
        assertEquals(0, count("users"), "a soft delete would leave the row and keep the unique name taken");
        assertEquals(0, count("profiles"));
        assertEquals(0, count("password_tokens"));
        // the whole point: the same username and e-mail can register again
        account("stale", false, LocalDateTime.now());
        assertEquals(1, count("users"));
    }

    @Test
    void recentUnverifiedVerifiedAndAgeUnknownAccountsAreLeftAlone() {
        account("recent", false, LocalDateTime.now().minusDays(2));
        account("verified_old", true, LocalDateTime.now().minusDays(400));
        account("legacy", false, null); // registered before the column existed: age unknown, never guessed

        assertEquals(0, job.removeUnverifiedAccounts());

        assertEquals(3, count("users"));
        assertEquals(3, count("profiles"));
    }

    @Test
    void onlyTheStaleOnesGoWhenThereIsAMix() {
        account("stale1", false, LocalDateTime.now().minusDays(30));
        account("stale2", false, LocalDateTime.now().minusDays(8));
        account("fresh", false, LocalDateTime.now().minusHours(3));
        account("member", true, LocalDateTime.now().minusDays(30));

        assertEquals(2, job.removeUnverifiedAccounts());

        assertEquals(2, count("users"));
        assertEquals(1, countWhere("users", "username = 'fresh'"));
        assertEquals(1, countWhere("users", "username = 'member'"));
        assertEquals(2, count("profiles"));
    }

    @Test
    void anAccountVerifiedAfterItWasSelectedIsNotDeletedAndKeepsItsProfile() {
        User stale = account("racer", false, LocalDateTime.now().minusDays(10));
        // the selection was made, then the person verified before the delete ran
        User loaded = userRepository.findByUsername("racer").orElseThrow();
        loaded.setVerified(true);
        userRepository.saveAndFlush(loaded);

        assertFalse(service.purge(stale));

        assertEquals(1, count("users"));
        assertEquals(1, count("profiles"), "a verified user must keep their profile");
        assertEquals(1, count("password_tokens"));
    }

    @Test
    void moreAccountsThanOneBatchAreAllRemoved() {
        int total = AccountCleanupService.BATCH + 5;
        for (int i = 0; i < total; i++) {
            account("bulk" + i, false, LocalDateTime.now().minusDays(9));
        }

        assertEquals(total, job.removeUnverifiedAccounts());
        assertEquals(0, count("users"));
    }

    @Test
    void oldExpiredCodesAreRemovedButRecentAndLiveOnesStay() {
        saveCode("old@example.com", LocalDateTime.now().minusDays(3));
        saveCode("yesterdayish@example.com", LocalDateTime.now().minusHours(2));
        saveCode("live@example.com", LocalDateTime.now().plusMinutes(5));
        em.flush();

        int removed = service.purgeOldCodes(Duration.ofDays(1));

        assertEquals(1, removed);
        assertEquals(2, count("password_tokens"));
    }

    private void saveCode(String email, LocalDateTime expires) {
        PasswordToken token = new PasswordToken();
        token.setEmail(email);
        token.setOtp("111111");
        token.setTokenType(TokenType.PASSWORD_RESET);
        token.setCreatedAt(expires.minusMinutes(10));
        token.setExpiryTime(expires);
        passwordTokenRepository.save(token);
    }

    @Test
    void theJobDoesNothingWhenSwitchedOff() {
        account("stale", false, LocalDateTime.now().minusDays(30));
        ReflectionTestUtils.setField(job, "enabled", false);

        job.run();

        assertEquals(1, count("users"));
    }

    private Profile profileWithPicture(String name, String picture, LocalDateTime deletedAt) {
        Profile profile = Profile.builder().firstname(name).lastname("T").profilePictureUrl(picture).deletedAt(deletedAt).build();
        em.persist(profile);
        em.flush();
        em.clear();
        return profile;
    }

    @Test
    void thePicturesOfDeletedAccountsAreRemovedFromDiskAndForgotten_OthersAreLeftAlone() {
        Profile deleted = profileWithPicture("gone", "profile-pictures/gone.png", LocalDateTime.now().minusDays(40));
        Profile live = profileWithPicture("live", "profile-pictures/live.png", null);

        int removed = service.purgeDeletedProfilePictures();
        em.flush();
        em.clear();

        assertEquals(1, removed);
        org.mockito.Mockito.verify(fileStorageService).deleteFile("profile-pictures/gone.png");
        org.mockito.Mockito.verify(fileStorageService, org.mockito.Mockito.never()).deleteFile("profile-pictures/live.png");
        assertNull(profileRepository.findById(deleted.getId()).orElseThrow().getProfilePictureUrl());
        assertEquals("profile-pictures/live.png", profileRepository.findById(live.getId()).orElseThrow().getProfilePictureUrl());
    }

    @Test
    void aPictureThatCannotBeRemovedKeepsItsPathSoTheNextRunTriesAgain() {
        Profile stuck = profileWithPicture("stuck", "profile-pictures/stuck.png", LocalDateTime.now().minusDays(2));
        org.mockito.Mockito.doThrow(new com.example.backend.exceptions.StorageException("disk", new RuntimeException()))
                .when(fileStorageService).deleteFile("profile-pictures/stuck.png");

        assertEquals(0, service.purgeDeletedProfilePictures());
        em.flush();
        em.clear();

        assertEquals("profile-pictures/stuck.png", profileRepository.findById(stuck.getId()).orElseThrow().getProfilePictureUrl());

        org.mockito.Mockito.doNothing().when(fileStorageService).deleteFile("profile-pictures/stuck.png");
        assertEquals(1, service.purgeDeletedProfilePictures());
    }

    @Test
    void theScheduledRunAlsoClearsDeletedPictures() {
        profileWithPicture("gone", "profile-pictures/gone.png", LocalDateTime.now().minusDays(40));

        job.run();

        org.mockito.Mockito.verify(fileStorageService).deleteFile("profile-pictures/gone.png");
    }
}
