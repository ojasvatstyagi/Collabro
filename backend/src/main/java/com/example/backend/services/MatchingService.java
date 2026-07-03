package com.example.backend.services;

import com.example.backend.dto.ProfileSearchCriteria;
import com.example.backend.dto.PublicProfileDto;
import com.example.backend.exceptions.ResourceNotFoundException;
import com.example.backend.models.Profile;
import com.example.backend.models.Skill;
import com.example.backend.repositories.ProfileRepository;
import com.example.backend.specifications.ProfileSpecifications;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MatchingService {

    /** Suggestions are a shortlist, not a listing: never return more than this many. */
    static final int MAX_SUGGESTIONS = 50;

    private final ProfileRepository profileRepository;
    private final ProfileService profileService;

    public List<PublicProfileDto> findSimilarProfiles(@NonNull UUID profileId) {
        List<String> userSkills = getSkills(profileId);
        if (userSkills.isEmpty()) {
            return List.of();
        }
        return toShortlist(profileRepository.findProfilesWithMatchingSkills(userSkills, profileId));
    }

    public List<PublicProfileDto> findComplementaryProfiles(@NonNull UUID profileId) {
        List<String> userSkills = getSkills(profileId);
        // "Skills you lack" is meaningless without a skill set to compare against (and NOT IN () is invalid SQL)
        if (userSkills.isEmpty()) {
            return List.of();
        }
        return toShortlist(profileRepository.findProfilesWithComplementarySkills(userSkills, profileId));
    }

    // Filterable search
    public Page<PublicProfileDto> searchProfiles(@NonNull ProfileSearchCriteria criteria, @NonNull Pageable pageable) {
        Page<Profile> profiles = profileRepository.findAll(ProfileSpecifications.withCriteria(criteria), pageable);
        return profiles.map(profileService::toPublicDto);
    }

    private List<PublicProfileDto> toShortlist(List<Profile> profiles) {
        return profiles.stream()
                .limit(MAX_SUGGESTIONS)
                .map(profileService::toPublicDto)
                .toList();
    }

    private List<String> getSkills(@NonNull UUID profileId) {
        Profile profile = profileRepository.findById(profileId)
                .orElseThrow(() -> new ResourceNotFoundException("Profile not found"));

        return profile.getSkills().stream()
                .map(Skill::getName)
                .toList();
    }
}
