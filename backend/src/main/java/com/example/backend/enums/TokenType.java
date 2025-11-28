package com.example.backend.enums;

public enum TokenType {
    PASSWORD_RESET("Password Reset"),
    EMAIL_VERIFICATION("Email Verification");

    private final String displayName;

    TokenType(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}