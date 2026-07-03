package com.example.backend.controllers;

import com.example.backend.dto.ChatMessageDto;
import com.example.backend.services.ChatService;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
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

    private static final int MAX_PAGE_SIZE = 100;

    private final ChatService chatService;

    @GetMapping("/{projectId}/messages")
    @Operation(summary = "Get project messages", description = "Retrieve chat messages for a project")
    public ResponseEntity<Page<ChatMessageDto>> getProjectMessages(
            @PathVariable UUID projectId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), MAX_PAGE_SIZE),
                Sort.by(Sort.Direction.DESC, "createdAt"));
        return ResponseEntity.ok(chatService.getProjectMessages(projectId, pageable));
    }

    @PostMapping("/{projectId}/messages")
    @Operation(summary = "Send message", description = "Send a new chat message to a project")
    public ResponseEntity<ChatMessageDto> sendMessage(
            @PathVariable UUID projectId,
            @Valid @RequestBody com.example.backend.dto.CreateMessageRequest request) {
        return ResponseEntity.ok(chatService.sendMessage(projectId, request.getContent()));
    }
}
