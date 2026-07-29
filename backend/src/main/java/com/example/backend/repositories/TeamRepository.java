package com.example.backend.repositories;

import com.example.backend.enums.TeamStatus;
import com.example.backend.models.Team;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TeamRepository extends JpaRepository<Team, Long> {

    /** Teams the profile owns or is a member of, one page at a time; teams whose project is gone are left out by the inner join. */
    @Query(value = """
            SELECT t FROM Team t JOIN t.project p
            WHERE t.deletedAt IS NULL AND t.status = :status
              AND (t.owner.id = :profileId OR EXISTS (SELECT 1 FROM t.members m WHERE m.id = :profileId))
            """,
            countQuery = """
            SELECT COUNT(t) FROM Team t JOIN t.project p
            WHERE t.deletedAt IS NULL AND t.status = :status
              AND (t.owner.id = :profileId OR EXISTS (SELECT 1 FROM t.members m WHERE m.id = :profileId))
            """)
    Page<Team> pageActiveTeamsOf(@Param("profileId") UUID profileId, @Param("status") TeamStatus status, Pageable pageable);
}
