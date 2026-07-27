package com.example.backend.services;

import com.example.backend.dto.AchievementDto;
import com.example.backend.dto.AchievementOverviewDto;
import com.example.backend.enums.ProjectStatus;
import com.example.backend.enums.TaskStatus;
import com.example.backend.models.Profile;
import com.example.backend.repositories.ChatMessageRepository;
import com.example.backend.repositories.ProjectFileRepository;
import com.example.backend.repositories.ProjectRepository;
import com.example.backend.repositories.SkillRepository;
import com.example.backend.repositories.TaskRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.EnumMap;
import java.util.List;
import java.util.Map;

/**
 * Badges are rules over existing activity, evaluated on request. Nothing is stored, so there is no claim
 * step and a badge can never be out of step with the data behind it.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AchievementService {

    static final int POINTS_PER_LEVEL = 100;

    /** What a badge counts. */
    enum Metric {
        PROJECTS_CREATED, PROJECTS_COMPLETED, TEAMS_JOINED, LARGEST_TEAM, TASKS_COMPLETED, SKILLS_ADDED,
        PROFILE_COMPLETE, MESSAGES_SENT, FILES_SHARED
    }

    record Badge(String id, String name, String description, String category, String icon, String rarity, int points,
            Metric metric, int required, String requirement) {
    }

    static final List<Badge> CATALOG = List.of(
            new Badge("first_idea", "First Idea", "Posted your first project", "projects", "Rocket", "common", 10,
                    Metric.PROJECTS_CREATED, 1, "Create 1 project"),
            new Badge("builder", "Builder", "Posted five projects", "projects", "Hammer", "rare", 30,
                    Metric.PROJECTS_CREATED, 5, "Create 5 projects"),
            new Badge("finisher", "Finisher", "Completed a project", "projects", "CheckCircle2", "rare", 40,
                    Metric.PROJECTS_COMPLETED, 1, "Mark 1 of your projects as completed"),
            new Badge("team_player", "Team Player", "Joined a project team", "collaborations", "Users", "common", 10,
                    Metric.TEAMS_JOINED, 1, "Join 1 project team"),
            new Badge("collaborator", "Collaborator", "Joined three project teams", "collaborations", "Handshake",
                    "rare", 30, Metric.TEAMS_JOINED, 3, "Join 3 project teams"),
            new Badge("team_leader", "Team Leader", "Led a team of three", "leadership", "Crown", "rare", 40,
                    Metric.LARGEST_TEAM, 3, "Lead a team of 3 people"),
            new Badge("big_team", "Big Team", "Led a team of six", "leadership", "Crown", "epic", 70,
                    Metric.LARGEST_TEAM, 6, "Lead a team of 6 people"),
            new Badge("task_starter", "Getting Things Done", "Completed your first task", "badges", "ListChecks",
                    "common", 10, Metric.TASKS_COMPLETED, 1, "Complete 1 task"),
            new Badge("task_master", "Task Master", "Completed 25 tasks", "badges", "Trophy", "epic", 60,
                    Metric.TASKS_COMPLETED, 25, "Complete 25 tasks"),
            new Badge("communicator", "Communicator", "Sent 50 chat messages", "badges", "MessageSquare", "common", 15,
                    Metric.MESSAGES_SENT, 50, "Send 50 project chat messages"),
            new Badge("file_sharer", "File Sharer", "Shared five files", "badges", "Paperclip", "common", 15,
                    Metric.FILES_SHARED, 5, "Upload 5 project files"),
            new Badge("profile_pro", "Profile Pro", "Completed your profile", "badges", "UserCheck", "common", 15,
                    Metric.PROFILE_COMPLETE, 1, "Complete your profile"),
            new Badge("skilled", "Skilled", "Listed three skills", "skills", "Sparkles", "common", 10,
                    Metric.SKILLS_ADDED, 3, "Add 3 skills to your profile"),
            new Badge("polyglot", "Polyglot", "Listed ten skills", "skills", "Code2", "rare", 35,
                    Metric.SKILLS_ADDED, 10, "Add 10 skills to your profile"));

    private final ProfileService profileService;
    private final ProjectRepository projectRepository;
    private final TaskRepository taskRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final ProjectFileRepository projectFileRepository;
    private final SkillRepository skillRepository;

    public AchievementOverviewDto getMyAchievements() {
        Map<Metric, Integer> metrics = measure(profileService.getCurrentUserProfile());

        List<AchievementDto> achievements = CATALOG.stream().map(badge -> toDto(badge, metrics.get(badge.metric())))
                .toList();

        int points = achievements.stream().filter(AchievementDto::isUnlocked).mapToInt(AchievementDto::getPoints).sum();
        int level = points / POINTS_PER_LEVEL + 1;
        int earned = (int) achievements.stream().filter(AchievementDto::isUnlocked).count();

        return AchievementOverviewDto.builder()
                .achievements(achievements)
                .stats(AchievementOverviewDto.Stats.builder()
                        .projectsCreated(metrics.get(Metric.PROJECTS_CREATED))
                        .projectsCompleted(metrics.get(Metric.PROJECTS_COMPLETED))
                        .collaborations(metrics.get(Metric.TEAMS_JOINED))
                        .tasksCompleted(metrics.get(Metric.TASKS_COMPLETED))
                        .badgesEarned(earned)
                        .totalBadges(CATALOG.size())
                        .totalPoints(points)
                        .level(level)
                        .rank(rank(level))
                        .experience(new AchievementDto.Progress(points % POINTS_PER_LEVEL, POINTS_PER_LEVEL))
                        .build())
                .build();
    }

    /** Counts only: no project, task or skill is loaded, so the cost does not grow with the account's activity. */
    private Map<Metric, Integer> measure(Profile me) {
        java.util.UUID id = me.getId();
        Map<Metric, Integer> metrics = new EnumMap<>(Metric.class);
        metrics.put(Metric.PROJECTS_CREATED, (int) projectRepository.countByCreatedBy_Id(id));
        metrics.put(Metric.PROJECTS_COMPLETED,
                (int) projectRepository.countByCreatedBy_IdAndStatus(id, ProjectStatus.COMPLETED));
        metrics.put(Metric.TEAMS_JOINED, (int) projectRepository.countByTeam_Members_Id(id));
        // The owner counts toward the team they lead
        Integer largestTeamMembers = projectRepository.findLargestTeamMemberCount(id);
        metrics.put(Metric.LARGEST_TEAM, largestTeamMembers == null ? 0 : largestTeamMembers + 1);
        metrics.put(Metric.TASKS_COMPLETED, (int) taskRepository.countByAssignedToIdAndStatus(id, TaskStatus.COMPLETED));
        metrics.put(Metric.SKILLS_ADDED, (int) skillRepository.countByProfile_Id(id));
        metrics.put(Metric.PROFILE_COMPLETE, me.isProfileComplete() ? 1 : 0);
        metrics.put(Metric.MESSAGES_SENT, (int) chatMessageRepository.countBySenderId(id));
        metrics.put(Metric.FILES_SHARED, (int) projectFileRepository.countByUploadedById(id));
        return metrics;
    }

    private AchievementDto toDto(Badge badge, int current) {
        return AchievementDto.builder()
                .id(badge.id())
                .name(badge.name())
                .description(badge.description())
                .category(badge.category())
                .icon(badge.icon())
                .rarity(badge.rarity())
                .points(badge.points())
                .unlocked(current >= badge.required())
                .progress(new AchievementDto.Progress(Math.min(current, badge.required()), badge.required()))
                .requirements(List.of(badge.requirement()))
                .build();
    }

    static String rank(int level) {
        if (level >= 7) {
            return "Veteran";
        }
        if (level >= 4) {
            return "Collaborator";
        }
        if (level >= 2) {
            return "Contributor";
        }
        return "Newcomer";
    }
}
