package com.example.backend.enums;

public enum PostStatus {
    POSTED("Posted"),
    DROPPED("Dropped"),
    CLOSED("Closed");

    private final String displayName;

    PostStatus(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
