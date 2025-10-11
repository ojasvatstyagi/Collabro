package com.example.backend.dtos;

import com.example.backend.enums.Proficiency;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class SkillUpdateDto {
    @NotBlank
    @Size(max = 50)
    private String name;

    @NotNull
    private Proficiency proficiency;
}