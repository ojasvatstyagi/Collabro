package com.example.backend.enums;

public enum Proficiency {
    BEGINNER("Beginner"),
    INTERMEDIATE("Intermediate"),
    ADVANCED("Advanced"),
    EXPERT("Expert");

    private final String displayName;

    Proficiency(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}