package com.example.backend.controllers;

import com.example.backend.dto.ProfileDto;
import com.example.backend.dto.ProfileSearchCriteria;
import com.example.backend.services.MatchingService;
import com.example.backend.services.ProfileService;
import io.swagger.v3.oas.annotations.Operation;
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

    @GetMapping("/similar")
    @Operation(summary = "Get similar profiles", description = "Returns a list of similar profiles based on the current user's skills")
    public ResponseEntity<List<ProfileDto>> getSimilarProfiles() {
        UUID currentProfileId = profileService.getCurrentUserProfile().getId();
        return ResponseEntity.ok(matchingService.findSimilarProfiles(currentProfileId));
    }

    @GetMapping("/complementary")
    @Operation(summary = "Get complementary profiles", description = "Returns a list of complementary profiles based on the current user's skills")
    public ResponseEntity<List<ProfileDto>> getComplementaryProfiles() {
        UUID currentProfileId = profileService.getCurrentUserProfile().getId();
        return ResponseEntity.ok(matchingService.findComplementaryProfiles(currentProfileId));
    }

    @GetMapping("/search")
    @Operation(summary = "Search for profiles", description = "Searches for profiles based on the provided criteria like location, education")
    public ResponseEntity<Page<ProfileDto>> searchProfiles(
            @ModelAttribute ProfileSearchCriteria criteria,
            Pageable pageable
    ) {
        return ResponseEntity.ok(matchingService.searchProfiles(criteria, pageable));
    }
}
