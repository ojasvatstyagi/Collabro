package com.example.backend.dto;

import com.example.backend.enums.Proficiency;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class SkillUpdateDto {
    @NotBlank(message = "Skill name is required")
    @Size(max = 50, message = "Skill name cannot exceed 50 characters")
    private String name;

    @NotNull(message = "Proficiency is required")
    private Proficiency proficiency;
}