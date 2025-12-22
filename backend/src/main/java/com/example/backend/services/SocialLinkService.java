package com.example.backend.services;

import com.example.backend.dto.SocialLinkDto;
import com.example.backend.dto.SocialLinkCreateDto;
import com.example.backend.exceptions.ResourceNotFoundException;
import com.example.backend.models.Profile;
import com.example.backend.models.SocialLink;
import com.example.backend.repositories.SocialLinkRepository;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.Objects;
import org.springframework.lang.NonNull;

@Service
@RequiredArgsConstructor
@Transactional
public class SocialLinkService {
    private final SocialLinkRepository socialLinkRepository;
    private final ProfileService profileService;
    private final ModelMapper modelMapper;

    public List<SocialLinkDto> getCurrentUserSocialLinks() {
        Profile profile = profileService.getCurrentUserProfile();
        return socialLinkRepository.findByProfile(profile).stream()
                .map(this::convertToDto)
                .toList();
    }

    public SocialLinkDto addSocialLink(SocialLinkCreateDto createDto) {
        Profile profile = profileService.getCurrentUserProfile();

        SocialLink socialLink = new SocialLink();
        socialLink.setPlatform(createDto.getPlatform());
        socialLink.setUrl(createDto.getUrl());
        socialLink.setProfile(profile);

        socialLink = socialLinkRepository.save(Objects.requireNonNull(socialLink));

        return convertToDto(socialLink);
    }

    public void removeSocialLink(@NonNull UUID id) {
        Profile profile = profileService.getCurrentUserProfile();
        SocialLink socialLink = socialLinkRepository.findByIdAndProfile(id, profile)
                .orElseThrow(() -> new ResourceNotFoundException("Social link not found"));

        socialLinkRepository.delete(Objects.requireNonNull(socialLink));
    }

    private SocialLinkDto convertToDto(SocialLink socialLink) {
        return modelMapper.map(socialLink, SocialLinkDto.class);
    }
}
