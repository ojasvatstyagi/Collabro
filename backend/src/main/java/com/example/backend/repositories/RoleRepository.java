package com.example.backend.repositories;

import com.example.backend.enums.RoleName;
import com.example.backend.models.Role;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RoleRepository extends JpaRepository<Role, Integer> {
    Role findByRoleName(RoleName roleName);
}
