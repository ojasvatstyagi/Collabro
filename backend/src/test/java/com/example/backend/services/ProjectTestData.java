package com.example.backend.services;

import com.example.backend.enums.TeamStatus;
import com.example.backend.models.Profile;
import com.example.backend.models.Project;
import com.example.backend.models.Team;
import com.example.backend.models.User;

import java.util.ArrayList;
import java.util.UUID;

/** Builders for the owner / member / outsider fixtures shared by the authorization tests. */
final class ProjectTestData {

    private ProjectTestData() {
    }

    static Profile profile(String username) {
        User user = new User();
        user.setId(UUID.randomUUID());
        user.setUsername(username);
        return Profile.builder()
                .id(UUID.randomUUID())
                .user(user)
                .firstname(username)
                .lastname("Test")
                .skills(new ArrayList<>())
                .build();
    }

    static Project project(Profile owner, Profile... teamMembers) {
        Project project = new Project();
        project.setId(UUID.randomUUID());
        project.setTitle("Collabro");
        project.setCreatedBy(owner);
        if (teamMembers.length > 0) {
            Team team = new Team();
            team.setStatus(TeamStatus.ACTIVE);
            team.setOwner(owner);
            team.setCreatedBy(owner);
            team.setProject(project);
            for (Profile member : teamMembers) {
                team.getMembers().add(member);
            }
            project.setTeam(team);
        }
        return project;
    }
}
