package com.example.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CreateMessageRequest {
    @NotBlank(message = "Message cannot be empty")
    @Size(max = 4000, message = "Message must be at most 4000 characters")
    private String content;
}
