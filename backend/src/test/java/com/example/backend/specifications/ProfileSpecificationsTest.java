package com.example.backend.specifications;

import com.example.backend.dto.ProfileSearchCriteria;
import com.example.backend.enums.Proficiency;
import com.example.backend.models.Profile;
import com.example.backend.models.Skill;
import com.example.backend.models.SkillDefinition;
import com.example.backend.models.User;
import com.example.backend.repositories.ProfileRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.data.domain.PageRequest;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/** Runs the search specification against a real (in-memory) database: it used to fail when the query was built. */
@DataJpaTest
class ProfileSpecificationsTest {

    @Autowired
    private TestEntityManager em;
    @Autowired
    private ProfileRepository profileRepository;

    private final Map<String, SkillDefinition> definitions = new java.util.HashMap<>();

    @BeforeEach
    void setUp() {
        for (String name : List.of("Java", "React", "Python")) {
            definitions.put(name, em.persist(SkillDefinition.builder().name(name).build()));
        }
        // alice: Java (advanced) + React (beginner), Berlin, MIT
        profile("alice", "Berlin", "MIT", skill("Java", Proficiency.ADVANCED), skill("React", Proficiency.BEGINNER));
        // bob: Java (beginner), Paris
        profile("bob", "Paris", "Sorbonne", skill("Java", Proficiency.BEGINNER));
        // carol: Python (expert), Berlin
        profile("carol", "Berlin", "TU Berlin", skill("Python", Proficiency.EXPERT));
        // dave: no skills at all
        profile("dave", "Rome", null);
        em.flush();
        em.clear();
    }

    private Skill skill(String name, Proficiency proficiency) {
        return Skill.builder().definition(definitions.get(name)).proficiency(proficiency).build();
    }

    private void profile(String username, String location, String education, Skill... skills) {
        User user = new User();
        user.setUsername(username);
        user.setEmail(username + "@example.com");
        user.setPassword("x");
        em.persist(user);

        Profile profile = Profile.builder().user(user).firstname(username).lastname("Test")
                .location(location).education(education).build();
        for (Skill skill : skills) {
            skill.setProfile(profile);
            profile.getSkills().add(skill);
        }
        em.persist(profile);
    }

    private List<String> search(ProfileSearchCriteria criteria) {
        return profileRepository.findAll(ProfileSpecifications.withCriteria(criteria), PageRequest.of(0, 50))
                .map(profile -> profile.getFirstname())
                .getContent().stream().sorted().toList();
    }

    private ProfileSearchCriteria criteria() {
        return new ProfileSearchCriteria();
    }

    @Test
    void noCriteria_ReturnsEveryProfile() {
        assertEquals(List.of("alice", "bob", "carol", "dave"), search(criteria()));
    }

    @Test
    void skillFilter_MatchesBySkillName() {
        ProfileSearchCriteria c = criteria();
        c.setSkills(List.of("Python"));

        assertEquals(List.of("carol"), search(c));
    }

    @Test
    void skillFilter_IsCaseInsensitive() {
        ProfileSearchCriteria c = criteria();
        c.setSkills(List.of("jAvA"));

        assertEquals(List.of("alice", "bob"), search(c));
    }

    @Test
    void skillFilter_WithSeveralMatchingSkills_ListsTheProfileOnce() {
        ProfileSearchCriteria c = criteria();
        c.setSkills(List.of("Java", "React"));

        assertEquals(List.of("alice", "bob"), search(c));
    }

    @Test
    void skillFilter_CountsEachProfileOnceInThePageTotal() {
        ProfileSearchCriteria c = criteria();
        c.setSkills(List.of("Java", "React"));

        var page = profileRepository.findAll(ProfileSpecifications.withCriteria(c), PageRequest.of(0, 1));

        assertEquals(2, page.getTotalElements());
    }

    @Test
    void minProficiency_KeepsTheRequestedLevelAndAbove() {
        ProfileSearchCriteria c = criteria();
        c.setSkills(List.of("Java"));
        c.setMinProficiency(Proficiency.INTERMEDIATE);

        // Compared alphabetically "ADVANCED" < "INTERMEDIATE" would have dropped alice
        assertEquals(List.of("alice"), search(c));
    }

    @Test
    void minProficiency_OfExpert_ExcludesLowerLevels() {
        ProfileSearchCriteria c = criteria();
        c.setSkills(List.of("Java"));
        c.setMinProficiency(Proficiency.EXPERT);

        assertTrue(search(c).isEmpty());
    }

    @Test
    void minProficiency_AppliesToTheSameSkillThatMatched() {
        // alice is BEGINNER at React: she must not match "React at intermediate or better" via her Java level
        ProfileSearchCriteria c = criteria();
        c.setSkills(List.of("React"));
        c.setMinProficiency(Proficiency.INTERMEDIATE);

        assertTrue(search(c).isEmpty());
    }

    @Test
    void blankSkillNames_AreIgnored() {
        ProfileSearchCriteria c = criteria();
        c.setSkills(List.of(" ", ""));

        assertEquals(List.of("alice", "bob", "carol", "dave"), search(c));
    }

    @Test
    void locationAndEducation_FilterCaseInsensitively() {
        ProfileSearchCriteria byLocation = criteria();
        byLocation.setLocation("berlin");
        assertEquals(List.of("alice", "carol"), search(byLocation));

        ProfileSearchCriteria combined = criteria();
        combined.setLocation("berlin");
        combined.setEducation("mit");
        assertEquals(List.of("alice"), search(combined));
    }

    @Test
    void skillAndLocationFilters_Combine() {
        ProfileSearchCriteria c = criteria();
        c.setSkills(List.of("Java"));
        c.setLocation("Paris");

        assertEquals(List.of("bob"), search(c));
    }
}
