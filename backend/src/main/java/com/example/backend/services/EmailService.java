package com.example.backend.services;

import com.example.backend.utils.EmailTemplates;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {
    private final JavaMailSender mailSender;

    private void sendHtmlEmail(String to, String subject, String htmlContent) {
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
    public void sendWelcomeEmail(String to, String username) {
        String subject = "Welcome to Our Service!";
        String html = EmailTemplates.welcomeTemplate(username);
        sendHtmlEmail(to, subject, html);
    }

    // OTP Email
    public void sendOtpEmail(String to, String otp) {
        String subject = "Your Password Reset OTP";
        String html = EmailTemplates.otpTemplate(otp);
        sendHtmlEmail(to, subject, html);
    }

    // Password Reset Success Email
    public void sendPasswordResetSuccessEmail(String to) {
        String subject = "Password Reset Successful";
        String html = EmailTemplates.passwordResetSuccessTemplate();
        sendHtmlEmail(to, subject, html);
    }

    // Project Status Email
    public void sendProjectStatusEmail(String to, String project, String status) {
        String subject = "Project Status Update";
        String html = EmailTemplates.projectStatusTemplate(project, status);
        sendHtmlEmail(to, subject, html);
    }
}