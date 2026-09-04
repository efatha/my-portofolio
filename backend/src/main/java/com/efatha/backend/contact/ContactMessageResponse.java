package com.efatha.backend.contact;

import java.time.Instant;

public record ContactMessageResponse(
        Long id,
        String name,
        String email,
        String message,
        Instant submittedAt
) {

    public static ContactMessageResponse from(ContactMessage contactMessage) {
        return new ContactMessageResponse(
                contactMessage.getId(),
                contactMessage.getName(),
                contactMessage.getEmail(),
                contactMessage.getMessage(),
                contactMessage.getSubmittedAt()
        );
    }
}
