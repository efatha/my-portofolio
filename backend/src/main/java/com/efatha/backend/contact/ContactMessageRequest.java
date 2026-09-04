package com.efatha.backend.contact;

import com.fasterxml.jackson.annotation.JsonAlias;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ContactMessageRequest(
    @NotBlank @Size(max = 120) String name,
    @NotBlank @Email @Size(max = 320) String email,
    @JsonAlias("contact") @NotBlank @Size(max = 10000) String message
) {}
