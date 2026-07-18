package com.example.backend.services;

import com.example.backend.models.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AccountCleanupJobTest {

    @Mock
    private AccountCleanupService service;

    private AccountCleanupJob job;

    @BeforeEach
    void setUp() {
        job = new AccountCleanupJob(service);
        ReflectionTestUtils.setField(job, "enabled", true);
        ReflectionTestUtils.setField(job, "unverifiedAfter", Duration.ofDays(7));
        ReflectionTestUtils.setField(job, "codesAfter", Duration.ofDays(1));
    }

    private static List<User> users(int n) {
        List<User> list = new ArrayList<>();
        for (int i = 0; i < n; i++) {
            User user = new User();
            user.setId(UUID.randomUUID());
            list.add(user);
        }
        return list;
    }

    @Test
    void theCutoffIsTheConfiguredAgeBeforeNow() {
        when(service.findStale(any())).thenReturn(List.of());
        LocalDateTime before = LocalDateTime.now().minusDays(7);

        job.removeUnverifiedAccounts();

        org.mockito.ArgumentCaptor<LocalDateTime> cutoff = org.mockito.ArgumentCaptor.forClass(LocalDateTime.class);
        verify(service).findStale(cutoff.capture());
        assertFalse(cutoff.getValue().isBefore(before));
        assertTrue(cutoff.getValue().isBefore(LocalDateTime.now().minusDays(7).plusSeconds(5)));
    }

    @Test
    void oneAccountFailingDoesNotStopTheOthers() {
        List<User> batch = users(3);
        when(service.findStale(any())).thenReturn(batch);
        when(service.purge(batch.get(0))).thenThrow(new RuntimeException("constraint"));
        when(service.purge(batch.get(1))).thenReturn(true);
        when(service.purge(batch.get(2))).thenReturn(true);

        assertEquals(2, job.removeUnverifiedAccounts());
        verify(service, times(3)).purge(any());
    }

    @Test
    void aFullBatchWhereNothingCouldBeRemovedEndsTheRunInsteadOfLoopingForever() {
        List<User> stuck = users(AccountCleanupService.BATCH);
        when(service.findStale(any())).thenReturn(stuck);
        when(service.purge(any())).thenThrow(new RuntimeException("always fails"));

        assertEquals(0, job.removeUnverifiedAccounts());
        verify(service, times(1)).findStale(any());
    }

    @Test
    void aFullBatchThatWasRemovedIsFollowedByAnother() {
        when(service.findStale(any())).thenReturn(users(AccountCleanupService.BATCH)).thenReturn(users(3));
        when(service.purge(any())).thenReturn(true);

        assertEquals(AccountCleanupService.BATCH + 3, job.removeUnverifiedAccounts());
        verify(service, times(2)).findStale(any());
    }

    @Test
    void runIsAScheduledMethodWithAConfigurableCron() throws Exception {
        Scheduled scheduled = AccountCleanupJob.class.getMethod("run").getAnnotation(Scheduled.class);

        assertNotNull(scheduled);
        assertTrue(scheduled.cron().contains("app.cleanup.cron"));
    }
}
