package com.example.backend.dto;

import com.example.backend.enums.SocialPlatform;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class SocialLinkCreateDto {
    @NotNull(message = "Platform is required")
    private SocialPlatform platform;

    @NotBlank(message = "URL is required")
    private String url;
}
