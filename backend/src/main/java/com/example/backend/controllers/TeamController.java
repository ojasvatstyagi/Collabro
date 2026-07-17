package com.example.backend.controllers;

import com.example.backend.utils.ListPaging;
import com.example.backend.dto.TeamSummaryDto;
import com.example.backend.services.TeamService;
import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/teams")
@RequiredArgsConstructor
public class TeamController {

    private final TeamService teamService;

    @GetMapping("/me")
    @Operation(summary = "Get my teams", description = "Teams of the projects the current user owns or has joined")
    public ResponseEntity<List<TeamSummaryDto>> getMyTeams(@RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size) {
        return ListPaging.respond(teamService.getMyTeams(ListPaging.of(page, size, ListPaging.newestFirst("createdAt"))));
    }
}
