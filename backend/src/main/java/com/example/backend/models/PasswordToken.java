package com.example.backend.models;

import com.example.backend.enums.TokenType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "password_tokens")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PasswordToken {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String email;

    @Column(nullable = false)
    private String otp;

    @Column(nullable = false)
    private LocalDateTime expiryTime;

    private boolean used = false;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TokenType tokenType;
}

