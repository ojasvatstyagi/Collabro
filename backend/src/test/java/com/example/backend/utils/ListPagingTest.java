package com.example.backend.utils;

import org.junit.jupiter.api.Test;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

class ListPagingTest {

    private static final Sort SORT = ListPaging.newestFirst("createdAt");

    @Test
    void withoutParameters_ItIsTheCeilingNotEverything() {
        Pageable pageable = ListPaging.of(null, null, SORT);

        assertEquals(0, pageable.getPageNumber());
        assertEquals(ListPaging.CEILING, pageable.getPageSize());
    }

    @Test
    void sizeDefaultsAndIsClampedAndNegativePagesBecomeTheFirst() {
        assertEquals(ListPaging.DEFAULT_SIZE, ListPaging.of(3, null, SORT).getPageSize());
        assertEquals(ListPaging.MAX_SIZE, ListPaging.of(0, 100_000, SORT).getPageSize());
        assertEquals(1, ListPaging.of(0, -5, SORT).getPageSize());
        assertEquals(0, ListPaging.of(-9, 10, SORT).getPageNumber());
        assertEquals(7, ListPaging.of(7, 10, SORT).getPageNumber());
    }

    @Test
    void sortIsNewestFirstWithTheIdAsTieBreak() {
        assertEquals(List.of("createdAt: DESC", "id: DESC"),
                SORT.stream().map(o -> o.getProperty() + ": " + o.getDirection()).toList());
    }

    @Test
    void respondKeepsTheBodyAnArrayAndPutsThePositionInHeaders() {
        ResponseEntity<List<String>> response = ListPaging.respond(new PageImpl<>(List.of("a", "b"), PageRequest.of(2, 2), 9));

        assertEquals(List.of("a", "b"), response.getBody());
        assertEquals("9", response.getHeaders().getFirst(ListPaging.TOTAL_COUNT));
        assertEquals("2", response.getHeaders().getFirst(ListPaging.PAGE));
        assertEquals("2", response.getHeaders().getFirst(ListPaging.PAGE_SIZE));
    }
}
