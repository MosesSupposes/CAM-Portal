-- Cosmic Astrological Minds (C.A.M.) MySQL Database Schema
-- Squad E: Database & MySQL Engineering

CREATE DATABASE IF NOT EXISTS `cam_astrology_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `cam_astrology_db`;

-- 1. Zodiac Signs Master Table
CREATE TABLE IF NOT EXISTS `zodiac_signs` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(50) NOT NULL UNIQUE,
    `symbol` VARCHAR(10) NOT NULL,
    `element` ENUM('Fire', 'Earth', 'Air', 'Water') NOT NULL,
    `modality` ENUM('Cardinal', 'Fixed', 'Mutable') NOT NULL,
    `ruling_planet` VARCHAR(50) NOT NULL,
    `date_range` VARCHAR(50) NOT NULL,
    `traits` TEXT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 2. User Accounts & Authentication (Sanctum Compatible)
CREATE TABLE IF NOT EXISTS `users` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(255) NOT NULL,
    `email` VARCHAR(255) NOT NULL UNIQUE,
    `email_verified_at` TIMESTAMP NULL,
    `password` VARCHAR(255) NOT NULL,
    `role` ENUM('superadmin', 'officer', 'member', 'guest') DEFAULT 'member',
    `remember_token` VARCHAR(100) NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_users_role` (`role`)
) ENGINE=InnoDB;

-- 3. Club Members Profiles (Incorporating members.csv)
CREATE TABLE IF NOT EXISTS `members` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `user_id` BIGINT UNSIGNED NULL,
    `full_name` VARCHAR(255) NOT NULL,
    `email` VARCHAR(255) NULL,
    `phone` VARCHAR(50) NULL,
    `gender_identity` VARCHAR(50) NULL,
    `zodiac_sign_id` INT UNSIGNED NULL,
    `zodiac_sign_name` VARCHAR(50) NOT NULL,
    `club_status` ENUM('active', 'alumni', 'pending', 'officer') DEFAULT 'active',
    `bio` TEXT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`zodiac_sign_id`) REFERENCES `zodiac_signs`(`id`) ON DELETE SET NULL,
    INDEX `idx_members_sign` (`zodiac_sign_name`),
    INDEX `idx_members_status` (`club_status`)
) ENGINE=InnoDB;

-- 4. Celestial Events & Gatherings
CREATE TABLE IF NOT EXISTS `events` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `title` VARCHAR(255) NOT NULL,
    `slug` VARCHAR(255) NOT NULL UNIQUE,
    `description` TEXT NOT NULL,
    `event_type` ENUM('meeting', 'stargazing', 'workshop', 'social', 'transits') DEFAULT 'meeting',
    `location` VARCHAR(255) NOT NULL,
    `event_date` DATETIME NOT NULL,
    `celestial_alignment` VARCHAR(255) NULL, -- e.g. "Full Moon in Scorpio"
    `max_attendees` INT UNSIGNED NULL,
    `created_by` BIGINT UNSIGNED NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 5. Event RSVPs
CREATE TABLE IF NOT EXISTS `event_rsvps` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `event_id` BIGINT UNSIGNED NOT NULL,
    `member_id` BIGINT UNSIGNED NOT NULL,
    `status` ENUM('attending', 'maybe', 'declined') DEFAULT 'attending',
    `guests_count` INT UNSIGNED DEFAULT 0,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY `unique_event_member` (`event_id`, `member_id`),
    FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 6. Audit & Activity Logs
CREATE TABLE IF NOT EXISTS `audit_logs` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `user_id` BIGINT UNSIGNED NULL,
    `action` VARCHAR(255) NOT NULL,
    `entity_type` VARCHAR(100) NOT NULL,
    `entity_id` BIGINT UNSIGNED NULL,
    `details` JSON NULL,
    `ip_address` VARCHAR(45) NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB;
