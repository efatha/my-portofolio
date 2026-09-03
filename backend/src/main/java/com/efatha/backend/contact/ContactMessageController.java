package com.efatha.backend.contact;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/contact")
@CrossOrigin(origins = "${app.frontend-origin}")
public class ContactMessageController {
    private final ContactMessageService service;
    public ContactMessageController(ContactMessageService service) { this.service = service; }
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ContactMessageResponse create(@Valid @RequestBody ContactMessageRequest request) { return service.create(request); }
}
