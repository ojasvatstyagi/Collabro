package com.example.backend.repositories;

import com.example.backend.enums.TokenType;
import com.example.backend.models.PasswordToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PasswordTokenRepository extends JpaRepository<PasswordToken, Long> {

    /** The newest token of the given type, used or not: what the resend cooldown is measured from. */
    Optional<PasswordToken> findFirstByEmailAndTokenTypeOrderByIdDesc(String email, TokenType tokenType);

    /** The newest still-unused token of the given type: the only one a guess may be checked against. */
    Optional<PasswordToken> findFirstByEmailAndTokenTypeAndUsedFalseOrderByIdDesc(String email, TokenType tokenType);

    @Modifying
    @Query("DELETE FROM PasswordToken t WHERE t.email = :email")
    int deleteAllForEmail(@Param("email") String email);

    /** Codes that expired before the cutoff are of no use to anyone; the cooldown only looks at the newest one. */
    @Modifying
    @Query("DELETE FROM PasswordToken t WHERE t.expiryTime < :cutoff")
    int deleteExpiredBefore(@Param("cutoff") java.time.LocalDateTime cutoff);

    /** Burns every unused token of this type, so issuing a new OTP invalidates the older ones. */
    @Modifying
    @Query("UPDATE PasswordToken t SET t.used = true WHERE t.email = :email AND t.tokenType = :type AND t.used = false")
    int invalidateActive(@Param("email") String email, @Param("type") TokenType type);
}
