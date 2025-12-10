package com.example.backend.specifications;

import com.example.backend.dto.ProfileSearchCriteria;
import com.example.backend.models.Profile;
import com.example.backend.models.Skill;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;

public class ProfileSpecifications {

    public static Specification<Profile> withCriteria(ProfileSearchCriteria criteria) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Skill filter
            if (criteria.getSkills() != null && !criteria.getSkills().isEmpty()) {
                Join<Profile, Skill> skillJoin = root.join("skills");
                predicates.add(skillJoin.get("name").in(criteria.getSkills()));

                // Proficiency filter
                if (criteria.getMinProficiency() != null) {
                    predicates.add(cb.greaterThanOrEqualTo(
                            skillJoin.get("proficiency"),
                            criteria.getMinProficiency()));
                }
            }

            // Education filter
            if (criteria.getEducation() != null && !criteria.getEducation().isBlank()) {
                predicates.add(cb.like(
                        cb.lower(root.get("education")),
                        "%" + criteria.getEducation().toLowerCase() + "%"));
            }

            // Location filter
            if (criteria.getLocation() != null && !criteria.getLocation().isBlank()) {
                predicates.add(cb.like(
                        cb.lower(root.get("location")),
                        "%" + criteria.getLocation().toLowerCase() + "%"));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
