package com.example.backend.dto;

import com.example.backend.enums.Proficiency;
import com.example.backend.models.Profile;
import com.example.backend.models.Skill;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.Predicate;
import lombok.Data;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;

@Data
public class ProfileSearchCriteria {
    private List<String> skills;       // Filter by skills (e.g., ["Java", "React"])
    private String education;          // Filter by education (e.g., "MIT")
    private String location;           // Filter by location (e.g., "New York")
    private Proficiency minProficiency; // Minimum skill level (e.g., Proficiency.INTERMEDIATE)
    private Integer minSharedSkills;    // Minimum shared skills (e.g., 3)

    // Converts criteria to a JPA Specification (for dynamic queries)
    public Specification<Profile> toSpecification() {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Skill filter
            if (skills != null && !skills.isEmpty()) {
                Join<Profile, Skill> skillJoin = root.join("skills");
                predicates.add(skillJoin.get("name").in(skills));

                // Proficiency filter
                if (minProficiency != null) {
                    predicates.add(cb.greaterThanOrEqualTo(
                            skillJoin.get("proficiency"),
                            minProficiency
                    ));
                }
            }

            // Education filter
            if (education != null && !education.isBlank()) {
                predicates.add(cb.like(
                        cb.lower(root.get("education")),
                        "%" + education.toLowerCase() + "%"
                ));
            }

            // Location filter
            if (location != null && !location.isBlank()) {
                predicates.add(cb.like(
                        cb.lower(root.get("location")),
                        "%" + location.toLowerCase() + "%"
                ));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
