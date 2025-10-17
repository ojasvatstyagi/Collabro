package com.example.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProfileStatusDto {
    private boolean isComplete;
    private int completionPercentage;
    private List<String> missingFields;
    private String message;

    // Optional: Add a constructor without message for backward compatibility
    public ProfileStatusDto(boolean isComplete, int completionPercentage, List<String> missingFields) {
        this(isComplete, completionPercentage, missingFields, null);
    }

    // Helper method to create a status DTO with a message
    public static ProfileStatusDto withMessage(boolean isComplete, int completionPercentage,
                                               List<String> missingFields, String message) {
        return new ProfileStatusDto(isComplete, completionPercentage, missingFields, message);
    }
}