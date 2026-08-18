package com.example.backend.repositories;

import com.example.backend.models.LoginFailure;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface LoginFailureRepository extends JpaRepository<LoginFailure, Long> {

    /** The times of the newest failures for a key after the given moment, newest first (the page limits how many). */
    @Query("SELECT f.attemptedAt FROM LoginFailure f WHERE f.throttleKey = :key AND f.attemptedAt > :after ORDER BY f.attemptedAt DESC, f.id DESC")
    List<LocalDateTime> newestSince(@Param("key") String key, @Param("after") LocalDateTime after, Pageable limit);

    @Modifying
    @Transactional
    @Query("DELETE FROM LoginFailure f WHERE f.throttleKey = :key")
    int deleteAllForKey(@Param("key") String key);

    @Modifying
    @Transactional
    @Query("DELETE FROM LoginFailure f WHERE f.attemptedAt < :before")
    int deleteOlderThan(@Param("before") LocalDateTime before);
}
