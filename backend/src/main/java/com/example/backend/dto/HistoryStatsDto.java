package com.example.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HistoryStatsDto {
    private int totalActivities;
    private int projectsCreated;
    private int collaborationsJoined;
    private int tasksCompleted;
    private int thisWeek;
    private int thisMonth;
}
