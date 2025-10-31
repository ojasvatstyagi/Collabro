package com.example.backend.dto;

import com.example.backend.enums.Proficiency;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class SkillDto {
    private UUID id;
    private String name;
    private Proficiency proficiency;
}