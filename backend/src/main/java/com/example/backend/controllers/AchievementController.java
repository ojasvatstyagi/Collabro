package com.example.backend.controllers;

import com.example.backend.dto.AchievementOverviewDto;
import com.example.backend.services.AchievementService;
import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/achievements")
@RequiredArgsConstructor
public class AchievementController {

    private final AchievementService achievementService;

    @GetMapping("/me")
    @Operation(summary = "Get my achievements", description = "Every badge with the user's progress, plus level and totals")
    public ResponseEntity<AchievementOverviewDto> getMyAchievements() {
        return ResponseEntity.ok(achievementService.getMyAchievements());
    }
}
