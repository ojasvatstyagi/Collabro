package com.example.backend.repositories.specifications;

import com.example.backend.enums.ProjectLevel;
import com.example.backend.models.Project;
import org.springframework.data.jpa.domain.Specification;

import java.util.List;

public class ProjectSpecification {

    public static Specification<Project> withDynamicQuery(String search, ProjectLevel level, List<String> technologies) {
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
            
            // Technology filtering can be added here if needed, requires Join
            
            return spec.toPredicate(root, query, cb);
        };
    }
}
