package com.example.backend.services;

import com.example.backend.dto.ProfileSearchCriteria;
import com.example.backend.dto.PublicProfileDto;
import com.example.backend.enums.Proficiency;
import com.example.backend.exceptions.ResourceNotFoundException;
import com.example.backend.models.Profile;
import com.example.backend.models.Skill;
import com.example.backend.models.SkillDefinition;
import com.example.backend.repositories.ProfileRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.IntStream;

import static com.example.backend.services.ProjectTestData.profile;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MatchingServiceTest {

    @Mock
    private ProfileRepository profileRepository;
    @Mock
    private ProfileService profileService;

    @InjectMocks
    private MatchingService matchingService;

    private Profile me;

    @BeforeEach
    void setUp() {
        me = profile("me");
    }

    private void iKnow(String... skillNames) {
        for (String name : skillNames) {
            me.getSkills().add(Skill.builder()
                    .definition(SkillDefinition.builder().name(name).build())
                    .proficiency(Proficiency.ADVANCED)
                    .build());
        }
        when(profileRepository.findById(me.getId())).thenReturn(Optional.of(me));
    }

    private List<Profile> others(int count) {
        return new ArrayList<>(IntStream.range(0, count).mapToObj(i -> profile("other" + i)).toList());
    }

    @Test
    void findSimilarProfiles_QueriesBySkillNameAndMapsToPublicDtos() {
        iKnow("Java", "React");
        Profile match = profile("match");
        PublicProfileDto dto = PublicProfileDto.builder().username("match").build();
        when(profileRepository.findProfilesWithMatchingSkills(List.of("Java", "React"), me.getId()))
                .thenReturn(List.of(match));
        when(profileService.toPublicDto(match)).thenReturn(dto);

        assertEquals(List.of(dto), matchingService.findSimilarProfiles(me.getId()));
    }

    @Test
    void findSimilarProfiles_ForAUserWithoutSkills_ReturnsNothingWithoutQuerying() {
        iKnow();

        assertTrue(matchingService.findSimilarProfiles(me.getId()).isEmpty());

        verify(profileRepository, never()).findProfilesWithMatchingSkills(anyList(), any());
    }

    @Test
    void findComplementaryProfiles_ForAUserWithoutSkills_ReturnsNothingWithoutQuerying() {
        iKnow();

        assertTrue(matchingService.findComplementaryProfiles(me.getId()).isEmpty());

        verify(profileRepository, never()).findProfilesWithComplementarySkills(anyList(), any());
    }

    @Test
    void suggestions_AreCappedAtAShortlist() {
        iKnow("Java");
        when(profileRepository.findProfilesWithComplementarySkills(List.of("Java"), me.getId()))
                .thenReturn(others(MatchingService.MAX_SUGGESTIONS + 25));
        when(profileService.toPublicDto(any(Profile.class))).thenReturn(new PublicProfileDto());

        assertEquals(MatchingService.MAX_SUGGESTIONS, matchingService.findComplementaryProfiles(me.getId()).size());
    }

    @Test
    void findSimilarProfiles_ForAnUnknownProfile_Throws() {
        UUID unknown = UUID.randomUUID();

        assertThrows(ResourceNotFoundException.class, () -> matchingService.findSimilarProfiles(unknown));
    }

    @Test
    void searchProfiles_ReturnsPublicDtos() {
        Pageable pageable = PageRequest.of(0, 10);
        Profile found = profile("found");
        PublicProfileDto dto = PublicProfileDto.builder().username("found").build();
        when(profileRepository.findAll(any(Specification.class), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(found), pageable, 1));
        when(profileService.toPublicDto(found)).thenReturn(dto);

        Page<PublicProfileDto> page = matchingService.searchProfiles(new ProfileSearchCriteria(), pageable);

        assertEquals(List.of(dto), page.getContent());
    }
}
