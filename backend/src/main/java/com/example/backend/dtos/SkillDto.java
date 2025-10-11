package com.example.backend.dtos;

import com.example.backend.enums.Proficiency;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.UUID;

@Data
@AllArgsConstructor
public class SkillDto {
    private UUID id;
    private String name;
    private Proficiency proficiency;
}