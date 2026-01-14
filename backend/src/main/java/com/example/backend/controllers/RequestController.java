package com.example.backend.controllers;

import com.example.backend.dto.ApproveRequestDTO;
import com.example.backend.dto.CollaborationRequestDTO;
import com.example.backend.dto.JoinProjectRequest;
import com.example.backend.dto.RejectRequestDTO;
import com.example.backend.dto.RequestStatsDTO;
import com.example.backend.enums.RequestStatus;
import com.example.backend.models.CollaborationRequest;
import com.example.backend.services.RequestService;

import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/requests")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class RequestController {

    private final RequestService requestService;

    @PostMapping("/join/{projectId}")
    @Operation(summary = "Create a new join request for a project", description = "Send a join request to a project")
    public ResponseEntity<Map<String, Object>> createJoinRequest(
            @PathVariable UUID projectId,
            @RequestBody(required = false) JoinProjectRequest requestBody) {
        
        String message = requestBody != null ? requestBody.getMessage() : null;
        CollaborationRequest request = requestService.createJoinRequest(projectId, message);
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Join request sent successfully");
        response.put("requestId", request.getId());
        
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/received")
    @Operation(summary = "Get all requests received for current user's projects", description = "Get all requests received for current user's projects")
    public ResponseEntity<Map<String, Object>> getReceivedRequests(
            @RequestParam(required = false) RequestStatus status) {
        
        List<CollaborationRequestDTO> requests = requestService.getReceivedRequests(status);
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", requests);
        response.put("count", requests.size());
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/sent")
    @Operation(summary = "Get all requests sent by current user", description = "Get all requests sent by current user")
    public ResponseEntity<Map<String, Object>> getSentRequests(
            @RequestParam(required = false) RequestStatus status) {
        
        List<CollaborationRequestDTO> requests = requestService.getSentRequests(status);
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", requests);
        response.put("count", requests.size());
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{requestId}")
    @Operation(summary = "Get a specific request by ID", description = "Get a specific request by ID")
    public ResponseEntity<Map<String, Object>> getRequestById(@PathVariable Long requestId) {
        CollaborationRequest request = requestService.getRequestById(requestId);
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", request);
        
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{requestId}/approve")
    @Operation(summary = "Approve a join request", description = "Approve a join request")
    public ResponseEntity<Map<String, Object>> approveRequest(
            @PathVariable Long requestId,
            @RequestBody(required = false) ApproveRequestDTO approveDTO) {
        
        CollaborationRequestDTO request = requestService.approveRequest(requestId);
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Request approved successfully. User added to team.");
        response.put("data", request);
        
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{requestId}/reject")
    @Operation(summary = "Reject a join request", description = "Reject a join request")
    public ResponseEntity<Map<String, Object>> rejectRequest(
            @PathVariable Long requestId,
            @RequestBody(required = false) RejectRequestDTO rejectDTO) {
        
        String reason = rejectDTO != null ? rejectDTO.getReason() : null;
        CollaborationRequestDTO request = requestService.rejectRequest(requestId, reason);
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Request rejected successfully");
        response.put("data", request);
        
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{requestId}")
    @Operation(summary = "Cancel a join request (by requester)", description = "Cancel a join request (by requester)")
    public ResponseEntity<Map<String, Object>> cancelRequest(@PathVariable Long requestId) {
        requestService.cancelRequest(requestId);
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Request cancelled successfully");
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/stats")
    @Operation(summary = "Get request statistics for current user", description = "Get request statistics for current user")
    public ResponseEntity<Map<String, Object>> getRequestStats() {
        RequestStatsDTO stats = requestService.getRequestStats();
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", stats);
        
        return ResponseEntity.ok(response);
    }
}
