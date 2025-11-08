package com.example.backend.models;

import io.micrometer.common.util.StringUtils;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "profiles")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Profile {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne
    @JoinColumn(name = "user_id", nullable = false, referencedColumnName = "id")
    private User user;

    @Column(nullable = false)
    private String firstname;

    @Column(nullable = false)
    private String lastname;

    @Column(length = 1000)
    private String bio;

    private String education;

    private String profilePictureUrl;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "created_at", nullable = false, updatable = false)
    @CreationTimestamp
    private LocalDateTime createdAt;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "updated_at")
    @UpdateTimestamp
    private LocalDateTime updatedAt;

    @Column(name = "is_profile_complete", nullable = false)
    private boolean isProfileComplete = false;

    @Column(name = "completion_percentage", nullable = false)
    private int completionPercentage = 0;

    @OneToMany(mappedBy = "profile", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<SocialLink> socialLinks = new ArrayList<>();

    @OneToMany(mappedBy = "profile", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Skill> skills = new ArrayList<>();

    @OneToMany(mappedBy = "author", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Post> posts = new ArrayList<>();

    @ManyToMany(mappedBy = "members")
    private List<Team> teams = new ArrayList<>();

    @OneToMany(mappedBy = "createdBy", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Project> createdProjects = new ArrayList<>();

    @OneToMany(mappedBy = "assignedTo", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Task> assignedTasks = new ArrayList<>();

    @OneToMany(mappedBy = "reviewed", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Review> receivedReviews = new ArrayList<>();

    @OneToMany(mappedBy = "reviewer", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Review> givenReviews = new ArrayList<>();

    // Helper method to calculate completion
    public void calculateCompletion() {
        int total = 0;

        if (StringUtils.isNotBlank(firstname)) total += COMPLETION_WEIGHTS.get("firstname");
        if (StringUtils.isNotBlank(lastname)) total += COMPLETION_WEIGHTS.get("lastname");
        if (StringUtils.isNotBlank(bio)) total += COMPLETION_WEIGHTS.get("bio");
        if (StringUtils.isNotBlank(education)) total += COMPLETION_WEIGHTS.get("education");
        if (skills != null && !skills.isEmpty()) total += COMPLETION_WEIGHTS.get("skills");
        if (StringUtils.isNotBlank(profilePictureUrl)) total += COMPLETION_WEIGHTS.get("profilePicture");

        this.completionPercentage = total;
        this.isProfileComplete = completionPercentage >= 80;
    }


    @Transient
    private static final Map<String, Integer> COMPLETION_WEIGHTS = Map.of(
            "firstname", 20,
            "lastname", 20,
            "bio", 15,
            "education", 15,
            "skills", 15,
            "profilePicture", 15
    );
}
