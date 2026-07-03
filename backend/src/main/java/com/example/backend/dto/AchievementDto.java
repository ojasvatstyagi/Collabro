package com.example.backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AchievementDto {
    private String id;
    private String name;
    private String description;
    /** projects, collaborations, leadership, skills or badges. */
    private String category;
    /** A lucide icon name the frontend maps to a component. */
    private String icon;
    /** common, rare, epic or legendary. */
    private String rarity;
    private int points;
    @JsonProperty("isUnlocked")
    private boolean unlocked;
    private Progress progress;
    private List<String> requirements;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Progress {
        private int current;
        private int required;
    }
}
