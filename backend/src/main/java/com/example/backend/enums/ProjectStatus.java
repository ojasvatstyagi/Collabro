package com.example.backend.enums;

public enum ProjectStatus {
    ACTIVE("Active"),
    COMPLETED("Completed"),
    CANCELLED("Cancelled");

    private final String displayName;

    ProjectStatus(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}