package com.example.backend.models;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/** One failed login, counted against a throttle key (see LoginThrottle). Rows older than the window are deleted. */
@Entity
@Table(name = "login_failures", indexes = @Index(name = "idx_login_failure_key_time", columnList = "throttle_key, attempted_at"))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class LoginFailure {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "throttle_key", nullable = false, length = 200)
    private String throttleKey;

    @Column(name = "attempted_at", nullable = false)
    private LocalDateTime attemptedAt;

    public LoginFailure(String throttleKey, LocalDateTime attemptedAt) {
        this.throttleKey = throttleKey;
        this.attemptedAt = attemptedAt;
    }
}
