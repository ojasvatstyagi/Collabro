package com.example.backend.configuration;

import com.example.backend.enums.RoleName;
import com.example.backend.models.Role;
import com.example.backend.repositories.RoleRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class DataInitializer {

    @Bean
    public CommandLineRunner initData(RoleRepository roleRepository) {
        return args -> {
            if (roleRepository.findByRoleName(RoleName.ROLE_USER).isEmpty()) {
                Role userRole = new Role();
                userRole.setRoleName(RoleName.ROLE_USER);
                roleRepository.save(userRole);
            }

            if (roleRepository.findByRoleName(RoleName.ROLE_ADMIN).isEmpty()) {
                Role adminRole = new Role();
                adminRole.setRoleName(RoleName.ROLE_ADMIN);
                roleRepository.save(adminRole);
            }
        };
    }
}
