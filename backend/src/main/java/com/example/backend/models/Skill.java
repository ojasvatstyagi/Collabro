package com.example.backend.models;

import com.example.backend.enums.Proficiency;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "skills", indexes = {
        @Index(name = "idx_skill_profile", columnList = "profile_id"),
        @Index(name = "idx_skill_definition", columnList = "skill_definition_id")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Skill {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "skill_definition_id", nullable = false)
    private SkillDefinition definition;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Proficiency proficiency;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "profile_id", nullable = false)
    @ToString.Exclude // Prevent circular toString() calls
    @EqualsAndHashCode.Exclude
    private Profile profile;

    @CreatedDate
    @Column(updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    private Instant modifiedAt;

    public String getName() {
        return definition != null ? definition.getName() : null;
    }
}
