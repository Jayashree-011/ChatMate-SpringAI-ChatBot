package com.example.chatmate.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

public record ChatRequest(
        @NotBlank @Size(max = 20_000) String message,
        @NotNull @Size(max = 100) List<@Valid ChatMessage> history
) {
}
