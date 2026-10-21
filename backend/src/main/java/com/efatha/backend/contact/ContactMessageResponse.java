package com.efatha.backend.contact;

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

public record ContactMessageResponse(
        Long id,
        String ticketId,
        String name,
        String email,
        String message,
        Instant submittedAt,
        String store,
        long latencyMs,
        List<PipelineStage> stages
) {

    public static String ticketIdFor(Long id) {
        return "msg_" + Long.toHexString(id);
    }

    public static ContactMessageResponse from(
            ContactMessage contactMessage,
            List<PipelineStage> stages
    ) {
        long latencyMs = stages.stream().mapToLong(PipelineStage::durationMs).sum();
        return new ContactMessageResponse(
                contactMessage.getId(),
                ticketIdFor(contactMessage.getId()),
                contactMessage.getName(),
                contactMessage.getEmail(),
                contactMessage.getMessage(),
                contactMessage.getSubmittedAt(),
                "PostgreSQL",
                latencyMs,
                List.copyOf(stages)
        );
    }

    public String serverTiming() {
        return stages.stream()
                .map(stage -> stage.name() + ";dur=" + stage.durationMs())
                .collect(Collectors.joining(", "));
    }
}
