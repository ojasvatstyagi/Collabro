package com.example.backend.exceptions;

public class PdfExportException extends RuntimeException {
    public PdfExportException(String message) {
        super(message);
    }
}
