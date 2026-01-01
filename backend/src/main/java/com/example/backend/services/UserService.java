package com.example.backend.services;

import com.example.backend.dto.RegisterRequest;
import com.example.backend.enums.RoleName;
import com.example.backend.models.User;
import com.example.backend.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import java.util.Objects;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final com.example.backend.repositories.RoleRepository roleRepository;
    private final ModelMapper modelMapper;

    public Optional<User> findUserByUsername(String username) {
        return userRepository.findByUsername(username);
    }

    public Optional<User> findUserByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    public User saveUser(RegisterRequest req) {
        User user = modelMapper.map(req, User.class);
        com.example.backend.models.Role role = roleRepository.findByRoleName(RoleName.ROLE_USER)
                .orElseThrow(() -> new RuntimeException("Role not found: ROLE_USER"));
        user.setRole(role);

        return userRepository.save(Objects.requireNonNull(user));
    }

    public User updateUser(User user) {
        return userRepository.save(Objects.requireNonNull(user));
    }

    public User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()
                || "anonymousUser".equals(authentication.getPrincipal())) {
            throw new com.example.backend.exceptions.UnauthorizedException("User is not authenticated");
        }

        String username;
        Object principal = authentication.getPrincipal();

        if (principal instanceof UserDetails user) {
            username = user.getUsername();
        } else {
            username = principal.toString();
        }

        return userRepository.findByUsername(username)
                .orElseThrow(() -> new com.example.backend.exceptions.UnauthorizedException("User not found"));
    }

    public void deleteUser(User user) {
        userRepository.delete(Objects.requireNonNull(user));
    }
}
