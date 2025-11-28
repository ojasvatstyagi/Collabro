package com.example.backend.dto;

import com.example.backend.enums.Proficiency;
import lombok.Data;
import java.util.List;

@Data
public class ProfileSearchCriteria {
    private List<String> skills; // Filter by skills (e.g., ["Java", "React"])
    private String education; // Filter by education (e.g., "MIT")
    private String location; // Filter by location (e.g., "New York")
    private Proficiency minProficiency; // Minimum skill level (e.g., Proficiency.INTERMEDIATE)
    private Integer minSharedSkills; // Minimum shared skills (e.g., 3)
}