package com.efatha.backend.contact;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/contact")
public class ContactMessageController {

    private final ContactMessageService service;

    public ContactMessageController(ContactMessageService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<ContactMessageResponse> create(
            @Valid @RequestBody ContactMessageRequest request
    ) {
        ContactMessageResponse body = service.create(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .header("Server-Timing", body.serverTiming())
                .body(body);
    }
}
