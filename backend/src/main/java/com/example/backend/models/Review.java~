package com.example.backend.models;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;
import java.util.UUID;

@Entity
@Table(name = "reviews")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Review {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private int rating;  // 1 to 5 stars

    @Column(columnDefinition = "TEXT")
    private String comment;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "created_at", nullable = false, updatable = false)
    private Date createdAt;

    @ManyToOne
    @JoinColumn(name = "reviewer_id", nullable = false)
    private Profile reviewer;

    @ManyToOne
    @JoinColumn(name = "reviewed_id", nullable = false)
    private Profile reviewed;

    @ManyToOne
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @PrePersist
    protected void onCreate() {
        this.createdAt = new Date();
    }
}
