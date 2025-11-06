package com.example.backend.controllers;

import com.example.backend.dto.ProfileDto;
import com.example.backend.dto.ProfileSearchCriteria;
import com.example.backend.services.MatchingService;
import com.example.backend.services.ProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/matching")
@RequiredArgsConstructor
public class MatchingController {
    private final MatchingService matchingService;
    private final ProfileService profileService;

    // 1. Get similar profiles (skill-based)
    @GetMapping("/similar")
    public ResponseEntity<List<ProfileDto>> getSimilarProfiles() {
        UUID currentProfileId = profileService.getCurrentUserProfile().getId();
        return ResponseEntity.ok(matchingService.findSimilarProfiles(currentProfileId));
    }

    // 2. Get complementary profiles (for project teams)
    @GetMapping("/complementary")
    public ResponseEntity<List<ProfileDto>> getComplementaryProfiles() {
        UUID currentProfileId = profileService.getCurrentUserProfile().getId();
        return ResponseEntity.ok(matchingService.findComplementaryProfiles(currentProfileId));
    }

    // 3. Browse/search peers with filters
    @GetMapping("/search")
    public ResponseEntity<Page<ProfileDto>> searchProfiles(
            @ModelAttribute ProfileSearchCriteria criteria,
            Pageable pageable
    ) {
        return ResponseEntity.ok(matchingService.searchProfiles(criteria, pageable));
    }
}
