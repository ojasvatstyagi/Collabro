package com.example.backend.enums;

public enum TeamStatus {
    ACTIVE("Active"),
    DISBANDED("Disbanded");

    private final String displayName;

    TeamStatus(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}