package com.example.backend.models;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class ProfileDisplayNameTest {

    private Profile profile(String first, String last, String username) {
        User user = username == null ? null : new User();
        if (user != null) {
            user.setUsername(username);
        }
        return Profile.builder().user(user).firstname(first).lastname(last).build();
    }

    @Test
    void aProfileWithANameIsCalledByIt() {
        assertEquals("Alice Anderson", profile("Alice", "Anderson", "alice_a").displayName());
    }

    @Test
    void extraSpacesAreTrimmed() {
        assertEquals("Alice Anderson", profile("  Alice ", " Anderson  ", "alice_a").displayName());
        assertEquals("Alice", profile("Alice", "", "alice_a").displayName());
        assertEquals("Anderson", profile("", "Anderson", "alice_a").displayName());
    }

    @Test
    void aProfileWithoutANameIsCalledByItsUsername() {
        assertEquals("alice_a", profile("", "", "alice_a").displayName());
        assertEquals("alice_a", profile("   ", "  ", "alice_a").displayName());
        assertEquals("alice_a", profile(null, null, "alice_a").displayName());
    }

    @Test
    void anAccountThatWasDeletedIsCalledDeletedUser() {
        Profile deleted = profile("Alice", "Anderson", "alice_a");
        deleted.erasePersonalData();
        deleted.setUser(null); // the user row is soft-deleted, so the profile no longer sees it

        assertEquals("Deleted User", deleted.displayName());
        assertEquals("deleted user", profile("", "", null).displayName());
    }
}
