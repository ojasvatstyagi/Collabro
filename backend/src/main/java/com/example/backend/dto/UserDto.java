package com.example.backend.dto;

import com.example.backend.enums.RoleName;
import lombok.Data;

@Data
public class UserDto {
    private java.util.UUID id;
    private String username;
    private String email;
    private boolean isVerified = false;
    private RoleName role;

    // Profile fields
    private String firstname;
    private String lastname;
    private String profilePictureUrl;
    private boolean isProfileComplete;
}
