package com.example.backend.specifications;

import com.example.backend.enums.ProjectLevel;
import com.example.backend.models.Project;
import org.springframework.data.jpa.domain.Specification;

import java.util.List;

public class ProjectSpecification {

    public static Specification<Project> withDynamicQuery(String search, ProjectLevel level, List<String> technologies, String category) {
        return (root, query, cb) -> {
            Specification<Project> spec = Specification.where(null);

            if (search != null && !search.isEmpty()) {
                String searchPattern = "%" + search.toLowerCase() + "%";
                Specification<Project> searchSpec = (r, q, c) -> c.or(
                        c.like(c.lower(r.get("title")), searchPattern),
                        c.like(c.lower(r.get("description")), searchPattern)
                        // Note: searching within element collection (technologies) is harder with simple 'like', usually requires join.
                        // For simplicity, we search title/desc first.
                );
                spec = spec.and(searchSpec);
            }

            if (level != null) {
                spec = spec.and((r, q, c) -> c.equal(r.get("level"), level));
            }

            if (category != null && !category.isEmpty()) {
                spec = spec.and((r, q, c) -> c.equal(r.get("category"), category));
            }
            
            if (technologies != null && !technologies.isEmpty()) {
                // We want projects that contain ANY of the given technologies
                // or ALL? Usually filtering implies "contains at least one" or "contains all".
                // Note: Distinct is important when joining to avoid duplicate results
                if (query != null) query.distinct(true);
                
                jakarta.persistence.criteria.Join<Project, String> techJoin = root.join("technologies");
                spec = spec.and((r, q, c) -> techJoin.in(technologies));
            }
            
            return spec.toPredicate(root, query, cb);
        };
    }
}
