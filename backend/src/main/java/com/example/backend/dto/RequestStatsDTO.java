package com.example.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RequestStatsDTO {
    private long pendingReceived;
    private long pendingSent;
    private long totalReceived;
    private long totalSent;
    private long approvedReceived;
    private long rejectedReceived;
}
