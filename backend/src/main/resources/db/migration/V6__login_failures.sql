-- Failed logins, counted by LoginThrottle against a key (username + address, username, address). They used to be kept in
-- the memory of one instance, so every instance had its own counters and a restart forgot them; in the database all
-- instances share them. Rows older than the 15 minute window are deleted by the scheduled cleanup.
CREATE TABLE `login_failures` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `attempted_at` datetime(6) NOT NULL,
  `throttle_key` varchar(200) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_login_failure_key_time` (`throttle_key`,`attempted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
