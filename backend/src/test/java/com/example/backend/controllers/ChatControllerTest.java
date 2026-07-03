package com.example.backend.controllers;

import com.example.backend.dto.ChatMessageDto;
import com.example.backend.exceptions.GlobalExceptionHandler;
import com.example.backend.services.ChatService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class ChatControllerTest {

    @Mock
    private ChatService chatService;

    @InjectMocks
    private ChatController controller;

    private MockMvc mockMvc;
    private final UUID projectId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(controller)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    private String body(String content) {
        return "{\"content\":" + (content == null ? "null" : "\"" + content + "\"") + "}";
    }

    @Test
    void sendMessage_WithText_Succeeds() throws Exception {
        when(chatService.sendMessage(projectId, "hello")).thenReturn(new ChatMessageDto());

        mockMvc.perform(post("/api/projects/" + projectId + "/messages")
                .contentType(MediaType.APPLICATION_JSON).content(body("hello")))
                .andExpect(status().isOk());
    }

    @Test
    void sendMessage_WithBlankOrMissingText_IsRejected() throws Exception {
        for (String content : new String[] { "", "   ", null }) {
            mockMvc.perform(post("/api/projects/" + projectId + "/messages")
                    .contentType(MediaType.APPLICATION_JSON).content(body(content)))
                    .andExpect(status().isBadRequest());
        }
        verifyNoInteractions(chatService);
    }

    @Test
    void sendMessage_OverTheLengthLimit_IsRejected() throws Exception {
        mockMvc.perform(post("/api/projects/" + projectId + "/messages")
                .contentType(MediaType.APPLICATION_JSON).content(body("x".repeat(4001))))
                .andExpect(status().isBadRequest());

        verifyNoInteractions(chatService);
    }

    @Test
    void getMessages_CapsThePageSize() throws Exception {
        when(chatService.getProjectMessages(any(), any(Pageable.class))).thenReturn(new PageImpl<>(List.of(), PageRequest.of(0, 10), 0));

        mockMvc.perform(get("/api/projects/" + projectId + "/messages").param("size", "100000"))
                .andExpect(status().isOk());

        ArgumentCaptor<Pageable> captor = ArgumentCaptor.forClass(Pageable.class);
        verify(chatService).getProjectMessages(any(), captor.capture());
        assertEquals(100, captor.getValue().getPageSize());
    }
}
