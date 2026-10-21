package com.efatha.backend.contact;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

@Component
public class ContactMessageAcceptedListener {

    private static final Logger log = LoggerFactory.getLogger(ContactMessageAcceptedListener.class);

    @EventListener
    public void onAccepted(ContactMessageAcceptedEvent event) {
        log.info("contact accepted ticket={}", event.ticketId());
    }
}
