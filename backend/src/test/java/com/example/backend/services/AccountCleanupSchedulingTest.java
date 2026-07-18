package com.example.backend.services;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.scheduling.annotation.ScheduledAnnotationBeanPostProcessor;
import org.springframework.scheduling.config.CronTask;

import static org.junit.jupiter.api.Assertions.assertTrue;

/** The unit tests cannot notice a missing @EnableScheduling; this boots the whole application and looks. */
@SpringBootTest
class AccountCleanupSchedulingTest {

    @Autowired
    private ScheduledAnnotationBeanPostProcessor scheduler;

    @Test
    void theCleanupJobIsRegisteredWithTheSchedulerOnItsCron() {
        // Spring wraps the method in a runnable whose toString is "<class>.<method>"
        boolean registered = scheduler.getScheduledTasks().stream()
                .map(scheduled -> scheduled.getTask())
                .filter(CronTask.class::isInstance)
                .map(CronTask.class::cast)
                .anyMatch(task -> task.getRunnable().toString().equals(AccountCleanupJob.class.getName() + ".run")
                        && task.getExpression().equals("0 30 3 * * *"));

        assertTrue(registered, "AccountCleanupJob.run is not scheduled: is @EnableScheduling missing?");
    }
}
