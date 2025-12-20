package com.example.backend.services;

import com.example.backend.utils.EmailTemplates;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {
    private final JavaMailSender mailSender;

    void sendHtmlEmail(@NonNull String to, @NonNull String subject, @NonNull String htmlContent) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlContent, true); // true = isHtml
            mailSender.send(message);
        } catch (Exception e) {
            log.atError().setCause(e).log("Error sending email");
        }
    }

    // Welcome Email
    public void sendWelcomeEmail(@NonNull String to, @NonNull String username) {
        String subject = "Welcome to Our Service!";
        String html = EmailTemplates.welcomeTemplate(username);
        sendHtmlEmail(to, subject, html);
    }

    // OTP Email
    public void sendOtpEmail(@NonNull String to, @NonNull String otp) {
        String subject = "Your Password Reset OTP";
        String html = EmailTemplates.otpTemplate(otp);
        sendHtmlEmail(to, subject, html);
    }

    public void sendRegistrationOtpEmail(@NonNull String to, @NonNull String otp) {
        String subject = "Verify Your Email Address";
        String html = EmailTemplates.registrationOtpTemplate(otp);
        sendHtmlEmail(to, subject, html);
    }

    // Password Reset Success Email
    public void sendPasswordResetSuccessEmail(@NonNull String to) {
        String subject = "Password Reset Successful";
        String html = EmailTemplates.passwordResetSuccessTemplate();
        sendHtmlEmail(to, subject, html);
    }

    // Project Status Email
    public void sendProjectStatusEmail(@NonNull String to, @NonNull String project, @NonNull String status) {
        String subject = "Project Status Update";
        String html = EmailTemplates.projectStatusTemplate(project, status);
        sendHtmlEmail(to, subject, html);
    }
}