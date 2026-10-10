package com.example.chatmate.service;

import com.example.chatmate.dto.ChatMessage;
import com.example.chatmate.dto.ChatRequest;
import com.example.chatmate.dto.ChatResponse;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.messages.AssistantMessage;
import org.springframework.ai.chat.messages.Message;
import org.springframework.ai.chat.messages.SystemMessage;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class ChatService {

    private static final String SYSTEM_PROMPT =
            "You are ChatMate, a helpful, friendly AI assistant. Be clear, accurate, and concise.";

    private final ChatClient chatClient;

    public ChatService(ChatClient.Builder chatClientBuilder) {
        this.chatClient = chatClientBuilder.build();
    }

    public ChatResponse reply(ChatRequest request) {
        List<Message> messages = new ArrayList<>();
        messages.add(new SystemMessage(SYSTEM_PROMPT));

        for (ChatMessage turn : request.history()) {
            messages.add(turn.role() == ChatMessage.Role.USER
                    ? new UserMessage(turn.content())
                    : new AssistantMessage(turn.content()));
        }
        messages.add(new UserMessage(request.message()));

        try {
            String content = chatClient.prompt()
                    .messages(messages)
                    .call()
                    .content();
            if (content == null || content.isBlank()) {
                throw new IllegalStateException("Gemini returned an empty response.");
            }
            return new ChatResponse(content);
        } catch (Exception exception) {
            throw new ChatServiceException("The AI service could not generate a reply. Please try again.", exception);
        }
    }
}
