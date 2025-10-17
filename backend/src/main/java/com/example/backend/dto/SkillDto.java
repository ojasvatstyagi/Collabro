package com.example.backend.dto;

import com.example.backend.enums.Proficiency;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@AllArgsConstructor
@Builder
public class SkillDto {
    private UUID id;
    private String name;
    private Proficiency proficiency;

}