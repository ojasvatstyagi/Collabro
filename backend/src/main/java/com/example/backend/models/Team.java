package com.example.backend.models;

import com.example.backend.enums.TeamStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;
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

    @ManyToOne
    @JoinColumn(name = "profile_id", nullable = false)
    private Profile createdBy;

    @OneToOne(mappedBy = "team")
    private Post post;

    // Optional project linked to this team
    @OneToOne(mappedBy = "team")
    private Project project;

    @ManyToMany
    @JoinTable(
            name = "team_members",
            joinColumns = @JoinColumn(name = "team_id"),
            inverseJoinColumns = @JoinColumn(name = "profile_id")
    )
    private List<Profile> members;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "created_at", nullable = false, updatable = false)
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Date createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = new Date();
    }
}