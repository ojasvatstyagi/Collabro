package com.example.backend.controllers;

import com.example.backend.dto.HistoryItemDto;
import com.example.backend.dto.HistoryStatsDto;
import com.example.backend.services.HistoryService;
import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/history")
@RequiredArgsConstructor
public class HistoryController {

    private static final int MAX_PAGE_SIZE = 100;

    private final HistoryService historyService;

    @GetMapping
    @Operation(summary = "Get my activity history", description = "Projects, join requests, collaborations, tasks and files, newest first")
    public ResponseEntity<Page<HistoryItemDto>> getHistory(
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String timeframe,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        Pageable pageable = PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), MAX_PAGE_SIZE));
        return ResponseEntity.ok(historyService.getHistory(type, timeframe, search, pageable));
    }

    @GetMapping("/stats")
    @Operation(summary = "Get my activity totals")
    public ResponseEntity<HistoryStatsDto> getStats() {
        return ResponseEntity.ok(historyService.getStats());
    }
}
