package com.example.backend.models;

import com.example.backend.enums.TeamStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;
import lombok.EqualsAndHashCode;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "teams")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Team {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String teamName;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private TeamStatus status;

    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @ManyToOne
    @JoinColumn(name = "profile_id", nullable = false)
    private Profile createdBy;

    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @OneToOne(mappedBy = "team")
    private Post post;

    // Optional project linked to this team
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @OneToOne(mappedBy = "team")
    private Project project;

    @ManyToMany
    @JoinTable(name = "team_members", joinColumns = @JoinColumn(name = "team_id"), inverseJoinColumns = @JoinColumn(name = "profile_id"))
    private List<Profile> members;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "created_at", nullable = false, updatable = false)
    @CreationTimestamp
    private LocalDateTime createdAt;

}