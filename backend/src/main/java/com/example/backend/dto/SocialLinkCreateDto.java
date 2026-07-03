package com.example.backend.dto;

import com.example.backend.enums.SocialPlatform;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Pattern;
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
    @Size(max = 500, message = "URL must be at most 500 characters")
    @Pattern(regexp = "^(?i)https?://\\S+$", message = "URL must start with http:// or https://")
    private String url;
}
