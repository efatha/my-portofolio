package com.efatha.backend.contact;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.*;

public record ContactMessageRequest(
    @NotBlank @Size(max = 120) String name,
    @NotBlank @Email @Size(max = 320) String email,
    @JsonAlias("contact") @NotBlank @Size(max = 10000) String message
) {}
