package com.example.backend.enums;

public enum PostType {
    IDEA("Idea"),
    PROJECT_RECRUITMENT("Project Recruitment"),
    MENTORSHIP("Mentorship"),
    COLLABORATION("Collaboration");

    private final String displayName;

    PostType(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
