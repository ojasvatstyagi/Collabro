package com.example.backend.repositories;

import com.example.backend.enums.TeamStatus;
import com.example.backend.models.Team;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TeamRepository extends JpaRepository<Team, Long> {

    /** Teams the profile owns or is a member of. */
    @Query("""
            SELECT DISTINCT t FROM Team t LEFT JOIN t.members m
            WHERE t.deletedAt IS NULL AND t.status = :status
              AND (t.owner.id = :profileId OR m.id = :profileId)
            """)
    List<Team> findActiveTeamsOf(@Param("profileId") UUID profileId, @Param("status") TeamStatus status);
}
