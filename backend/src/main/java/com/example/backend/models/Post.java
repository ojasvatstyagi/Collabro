package com.example.backend.models;

import com.example.backend.enums.PostType;
import com.example.backend.enums.PostStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;
import lombok.EqualsAndHashCode;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "posts", indexes = {
    @Index(name = "idx_post_profile", columnList = "profile_id"),
    @Index(name = "idx_post_status", columnList = "status"),
    @Index(name = "idx_post_type", columnList = "postType"),
    @Index(name = "idx_post_created", columnList = "created_at")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Post {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PostType postType;

    private String title;

    private String description;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "created_at", nullable = false, updatable = false)
    @CreationTimestamp
    private LocalDateTime createdAt;

    @ElementCollection
    @CollectionTable(name = "post_required_skills", joinColumns = @JoinColumn(name = "post_id"))
    @Column(name = "skill")
    private List<String> requiredSkills;

    private String mediaUrl;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private PostStatus status = PostStatus.POSTED;

    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @ManyToOne
    @JoinColumn(name = "profile_id", nullable = false)
    private Profile author;

    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @OneToOne(mappedBy = "post", cascade = CascadeType.ALL)
    private Project project;

    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @OneToOne(cascade = CascadeType.ALL)
    @JoinColumn(name = "team_id")
    private Team team;

    @PrePersist
    @PreUpdate
    private void validatePostTarget() {
        boolean hasProject = project != null;
        boolean hasTeam = team != null;
        
        if (hasProject == hasTeam) { // Both true or both false
            throw new IllegalStateException(
                "Post must be linked to either a Project OR a Team, not both or neither"
            );
        }
    }

}
