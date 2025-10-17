package com.example.backend.models;

import com.example.backend.enums.SocialPlatform;
import jakarta.persistence.*;
import lombok.Data;

import java.util.UUID;

@Entity
@Table(name = "social_links")
@Data
public class SocialLink {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Enumerated(EnumType.STRING)
    private SocialPlatform platform;

    private String url;

    @ManyToOne
    @JoinColumn(name = "profile_id")
    private Profile profile;
}