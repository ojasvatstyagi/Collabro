package com.example.backend.enums;

public enum SocialPlatform {
    LINKEDIN("LinkedIn"),
    GITHUB("GitHub"),
    TWITTER("Twitter"),
    FACEBOOK("Facebook"),
    INSTAGRAM("Instagram");

    private final String displayName;

    SocialPlatform(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
