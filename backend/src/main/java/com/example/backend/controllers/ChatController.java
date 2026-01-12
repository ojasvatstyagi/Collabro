package com.example.backend.controllers;

import com.example.backend.dto.ChatMessageDto;
import com.example.backend.services.ChatService;
import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/projects")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    @GetMapping("/{projectId}/messages")
    @Operation(summary = "Get project messages", description = "Retrieve chat messages for a project")
    public ResponseEntity<Page<ChatMessageDto>> getProjectMessages(
            @PathVariable UUID projectId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return ResponseEntity.ok(chatService.getProjectMessages(projectId, pageable));
    }

    @PostMapping("/{projectId}/messages")
    @Operation(summary = "Send message", description = "Send a new chat message to a project")
    public ResponseEntity<ChatMessageDto> sendMessage(
            @PathVariable UUID projectId,
            @RequestBody com.example.backend.dto.CreateMessageRequest request) { // Need this DTO or just string
        return ResponseEntity.ok(chatService.sendMessage(projectId, request.getContent()));
    }
}
