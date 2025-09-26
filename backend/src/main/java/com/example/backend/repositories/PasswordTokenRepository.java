package com.example.backend.repositories;

import com.example.backend.enums.TokenType;
import com.example.backend.models.PasswordToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PasswordTokenRepository extends JpaRepository<PasswordToken, Long> {
    Optional<PasswordToken> findByEmailAndOtpAndUsedFalse(String email, String otp);
    Optional<PasswordToken> findByEmailAndOtpAndUsedFalseAndTokenType(String email, String otp, TokenType tokenType);
}

