package com.kkunquizapp.QuizAppBackend.common.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.TaskScheduler;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler;

/**
 * Scheduler Configuration
 * Provides TaskScheduler for delayed game operations
 */
@Configuration
@EnableScheduling
@Slf4j
public class SchedulerConfig {

    @Bean
    public TaskScheduler taskScheduler() {
        ThreadPoolTaskScheduler scheduler = new ThreadPoolTaskScheduler();

        // Pool size for concurrent scheduled tasks
        scheduler.setPoolSize(20);

        // Thread naming for debugging
        scheduler.setThreadNamePrefix("game-scheduler-");

        // Graceful shutdown
        scheduler.setWaitForTasksToCompleteOnShutdown(true);
        scheduler.setAwaitTerminationSeconds(30);

        // Reject policy when queue is full
        scheduler.setRejectedExecutionHandler((r, executor) -> {
            log.error("Task rejected: {}", r.toString());
        });

        // Error handler
        scheduler.setErrorHandler(throwable -> {
            log.error("Scheduled task error: {}", throwable.getMessage(), throwable);
        });

        scheduler.initialize();

        log.info("TaskScheduler initialized with pool size: {}", scheduler.getPoolSize());
        return scheduler;
    }
}