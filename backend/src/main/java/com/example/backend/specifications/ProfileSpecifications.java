package com.example.backend.specifications;

import com.example.backend.dto.ProfileSearchCriteria;
import com.example.backend.enums.Proficiency;
import com.example.backend.models.Profile;
import com.example.backend.models.Skill;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

public class ProfileSpecifications {

    public static Specification<Profile> withCriteria(ProfileSearchCriteria criteria) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Profiles of deleted accounts are never listed
            predicates.add(cb.isNull(root.get("deletedAt")));

            // Skill filter. The skill's name lives on its definition (Skill.getName() is only a derived getter),
            // and is matched case-insensitively through the normalized name.
            List<String> normalizedNames = criteria.getSkills() == null ? List.of()
                    : criteria.getSkills().stream()
                            .filter(name -> name != null && !name.isBlank())
                            .map(name -> name.trim().toLowerCase())
                            .toList();
            if (!normalizedNames.isEmpty()) {
                Join<Profile, Skill> skillJoin = root.join("skills");
                predicates.add(skillJoin.get("definition").get("normalizedName").in(normalizedNames));

                // Proficiency is stored as text, so comparing it with >= would be alphabetical
                // ("ADVANCED" < "BEGINNER"). Match the levels at or above the minimum instead.
                if (criteria.getMinProficiency() != null) {
                    predicates.add(skillJoin.get("proficiency").in(levelsFrom(criteria.getMinProficiency())));
                }
                // A profile with several matching skills would otherwise appear once per skill
                query.distinct(true);
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

    private static List<Proficiency> levelsFrom(Proficiency minimum) {
        return Arrays.stream(Proficiency.values())
                .filter(level -> level.ordinal() >= minimum.ordinal())
                .toList();
    }
}
