package com.efatha.backend.contact;

import java.time.Instant;

public record ContactMessageResponse(Long id, String name, String email, String message, Instant submittedAt) {
    public static ContactMessageResponse from(ContactMessage value) {
        return new ContactMessageResponse(value.getId(), value.getName(), value.getEmail(), value.getMessage(), value.getSubmittedAt());
    }
}
