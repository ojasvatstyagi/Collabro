package com.example.backend.models;

import com.fasterxml.jackson.annotation.JsonBackReference;
import io.micrometer.common.util.StringUtils;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.NotFound;
import org.hibernate.annotations.NotFoundAction;
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
    @EqualsAndHashCode.Include
    private UUID id;

    // Users are soft-deleted (see User's @SQLRestriction). A profile whose user was deleted must still load, or
    // everything it owns (its projects, messages, tasks) disappears with it. NotFound(IGNORE) makes the user null
    // instead, and the column is deliberately not "nullable = false": that would force an inner join on users.
    @OneToOne
    @NotFound(action = NotFoundAction.IGNORE)
    @JoinColumn(name = "user_id", referencedColumnName = "id")
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

    // Notification Preferences
    @Column(name = "notifications_enabled", nullable = false)
    @Builder.Default
    private boolean notificationsEnabled = true;

    @Column(name = "email_notifications", nullable = false)
    @Builder.Default
    private boolean emailNotifications = true;

    @Column(name = "project_notifications", nullable = false)
    @Builder.Default
    private boolean projectNotifications = true;

    // Team Preferences
    @Column(name = "open_for_team_invites", nullable = false)
    @Builder.Default
    private boolean openForTeamInvites = false;

    @Column(name = "preferred_team_size")
    private String preferredTeamSize;

    @ElementCollection
    @CollectionTable(name = "profile_project_interests", joinColumns = @JoinColumn(name = "profile_id"))
    @Column(name = "interest")
    @Builder.Default
    private List<String> projectInterests = new ArrayList<>();

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
    @org.hibernate.annotations.BatchSize(size = 50)
    @Builder.Default
    private List<Skill> skills = new ArrayList<>();

    @ManyToMany(mappedBy = "members")
    @Builder.Default
    private List<Team> teams = new ArrayList<>();

    @OneToMany(mappedBy = "createdBy", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Project> createdProjects = new ArrayList<>();

    @OneToMany(mappedBy = "assignedTo", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Task> assignedTasks = new ArrayList<>();

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    /** The owner's username, or a placeholder once the account has been deleted (the user row is soft-deleted). */
    public String displayUsername() {
        return user != null ? user.getUsername() : "deleted user";
    }

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
