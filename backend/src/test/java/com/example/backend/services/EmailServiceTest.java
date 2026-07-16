package com.example.backend.services;

import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.MailSendException;
import org.springframework.mail.javamail.JavaMailSender;

import static org.mockito.Mockito.*;

import java.util.Objects;

@ExtendWith(MockitoExtension.class)
class EmailServiceTest {

    @Mock
    private JavaMailSender mailSender;

    @InjectMocks
    private EmailService emailService;

    @Test
    void sendHtmlEmail_ShouldSendEmailSuccessfully() throws Exception {
        // Arrange
        MimeMessage mimeMessage = mock(MimeMessage.class);
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);

        // Act (for testing make sendHtmlEmail public)
        emailService.sendHtmlEmail("test@example.com", "Test Subject", "<p>Test Content</p>");

        // Assert
        verify(mailSender).send(Objects.requireNonNull(mimeMessage));
    }

    @Test
    void sendHtmlEmail_ShouldLogErrorOnException() throws Exception {
        // Arrange
        MimeMessage mimeMessage = mock(MimeMessage.class);
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);
        doThrow(new MailSendException("Test Exception")).when(mailSender).send(Objects.requireNonNull(mimeMessage));

        // Act (for testing make sendHtmlEmail public)
        emailService.sendHtmlEmail("test@example.com", "Test Subject", "<p>Test Content</p>");

        // Assert
        verify(mailSender).send(mimeMessage);
        // Verify error is logged - you'll need to set up a logger mock for this
    }

    @Test
    void sendOtpEmail_ShouldCallSendHtmlEmail() {
        // Arrange
        MimeMessage mimeMessage = mock(MimeMessage.class);
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);

        // Act
        emailService.sendOtpEmail("test@example.com", "123456");

        // Assert
        verify(mailSender).send(Objects.requireNonNull(mimeMessage));
    }

    @org.junit.jupiter.api.Test
    void everyPublicSenderRunsOffTheRequestThread() {
        // Otherwise how long SMTP takes would show in the response time of register / forgot-password and give away
        // whether an address is known
        for (String name : new String[] { "sendOtpEmail", "sendRegistrationOtpEmail", "sendPasswordResetSuccessEmail" }) {
            java.lang.reflect.Method method = java.util.Arrays.stream(EmailService.class.getDeclaredMethods())
                    .filter(m -> m.getName().equals(name)).findFirst().orElseThrow();
            org.junit.jupiter.api.Assertions.assertTrue(
                    method.isAnnotationPresent(org.springframework.scheduling.annotation.Async.class), name + " must be @Async");
        }
    }
}
