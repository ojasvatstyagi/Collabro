package com.example.backend.models;

import com.fasterxml.jackson.annotation.JsonBackReference;
import io.micrometer.common.util.StringUtils;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "profiles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@ToString(onlyExplicitlyIncluded = true)
public class Profile {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @ToString.Include
    private UUID id;

    @OneToOne
    @JoinColumn(name = "user_id", nullable = false, referencedColumnName = "id")
    @JsonBackReference
    private User user;

    @Column(nullable = false)
    @ToString.Include
    private String firstname;

    @Column(nullable = false)
    @ToString.Include
    private String lastname;

    @Column(length = 1000)
    private String bio;

    private String education;

    @Column(length = 255)
    @ToString.Include
    private String location;

    @Column(length = 50)
    @ToString.Include
    private String phone;

    private String profilePictureUrl;

    @Column(name = "created_at", nullable = false, updatable = false)
    @CreationTimestamp
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    @UpdateTimestamp
    private LocalDateTime updatedAt;

    @Column(name = "is_profile_complete", nullable = false)
    @Builder.Default
    private boolean isProfileComplete = false;

    @Column(name = "completion_percentage", nullable = false)
    @Builder.Default
    private int completionPercentage = 0;

    @OneToMany(mappedBy = "profile", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<SocialLink> socialLinks = new ArrayList<>();

    @OneToMany(mappedBy = "profile", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Skill> skills = new ArrayList<>();

    @OneToMany(mappedBy = "author", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Post> posts = new ArrayList<>();

    @ManyToMany(mappedBy = "members")
    @Builder.Default
    private List<Team> teams = new ArrayList<>();

    @OneToMany(mappedBy = "createdBy", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Project> createdProjects = new ArrayList<>();

    @OneToMany(mappedBy = "assignedTo", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Task> assignedTasks = new ArrayList<>();

    @OneToMany(mappedBy = "reviewed", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Review> receivedReviews = new ArrayList<>();

    @OneToMany(mappedBy = "reviewer", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Review> givenReviews = new ArrayList<>();

    // Helper method to calculate completion
    public void calculateCompletion() {
        int total = 0;

        if (StringUtils.isNotBlank(firstname))
            total += COMPLETION_WEIGHTS.get("firstname");
        if (StringUtils.isNotBlank(lastname))
            total += COMPLETION_WEIGHTS.get("lastname");
        if (StringUtils.isNotBlank(bio))
            total += COMPLETION_WEIGHTS.get("bio");
        if (StringUtils.isNotBlank(education))
            total += COMPLETION_WEIGHTS.get("education");
        if (skills != null && !skills.isEmpty())
            total += COMPLETION_WEIGHTS.get("skills");
        if (StringUtils.isNotBlank(profilePictureUrl))
            total += COMPLETION_WEIGHTS.get("profilePicture");
        if (StringUtils.isNotBlank(location))
            total += COMPLETION_WEIGHTS.get("location");
        if (StringUtils.isNotBlank(phone))
            total += COMPLETION_WEIGHTS.get("phone");

        this.completionPercentage = total;
        this.isProfileComplete = completionPercentage >= 80;
    }

    private static final Map<String, Integer> COMPLETION_WEIGHTS = Map.of(
            "firstname", 15,
            "lastname", 15,
            "bio", 10,
            "education", 10,
            "skills", 15,
            "profilePicture", 15,
            "location", 10,
            "phone", 10);
}
