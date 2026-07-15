-- Baseline schema, generated from what Hibernate builds on MySQL (ddl-auto=update) at the time Flyway was introduced.
-- Databases created before this file existed are marked as already at version 1 (baseline-on-migrate) instead of
-- running it. Later changes go in new V<n>__description.sql files; never edit an applied migration.

CREATE TABLE `profiles` (
  `id` binary(16) NOT NULL,
  `bio` varchar(1000) DEFAULT NULL,
  `completion_percentage` int NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `deleted_at` datetime(6) DEFAULT NULL,
  `education` varchar(255) DEFAULT NULL,
  `email_notifications` bit(1) NOT NULL,
  `firstname` varchar(255) NOT NULL,
  `is_profile_complete` bit(1) NOT NULL,
  `lastname` varchar(255) NOT NULL,
  `location` varchar(255) DEFAULT NULL,
  `notifications_enabled` bit(1) NOT NULL,
  `open_for_team_invites` bit(1) NOT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `preferred_team_size` varchar(255) DEFAULT NULL,
  `profile_picture_url` varchar(255) DEFAULT NULL,
  `project_notifications` bit(1) NOT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `user_id` binary(16) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK4ixsj6aqve5pxrbw2u0oyk8bb` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `teams` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL,
  `deleted_at` datetime(6) DEFAULT NULL,
  `status` enum('ACTIVE','DISBANDED') NOT NULL,
  `team_name` varchar(255) DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `profile_id` binary(16) NOT NULL,
  `owner_id` binary(16) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_team_profile` (`profile_id`),
  KEY `idx_team_owner` (`owner_id`),
  KEY `idx_team_status` (`status`),
  CONSTRAINT `FK4xpx4w2s2myqnbu6bikvqvbur` FOREIGN KEY (`owner_id`) REFERENCES `profiles` (`id`),
  CONSTRAINT `FKlf1x87vxmvnk3apu3chtq2g28` FOREIGN KEY (`profile_id`) REFERENCES `profiles` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `projects` (
  `id` binary(16) NOT NULL,
  `additional_info` text,
  `budget` varchar(255) DEFAULT NULL,
  `category` varchar(255) DEFAULT NULL,
  `contact_method` varchar(255) DEFAULT NULL,
  `created_at` datetime(6) NOT NULL,
  `deleted_at` datetime(6) DEFAULT NULL,
  `description` varchar(255) DEFAULT NULL,
  `duration` varchar(255) DEFAULT NULL,
  `is_open_source` bit(1) NOT NULL,
  `is_remote` bit(1) NOT NULL,
  `level` enum('ADVANCED','BEGINNER','BRAND_NEW','INTERMEDIATE') DEFAULT NULL,
  `status` enum('ACTIVE','CANCELLED','COMPLETED') NOT NULL,
  `team_size` int NOT NULL,
  `title` varchar(255) DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `profile_id` binary(16) NOT NULL,
  `team_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKq7yx8yib9ptprm2imbn5720wg` (`team_id`),
  KEY `idx_project_profile` (`profile_id`),
  KEY `idx_project_status` (`status`),
  KEY `idx_project_team` (`team_id`),
  KEY `idx_project_created` (`created_at`),
  CONSTRAINT `FKl1no6oi7h2ml9vr8md73hukps` FOREIGN KEY (`profile_id`) REFERENCES `profiles` (`id`),
  CONSTRAINT `FKmqih0928bq6r3gbuh47giq8w` FOREIGN KEY (`team_id`) REFERENCES `teams` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `chat_messages` (
  `id` binary(16) NOT NULL,
  `content` text NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `project_id` binary(16) NOT NULL,
  `sender_id` binary(16) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_chat_project` (`project_id`),
  KEY `idx_chat_sender` (`sender_id`),
  KEY `idx_chat_created` (`created_at`),
  CONSTRAINT `FKoq93kitwgn3vp3h4ooxyqxaam` FOREIGN KEY (`sender_id`) REFERENCES `profiles` (`id`),
  CONSTRAINT `FKp9abl798sxk8na4uw32wnue8h` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `password_tokens` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `attempts` int NOT NULL DEFAULT '0',
  `created_at` datetime(6) DEFAULT NULL,
  `email` varchar(255) NOT NULL,
  `expiry_time` datetime(6) NOT NULL,
  `otp` varchar(255) NOT NULL,
  `token_type` enum('EMAIL_VERIFICATION','PASSWORD_RESET') NOT NULL,
  `used` bit(1) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `profile_project_interests` (
  `profile_id` binary(16) NOT NULL,
  `interest` varchar(255) DEFAULT NULL,
  KEY `FKqvm7e2iekjwvq0sdd7ncrtdr8` (`profile_id`),
  CONSTRAINT `FKqvm7e2iekjwvq0sdd7ncrtdr8` FOREIGN KEY (`profile_id`) REFERENCES `profiles` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `project_files` (
  `id` binary(16) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `file_name` varchar(255) NOT NULL,
  `file_type` varchar(255) DEFAULT NULL,
  `file_url` varchar(255) NOT NULL,
  `size` bigint NOT NULL,
  `project_id` binary(16) NOT NULL,
  `uploaded_by_id` binary(16) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_file_project` (`project_id`),
  KEY `idx_file_uploader` (`uploaded_by_id`),
  KEY `idx_file_created` (`created_at`),
  CONSTRAINT `FK99n7o8h381uklaymcxm66mtl7` FOREIGN KEY (`uploaded_by_id`) REFERENCES `profiles` (`id`),
  CONSTRAINT `FK9o12nrd97y1b5let06xrtu6jo` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `project_technologies` (
  `project_id` binary(16) NOT NULL,
  `technology` varchar(255) DEFAULT NULL,
  KEY `FKm4n7vw6u2ilmq85adm4igx3m1` (`project_id`),
  CONSTRAINT `FKm4n7vw6u2ilmq85adm4igx3m1` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `roles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `role_name` enum('ROLE_ADMIN','ROLE_USER') DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `users` (
  `id` binary(16) NOT NULL,
  `deleted_at` datetime(6) DEFAULT NULL,
  `email` varchar(255) NOT NULL,
  `is_verified` bit(1) NOT NULL,
  `password` varchar(255) NOT NULL,
  `username` varchar(255) NOT NULL,
  `role_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK6dotkott2kjsp8vw4d0m25fb7` (`email`),
  UNIQUE KEY `UKr43af9ap4edm43mmtq01oddj6` (`username`),
  KEY `FKp56c1712k691lhsyewcssf40f` (`role_id`),
  CONSTRAINT `FKp56c1712k691lhsyewcssf40f` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `refresh_tokens` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL,
  `expiry_date` datetime(6) NOT NULL,
  `previous_token` varchar(500) DEFAULT NULL,
  `rotated_at` datetime(6) DEFAULT NULL,
  `token` varchar(500) NOT NULL,
  `user_id` binary(16) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKghpmfn23vmxfu3spu3lfg4r2d` (`token`),
  KEY `FK1lih5y2npsf8u5o3vhdb9y0os` (`user_id`),
  CONSTRAINT `FK1lih5y2npsf8u5o3vhdb9y0os` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `requests` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL,
  `message` text,
  `rejection_reason` text,
  `status` enum('APPROVED','PENDING','REJECTED') DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `project_id` binary(16) NOT NULL,
  `profile_id` binary(16) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_request_project_profile` (`project_id`,`profile_id`),
  KEY `idx_request_project` (`project_id`),
  KEY `idx_request_profile` (`profile_id`),
  KEY `idx_request_status` (`status`),
  KEY `idx_request_created` (`created_at`),
  CONSTRAINT `FKax2lixpprlwreelri5pn4b4hc` FOREIGN KEY (`profile_id`) REFERENCES `profiles` (`id`),
  CONSTRAINT `FKl8yi1pfdloij6g6y456dr5vcv` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `skill_definitions` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL,
  `name` varchar(255) NOT NULL,
  `normalized_name` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_skill_def_normalized` (`normalized_name`),
  UNIQUE KEY `UKt1p19hsywcdhapwg337diwqv2` (`name`),
  KEY `idx_skill_def_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `skills` (
  `id` binary(16) NOT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `modified_at` datetime(6) DEFAULT NULL,
  `proficiency` enum('ADVANCED','BEGINNER','EXPERT','INTERMEDIATE') NOT NULL,
  `skill_definition_id` bigint NOT NULL,
  `profile_id` binary(16) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_skill_profile` (`profile_id`),
  KEY `idx_skill_definition` (`skill_definition_id`),
  CONSTRAINT `FK60dgf0shifcegmvwh3a5qkm8x` FOREIGN KEY (`profile_id`) REFERENCES `profiles` (`id`),
  CONSTRAINT `FKmmfklvm4u25vrn1ycx9mnujry` FOREIGN KEY (`skill_definition_id`) REFERENCES `skill_definitions` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `social_links` (
  `id` binary(16) NOT NULL,
  `platform` enum('GITHUB','LINKEDIN','OTHER','TWITTER','WEBSITE') DEFAULT NULL,
  `url` varchar(255) DEFAULT NULL,
  `profile_id` binary(16) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FKi6lcwvok6fn0er9ml9km11ayn` (`profile_id`),
  CONSTRAINT `FKi6lcwvok6fn0er9ml9km11ayn` FOREIGN KEY (`profile_id`) REFERENCES `profiles` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `tasks` (
  `id` binary(16) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `deadline` datetime(6) NOT NULL,
  `description` text,
  `priority` enum('CRITICAL','HIGH','LOW','MEDIUM') DEFAULT NULL,
  `status` enum('COMPLETED','IN_PROGRESS','PENDING','REVIEW') NOT NULL,
  `title` varchar(255) NOT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `assigned_to` binary(16) DEFAULT NULL,
  `project_id` binary(16) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_task_project` (`project_id`),
  KEY `idx_task_assigned` (`assigned_to`),
  KEY `idx_task_status` (`status`),
  KEY `idx_task_deadline` (`deadline`),
  CONSTRAINT `FKn1r1cpefim1wffluxs7shg8r4` FOREIGN KEY (`assigned_to`) REFERENCES `profiles` (`id`),
  CONSTRAINT `FKsfhn82y57i3k9uxww1s007acc` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `task_tags` (
  `task_id` binary(16) NOT NULL,
  `tag` varchar(255) DEFAULT NULL,
  KEY `FK7xi1reghkj37gqwlr1ujxrxll` (`task_id`),
  CONSTRAINT `FK7xi1reghkj37gqwlr1ujxrxll` FOREIGN KEY (`task_id`) REFERENCES `tasks` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `team_members` (
  `team_id` bigint NOT NULL,
  `profile_id` binary(16) NOT NULL,
  KEY `FK2ia6stepbsseb9k4fon5wqob5` (`profile_id`),
  KEY `FKtgca08el3ofisywcf11f0f76t` (`team_id`),
  CONSTRAINT `FK2ia6stepbsseb9k4fon5wqob5` FOREIGN KEY (`profile_id`) REFERENCES `profiles` (`id`),
  CONSTRAINT `FKtgca08el3ofisywcf11f0f76t` FOREIGN KEY (`team_id`) REFERENCES `teams` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
