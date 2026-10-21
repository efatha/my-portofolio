package com.efatha.backend.contact;

import java.time.Clock;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ContactMessageService {

    private final ContactMessageRepository repository;
    private final ApplicationEventPublisher events;
    private final Clock clock;

    public ContactMessageService(
            ContactMessageRepository repository,
            ApplicationEventPublisher events
    ) {
        this(repository, events, Clock.systemUTC());
    }

    ContactMessageService(
            ContactMessageRepository repository,
            ApplicationEventPublisher events,
            Clock clock
    ) {
        this.repository = repository;
        this.events = events;
        this.clock = clock;
    }

    @Transactional
    public ContactMessageResponse create(ContactMessageRequest request) {
        List<PipelineStage> stages = new ArrayList<>();

        long mark = System.nanoTime();
        String name = request.name().trim();
        String email = request.email().trim().toLowerCase();
        String message = request.message().trim();
        stages.add(done("validate", mark));

        mark = System.nanoTime();
        ContactMessage saved = repository.save(
                new ContactMessage(name, email, message, Instant.now(clock))
        );
        stages.add(done("persist", mark));

        mark = System.nanoTime();
        String ticketId = ContactMessageResponse.ticketIdFor(saved.getId());
        events.publishEvent(new ContactMessageAcceptedEvent(saved.getId(), ticketId));
        stages.add(done("notify", mark));

        return ContactMessageResponse.from(saved, stages);
    }

    private static PipelineStage done(String name, long startedAtNanos) {
        long durationMs = Math.max(0, (System.nanoTime() - startedAtNanos) / 1_000_000);
        return new PipelineStage(name, "done", durationMs);
    }
}
