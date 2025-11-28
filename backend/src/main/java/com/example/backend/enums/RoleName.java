package com.example.backend.enums;

public enum RoleName {
    ROLE_USER("User"),
    ROLE_ADMIN("Admin");

    private final String displayName;

    RoleName(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
