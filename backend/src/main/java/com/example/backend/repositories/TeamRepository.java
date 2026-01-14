package com.example.backend.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.backend.models.Team;

@Repository
public interface TeamRepository extends JpaRepository<Team, Long> {
    
}
