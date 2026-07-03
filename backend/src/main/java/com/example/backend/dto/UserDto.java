package com.example.backend.dto;

import com.example.backend.enums.RoleName;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class UserDto {
    private java.util.UUID id;
    private String username;
    private String email;
    // Explicit JSON names: without them Jackson would publish these as "verified" / "profileComplete"
    @JsonProperty("isVerified")
    private boolean verified = false;
    private RoleName role;

    // Profile fields
    private String firstname;
    private String lastname;
    private String profilePictureUrl;
    @JsonProperty("isProfileComplete")
    private boolean profileComplete;
}
