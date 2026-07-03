package com.example.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AchievementOverviewDto {
    private Stats stats;
    private List<AchievementDto> achievements;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Stats {
        private int projectsCompleted;
        private int projectsCreated;
        private int collaborations;
        private int tasksCompleted;
        private int badgesEarned;
        private int totalBadges;
        private int totalPoints;
        private int level;
        private String rank;
        /** Points into the current level and the points the next level needs. */
        private AchievementDto.Progress experience;
    }
}
