package com.example.backend.utils;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;

import java.util.List;

/**
 * Optional paging for the endpoints that return a plain JSON array (requests, my/joined/user projects, tasks, files,
 * teams). The body stays an array so existing clients keep working; the position is reported in headers instead:
 * {@code X-Total-Count}, {@code X-Page}, {@code X-Page-Size} (exposed to browsers in the CORS configuration).
 * <ul>
 *   <li>No {@code page}/{@code size} given: the first {@link #CEILING} rows, so a list can never grow without bound.
 *       {@code X-Total-Count} says when that was not everything.</li>
 *   <li>{@code page} and/or {@code size} given: that page, size defaulting to {@link #DEFAULT_SIZE} and clamped to
 *       {@link #MAX_SIZE} (like the Pageable endpoints, see PagingConfig).</li>
 * </ul>
 */
public final class ListPaging {

    public static final int CEILING = 200;
    public static final int DEFAULT_SIZE = 20;
    public static final int MAX_SIZE = 100;

    public static final String TOTAL_COUNT = "X-Total-Count";
    public static final String PAGE = "X-Page";
    public static final String PAGE_SIZE = "X-Page-Size";

    private ListPaging() {
    }

    public static Pageable of(Integer page, Integer size, Sort sort) {
        if (page == null && size == null) {
            return PageRequest.of(0, CEILING, sort);
        }
        int safePage = page == null ? 0 : Math.max(page, 0);
        int safeSize = size == null ? DEFAULT_SIZE : Math.min(Math.max(size, 1), MAX_SIZE);
        return PageRequest.of(safePage, safeSize, sort);
    }

    /** Newest first, with the id as a tie-break so a row cannot appear on two pages or on none. */
    public static Sort newestFirst(String createdAtProperty) {
        return Sort.by(Sort.Order.desc(createdAtProperty), Sort.Order.desc("id"));
    }

    public static <T> ResponseEntity<List<T>> respond(Page<T> page) {
        return ResponseEntity.ok().headers(headers(page)).body(page.getContent());
    }

    public static HttpHeaders headers(Page<?> page) {
        HttpHeaders headers = new HttpHeaders();
        headers.set(TOTAL_COUNT, String.valueOf(page.getTotalElements()));
        headers.set(PAGE, String.valueOf(page.getNumber()));
        headers.set(PAGE_SIZE, String.valueOf(page.getSize()));
        return headers;
    }
}
