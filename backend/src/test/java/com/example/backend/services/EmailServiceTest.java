package com.example.backend.services;


import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.MailSendException;
import org.springframework.mail.javamail.JavaMailSender;

import static org.mockito.Mockito.*;

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

        // Act  (for testing make sendHtmlEmail public)
//        emailService.sendHtmlEmail("test@example.com", "Test Subject", "<p>Test Content</p>");

        // Assert
        verify(mailSender).send(mimeMessage);
    }

    @Test
    void sendHtmlEmail_ShouldLogErrorOnException() throws Exception {
        // Arrange
        MimeMessage mimeMessage = mock(MimeMessage.class);
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);
        doThrow(new MailSendException("Test Exception")).when(mailSender).send(any(MimeMessage.class));

        // Act (for testing make sendHtmlEmail public)
//        emailService.sendHtmlEmail("test@example.com", "Test Subject", "<p>Test Content</p>");

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
        verify(mailSender).send(mimeMessage);
        ArgumentCaptor<MimeMessage> messageCaptor = ArgumentCaptor.forClass(MimeMessage.class);
        verify(mailSender).send(messageCaptor.capture());
        // Can't verify exact HTML content without parsing it
    }
}
