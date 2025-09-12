package com.example.backend.controllers;

import org.springframework.web.bind.annotation.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@RequestMapping("/api/hello")
@Tag(name = "Hello API", description = "Basic test endpoints for Swagger")
public class HelloController {

    @GetMapping
    @Operation(summary = "Say Hello", description = "Returns a simple greeting")
    public String sayHello() {
        return "Hello from Swaggerrrrrrr!";
    }
}
