package com.example.backend.dto;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/** The frontend reads and writes isRemote / isOpenSource; they must survive both directions of the round trip. */
class ProjectDtoJsonTest {

    private final ObjectMapper mapper = new ObjectMapper();

    @Test
    void booleanFlags_AreReadFromTheNamesTheFrontendSends() throws Exception {
        ProjectDto dto = mapper.readValue(
                "{\"title\":\"t\",\"teamSize\":2,\"isRemote\":true,\"isOpenSource\":true}", ProjectDto.class);

        assertTrue(dto.isRemote());
        assertTrue(dto.isOpenSource());
    }

    @Test
    void booleanFlags_AreWrittenUnderTheNamesTheFrontendReads() throws Exception {
        String json = mapper.writeValueAsString(ProjectDto.builder().title("t").remote(true).openSource(false).build());

        assertTrue(json.contains("\"isRemote\":true"), json);
        assertTrue(json.contains("\"isOpenSource\":false"), json);
        assertFalse(json.contains("\"remote\""), json);
        assertFalse(json.contains("\"openSource\""), json);
    }

    @Test
    void creator_HasNoEmail() throws Exception {
        String json = mapper.writeValueAsString(ProjectDto.ProjectCreatorDto.builder().username("alice").build());

        assertEquals("{\"id\":null,\"username\":\"alice\",\"displayName\":null,\"profilePictureUrl\":null}", json);
    }

    @Test
    void userAndProfileFlags_UseTheNamesTheFrontendTypesDeclare() throws Exception {
        UserDto user = new UserDto();
        user.setVerified(true);
        user.setProfileComplete(true);
        ProfileDto profile = ProfileDto.builder().profileComplete(true).build();

        String userJson = mapper.writeValueAsString(user);
        String profileJson = mapper.writeValueAsString(profile);

        assertTrue(userJson.contains("\"isVerified\":true"), userJson);
        assertTrue(userJson.contains("\"isProfileComplete\":true"), userJson);
        assertTrue(profileJson.contains("\"isProfileComplete\":true"), profileJson);
        assertFalse(userJson.contains("\"verified\"") || userJson.contains("\"profileComplete\""), userJson);
    }
}
