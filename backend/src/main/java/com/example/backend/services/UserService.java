package com.example.backend.services;

import com.example.backend.dtos.RegisterRequest;
import com.example.backend.enums.RoleName;
import com.example.backend.models.Role;
import com.example.backend.models.User;
import com.example.backend.repositories.RoleRepository;
import com.example.backend.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;

    public Optional<User> findUserByUsername(String username) {
        return userRepository.findByUsername(username);
    }

    public Optional<User> findUserByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    public User saveUser(RegisterRequest req) {
        User user = new User();
        user.setUsername(req.getUsername());
        user.setEmail(req.getEmail());
        user.setPassword(req.getPassword());

        // Find ROLE_USER or throw error if not present
        Role role = roleRepository.findByRoleName(RoleName.ROLE_USER)
                .orElseThrow(() -> new RuntimeException("Default role not found"));
        user.setRole(role);

        return userRepository.save(user);
    }
}
