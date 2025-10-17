package com.example.backend.dto;

import com.example.backend.enums.Proficiency;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class SkillUpdateDto {
    @NotBlank
    @Size(max = 50)
    private String name;

    @NotNull
    private Proficiency proficiency;
}