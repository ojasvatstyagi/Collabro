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

    /** The newest still-unused token of the given type: the only one a guess may be checked against. */
    Optional<PasswordToken> findFirstByEmailAndTokenTypeAndUsedFalseOrderByIdDesc(String email, TokenType tokenType);

    /** Burns every unused token of this type, so issuing a new OTP invalidates the older ones. */
    @Modifying
    @Query("UPDATE PasswordToken t SET t.used = true WHERE t.email = :email AND t.tokenType = :type AND t.used = false")
    int invalidateActive(@Param("email") String email, @Param("type") TokenType type);
}
