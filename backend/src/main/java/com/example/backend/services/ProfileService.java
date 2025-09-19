package com.example.backend.services;

import com.example.backend.models.*;
import com.example.backend.repositories.ProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;

@Service
@RequiredArgsConstructor
public class ProfileService {

    private final ProfileRepository profileRepository;

    public Profile createEmptyProfile(User user) {
        Profile profile = new Profile();
        profile.setUser(user);
        profile.setCreatedAt(LocalDateTime.now());
        profile.setSkills(new ArrayList<>());
        profile.setPosts(new ArrayList<>());
        profile.setTeams(new ArrayList<>());
        profile.setCreatedProjects(new ArrayList<>());
        profile.setAssignedTasks(new ArrayList<>());
        profile.setReceivedReviews(new ArrayList<>());
        profile.setGivenReviews(new ArrayList<>());
        return profile;
    }

    public void save(Profile profile) {
        profileRepository.save(profile);
    }
}
