package com.example.backend.utils;

public class EmailTemplates {
    public static String welcomeTemplate(String username) {
        return "<html><body style='font-family:sans-serif;'>"
                + "<h2 style='color:#4CAF50;'>Welcome to Our Service, " + username + "!</h2>"
                + "<p>We're excited to have you on board.</p>"
                + "<hr><small>&copy; 2025 YourBrand</small></body></html>";
    }

    public static String otpTemplate(String otp) {
        return "<html><body style='font-family:sans-serif;'>"
                + "<h2 style='color:#2196F3;'>Password Reset OTP</h2>"
                + "<p>Your OTP is: <b style='font-size:1.5em;'>" + otp + "</b></p>"
                + "<p>This code is valid for 10 minutes.</p>"
                + "<hr><small>&copy; 2025 YourBrand</small></body></html>";
    }

    public static String passwordResetSuccessTemplate() {
        return "<html><body style='font-family:sans-serif;'>"
                + "<h2 style='color:#4CAF50;'>Password Reset Successful</h2>"
                + "<p>Your password has been updated successfully.</p>"
                + "<hr><small>&copy; 2025 YourBrand</small></body></html>";
    }

    public static String projectStatusTemplate(String project, String status) {
        return "<html><body style='font-family:sans-serif;'>"
                + "<h2 style='color:#FF9800;'>Project Status Update</h2>"
                + "<p>Project: <b>" + project + "</b></p>"
                + "<p>Status: <b>" + status + "</b></p>"
                + "<hr><small>&copy; 2025 YourBrand</small></body></html>";
    }
}