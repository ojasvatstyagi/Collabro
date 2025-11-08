package com.example.backend.dto;

import com.example.backend.enums.SocialPlatform;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class SocialLinkDto {

    @NotNull(message = "Platform is required")
    @Enumerated(EnumType.STRING)
    private SocialPlatform platform;

    @NotBlank(message = "URL is required")
    @Size(max = 255, message = "URL cannot exceed 255 characters")
    private String url;
}
