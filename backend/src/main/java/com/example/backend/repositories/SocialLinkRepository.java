package com.example.backend.repositories;

import com.example.backend.models.Profile;
import com.example.backend.models.SocialLink;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SocialLinkRepository extends JpaRepository<SocialLink, UUID> {
    List<SocialLink> findByProfile(Profile profile);

    Optional<SocialLink> findByIdAndProfile(UUID id, Profile profile);
}
