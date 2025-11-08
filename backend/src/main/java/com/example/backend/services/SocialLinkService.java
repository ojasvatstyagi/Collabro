package com.example.backend.services;

import com.example.backend.dto.SocialLinkDto;
import com.example.backend.exceptions.ResourceNotFoundException;
import com.example.backend.models.Profile;
import com.example.backend.models.SocialLink;
import com.example.backend.repositories.SocialLinkRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SocialLinkService {

    private final ProfileService profileService;
    private final ModelMapper modelMapper;
    private final SocialLinkRepository socialLinkRepository;

    public List<SocialLinkDto> getCurrentUserSocialLinks() {
        Profile profile = profileService.getCurrentUserProfile();
        if (profile == null) return new ArrayList<>();
        List<SocialLink> socialLinks = profile.getSocialLinks();

        return socialLinks.stream()
                .map(socialLink -> modelMapper.map(socialLink, SocialLinkDto.class))
                .toList();
    }

    public SocialLinkDto addSocialLink(SocialLinkDto socialLinkDto) {
        Profile profile = profileService.getCurrentUserProfile();
        SocialLink socialLink = modelMapper.map(socialLinkDto, SocialLink.class);
        socialLink.setProfile(profile);
        return modelMapper.map(socialLinkRepository.save(socialLink), SocialLinkDto.class);
    }

    public SocialLinkDto updateSocialLink(UUID id, @Valid SocialLinkDto socialLinkDto) {
        SocialLink socialLink = socialLinkRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Social link not found"));

        socialLink.setUrl(socialLinkDto.getUrl());
        socialLink.setPlatform(socialLinkDto.getPlatform());
        socialLinkRepository.save(socialLink);
        return modelMapper.map(socialLink, SocialLinkDto.class);
    }

    public void deleteSocialLink(UUID id) {
        socialLinkRepository.deleteById(id);
    }
}
