package com.efatha.backend.contact;

import java.time.Clock;
import java.time.Instant;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ContactMessageService {
    private final ContactMessageRepository repository;
    private final Clock clock;
    public ContactMessageService(ContactMessageRepository repository) { this(repository, Clock.systemUTC()); }
    ContactMessageService(ContactMessageRepository repository, Clock clock) { this.repository = repository; this.clock = clock; }
    @Transactional
    public ContactMessageResponse create(ContactMessageRequest request) {
        ContactMessage value = new ContactMessage(request.name().trim(), request.email().trim().toLowerCase(), request.message().trim(), Instant.now(clock));
        return ContactMessageResponse.from(repository.save(value));
    }
}
