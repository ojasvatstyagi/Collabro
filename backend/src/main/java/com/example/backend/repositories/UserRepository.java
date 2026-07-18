package com.example.backend.repositories;

import com.example.backend.models.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByUsername(String username);
    Optional<User> findByEmail(String email);

    /** Accounts that registered before the cutoff and never verified their address (oldest first, one batch). */
    @org.springframework.data.jpa.repository.Query("SELECT u FROM User u WHERE u.isVerified = false AND u.createdAt < :cutoff ORDER BY u.createdAt")
    java.util.List<User> findUnverifiedCreatedBefore(@org.springframework.data.repository.query.Param("cutoff") java.time.LocalDateTime cutoff,
            org.springframework.data.domain.Pageable batch);

    /**
     * A real DELETE. {@code delete(user)} would only soft-delete (the entity's @SQLDelete), which leaves the unique
     * username and e-mail occupied, the very thing the cleanup of unverified accounts exists to release.
     */
    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query(value = "DELETE FROM users WHERE id = :id AND is_verified = false", nativeQuery = true)
    int hardDeleteUnverified(@org.springframework.data.repository.query.Param("id") java.util.UUID id);
}
