package com.example.backend.models;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "skill_definitions", indexes = {
        @Index(name = "idx_skill_def_name", columnList = "name"),
        @Index(name = "idx_skill_def_normalized", columnList = "normalized_name", unique = true)
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class SkillDefinition {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    @EqualsAndHashCode.Include
    private String name;

    @Column(name = "normalized_name", unique = true, nullable = false)
    private String normalizedName; // e.g. "java" for "Java"

    @Column(name = "created_at", nullable = false, updatable = false)
    @CreationTimestamp
    private LocalDateTime createdAt;

    @PrePersist
    @PreUpdate
    public void normalize() {
        if (this.name != null) {
            this.normalizedName = this.name.trim().toLowerCase();
        }
    }
}
