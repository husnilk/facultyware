-- MariaDB dump 10.19  Distrib 10.4.32-MariaDB, for Win64 (AMD64)
--
-- Host: localhost    Database: facultyware
-- ------------------------------------------------------
-- Server version	10.4.32-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Current Database: `facultyware`
--

/*!40000 DROP DATABASE IF EXISTS `facultyware`*/;

CREATE DATABASE /*!32312 IF NOT EXISTS*/ `facultyware` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci */;

USE `facultyware`;

--
-- Table structure for table `asset_audit_details`
--

DROP TABLE IF EXISTS `asset_audit_details`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `asset_audit_details` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `asset_audit_id` bigint(20) unsigned NOT NULL,
  `asset_id` bigint(20) unsigned NOT NULL,
  `condition` enum('good','minor_damage','major_damage','missing') NOT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `asset_audit_details_asset_audit_id_foreign` (`asset_audit_id`),
  KEY `asset_audit_details_asset_id_foreign` (`asset_id`),
  CONSTRAINT `asset_audit_details_asset_audit_id_foreign` FOREIGN KEY (`asset_audit_id`) REFERENCES `asset_audits` (`id`),
  CONSTRAINT `asset_audit_details_asset_id_foreign` FOREIGN KEY (`asset_id`) REFERENCES `assets` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `asset_audit_details`
--

LOCK TABLES `asset_audit_details` WRITE;
/*!40000 ALTER TABLE `asset_audit_details` DISABLE KEYS */;
/*!40000 ALTER TABLE `asset_audit_details` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `asset_audits`
--

DROP TABLE IF EXISTS `asset_audits`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `asset_audits` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `audit_number` varchar(255) NOT NULL,
  `audit_date` date NOT NULL,
  `conducted_by` bigint(20) unsigned NOT NULL,
  `description` text DEFAULT NULL,
  `employee_id` bigint(20) unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `asset_audits_audit_number_unique` (`audit_number`),
  KEY `asset_audits_conducted_by_foreign` (`conducted_by`),
  CONSTRAINT `asset_audits_conducted_by_foreign` FOREIGN KEY (`conducted_by`) REFERENCES `employees` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `asset_audits`
--

LOCK TABLES `asset_audits` WRITE;
/*!40000 ALTER TABLE `asset_audits` DISABLE KEYS */;
/*!40000 ALTER TABLE `asset_audits` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `asset_grants`
--

DROP TABLE IF EXISTS `asset_grants`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `asset_grants` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `source` varchar(255) NOT NULL,
  `grant_date` date NOT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `asset_grants`
--

LOCK TABLES `asset_grants` WRITE;
/*!40000 ALTER TABLE `asset_grants` DISABLE KEYS */;
/*!40000 ALTER TABLE `asset_grants` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `asset_insurance_claims`
--

DROP TABLE IF EXISTS `asset_insurance_claims`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `asset_insurance_claims` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `asset_insurance_id` bigint(20) unsigned NOT NULL,
  `claim_date` date NOT NULL,
  `claim_amount` decimal(14,2) NOT NULL,
  `description` text DEFAULT NULL,
  `status` enum('submitted','approved','rejected','paid') NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `asset_insurance_claims_asset_insurance_id_foreign` (`asset_insurance_id`),
  CONSTRAINT `asset_insurance_claims_asset_insurance_id_foreign` FOREIGN KEY (`asset_insurance_id`) REFERENCES `asset_insurances` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `asset_insurance_claims`
--

LOCK TABLES `asset_insurance_claims` WRITE;
/*!40000 ALTER TABLE `asset_insurance_claims` DISABLE KEYS */;
/*!40000 ALTER TABLE `asset_insurance_claims` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `asset_insurances`
--

DROP TABLE IF EXISTS `asset_insurances`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `asset_insurances` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `asset_id` bigint(20) unsigned NOT NULL,
  `policy_number` varchar(255) NOT NULL,
  `provider` varchar(255) NOT NULL,
  `coverage_amount` decimal(14,2) NOT NULL,
  `premium` decimal(14,2) DEFAULT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `status` enum('active','expired','claimed') NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `asset_insurances_asset_id_foreign` (`asset_id`),
  CONSTRAINT `asset_insurances_asset_id_foreign` FOREIGN KEY (`asset_id`) REFERENCES `assets` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `asset_insurances`
--

LOCK TABLES `asset_insurances` WRITE;
/*!40000 ALTER TABLE `asset_insurances` DISABLE KEYS */;
/*!40000 ALTER TABLE `asset_insurances` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `asset_tracking_logs`
--

DROP TABLE IF EXISTS `asset_tracking_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `asset_tracking_logs` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `asset_id` bigint(20) unsigned NOT NULL,
  `from_location` varchar(255) DEFAULT NULL,
  `to_location` varchar(255) DEFAULT NULL,
  `moved_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `moved_by` bigint(20) unsigned DEFAULT NULL,
  `employee_id` bigint(20) unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `asset_tracking_logs_asset_id_foreign` (`asset_id`),
  KEY `asset_tracking_logs_moved_by_foreign` (`moved_by`),
  CONSTRAINT `asset_tracking_logs_asset_id_foreign` FOREIGN KEY (`asset_id`) REFERENCES `assets` (`id`),
  CONSTRAINT `asset_tracking_logs_moved_by_foreign` FOREIGN KEY (`moved_by`) REFERENCES `employees` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `asset_tracking_logs`
--

LOCK TABLES `asset_tracking_logs` WRITE;
/*!40000 ALTER TABLE `asset_tracking_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `asset_tracking_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `asset_trackings`
--

DROP TABLE IF EXISTS `asset_trackings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `asset_trackings` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `asset_id` bigint(20) unsigned NOT NULL,
  `location` varchar(255) DEFAULT NULL,
  `latitude` decimal(10,6) DEFAULT NULL,
  `longitude` decimal(10,6) DEFAULT NULL,
  `tracked_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `notes` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `asset_trackings_asset_id_foreign` (`asset_id`),
  CONSTRAINT `asset_trackings_asset_id_foreign` FOREIGN KEY (`asset_id`) REFERENCES `assets` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `asset_trackings`
--

LOCK TABLES `asset_trackings` WRITE;
/*!40000 ALTER TABLE `asset_trackings` DISABLE KEYS */;
/*!40000 ALTER TABLE `asset_trackings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `assets`
--

DROP TABLE IF EXISTS `assets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `assets` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `code` varchar(255) NOT NULL,
  `type` enum('equipment','room') NOT NULL,
  `acquisition_type` enum('procurement','grant') NOT NULL,
  `acquisition_date` date NOT NULL,
  `acquisition_cost` decimal(14,2) DEFAULT NULL,
  `asset_grant_id` bigint(20) unsigned DEFAULT NULL,
  `condition` enum('good','minor_damage','major_damage') NOT NULL,
  `status` enum('available','in_use','maintenance','retired') NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `assets_code_unique` (`code`),
  KEY `assets_asset_grant_id_foreign` (`asset_grant_id`),
  CONSTRAINT `assets_asset_grant_id_foreign` FOREIGN KEY (`asset_grant_id`) REFERENCES `asset_grants` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `assets`
--

LOCK TABLES `assets` WRITE;
/*!40000 ALTER TABLE `assets` DISABLE KEYS */;
/*!40000 ALTER TABLE `assets` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `assignment_progress`
--

DROP TABLE IF EXISTS `assignment_progress`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `assignment_progress` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `assignment_id` bigint(20) unsigned NOT NULL,
  `description` text DEFAULT NULL,
  `progress_date` date NOT NULL,
  `status` enum('in_progress','completed') NOT NULL,
  `attachment` varchar(255) DEFAULT NULL,
  `created_by` bigint(20) unsigned NOT NULL,
  `employee_id` bigint(20) unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `assignment_progress_assignment_id_foreign` (`assignment_id`),
  KEY `assignment_progress_created_by_foreign` (`created_by`),
  CONSTRAINT `assignment_progress_assignment_id_foreign` FOREIGN KEY (`assignment_id`) REFERENCES `assignments` (`id`),
  CONSTRAINT `assignment_progress_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `employees` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `assignment_progress`
--

LOCK TABLES `assignment_progress` WRITE;
/*!40000 ALTER TABLE `assignment_progress` DISABLE KEYS */;
/*!40000 ALTER TABLE `assignment_progress` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `assignments`
--

DROP TABLE IF EXISTS `assignments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `assignments` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `assigned_by` bigint(20) unsigned NOT NULL,
  `assigned_to` bigint(20) unsigned NOT NULL,
  `parent_id` bigint(20) unsigned DEFAULT NULL,
  `start_date` date DEFAULT NULL,
  `due_date` date DEFAULT NULL,
  `status` enum('assigned','in_progress','completed','delegated','cancelled') NOT NULL,
  `priority` enum('low','medium','high') NOT NULL,
  `assigned_by_id` bigint(20) unsigned NOT NULL,
  `assigned_to_id` bigint(20) unsigned NOT NULL,
  `parent_id_id` bigint(20) unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `assignments_assigned_by_foreign` (`assigned_by`),
  KEY `assignments_assigned_to_foreign` (`assigned_to`),
  KEY `assignments_parent_id_foreign` (`parent_id`),
  CONSTRAINT `assignments_assigned_by_foreign` FOREIGN KEY (`assigned_by`) REFERENCES `employees` (`id`),
  CONSTRAINT `assignments_assigned_to_foreign` FOREIGN KEY (`assigned_to`) REFERENCES `employees` (`id`),
  CONSTRAINT `assignments_parent_id_foreign` FOREIGN KEY (`parent_id`) REFERENCES `assignments` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `assignments`
--

LOCK TABLES `assignments` WRITE;
/*!40000 ALTER TABLE `assignments` DISABLE KEYS */;
/*!40000 ALTER TABLE `assignments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `attendances`
--

DROP TABLE IF EXISTS `attendances`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `attendances` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `employee_id` bigint(20) unsigned NOT NULL,
  `date` date NOT NULL,
  `check_in` datetime DEFAULT NULL,
  `check_out` datetime DEFAULT NULL,
  `status` enum('present','absent','leave','overtime','holiday') NOT NULL,
  `notes` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `attendances_employee_id_foreign` (`employee_id`),
  CONSTRAINT `attendances_employee_id_foreign` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `attendances`
--

LOCK TABLES `attendances` WRITE;
/*!40000 ALTER TABLE `attendances` DISABLE KEYS */;
/*!40000 ALTER TABLE `attendances` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `buildings`
--

DROP TABLE IF EXISTS `buildings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `buildings` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `code` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `buildings_code_unique` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `buildings`
--

LOCK TABLES `buildings` WRITE;
/*!40000 ALTER TABLE `buildings` DISABLE KEYS */;
/*!40000 ALTER TABLE `buildings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cache`
--

DROP TABLE IF EXISTS `cache`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `cache` (
  `key` varchar(255) NOT NULL,
  `value` mediumtext NOT NULL,
  `expiration` int(11) NOT NULL,
  PRIMARY KEY (`key`),
  KEY `cache_expiration_index` (`expiration`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cache`
--

LOCK TABLES `cache` WRITE;
/*!40000 ALTER TABLE `cache` DISABLE KEYS */;
/*!40000 ALTER TABLE `cache` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cache_locks`
--

DROP TABLE IF EXISTS `cache_locks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `cache_locks` (
  `key` varchar(255) NOT NULL,
  `owner` varchar(255) NOT NULL,
  `expiration` int(11) NOT NULL,
  PRIMARY KEY (`key`),
  KEY `cache_locks_expiration_index` (`expiration`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cache_locks`
--

LOCK TABLES `cache_locks` WRITE;
/*!40000 ALTER TABLE `cache_locks` DISABLE KEYS */;
/*!40000 ALTER TABLE `cache_locks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `committee_budget_items`
--

DROP TABLE IF EXISTS `committee_budget_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `committee_budget_items` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `committee_budget_id` bigint(20) unsigned NOT NULL,
  `name` varchar(255) NOT NULL,
  `quantity` int(11) NOT NULL,
  `unit_price` decimal(14,2) NOT NULL,
  `total_price` decimal(14,2) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `committee_budget_items_committee_budget_id_foreign` (`committee_budget_id`),
  CONSTRAINT `committee_budget_items_committee_budget_id_foreign` FOREIGN KEY (`committee_budget_id`) REFERENCES `committee_budgets` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `committee_budget_items`
--

LOCK TABLES `committee_budget_items` WRITE;
/*!40000 ALTER TABLE `committee_budget_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `committee_budget_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `committee_budgets`
--

DROP TABLE IF EXISTS `committee_budgets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `committee_budgets` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `committee_id` bigint(20) unsigned NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `total_amount` decimal(14,2) NOT NULL,
  `used_amount` decimal(14,2) NOT NULL DEFAULT 0.00,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `committee_budgets_committee_id_foreign` (`committee_id`),
  CONSTRAINT `committee_budgets_committee_id_foreign` FOREIGN KEY (`committee_id`) REFERENCES `committees` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `committee_budgets`
--

LOCK TABLES `committee_budgets` WRITE;
/*!40000 ALTER TABLE `committee_budgets` DISABLE KEYS */;
/*!40000 ALTER TABLE `committee_budgets` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `committee_expenses`
--

DROP TABLE IF EXISTS `committee_expenses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `committee_expenses` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `committee_budget_item_id` bigint(20) unsigned NOT NULL,
  `amount` decimal(14,2) NOT NULL,
  `description` text DEFAULT NULL,
  `receipt_file` varchar(255) DEFAULT NULL,
  `expense_date` date NOT NULL,
  `status` enum('submitted','approved','rejected') NOT NULL,
  `approved_by` bigint(20) unsigned DEFAULT NULL,
  `employee_id` bigint(20) unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `committee_expenses_committee_budget_item_id_foreign` (`committee_budget_item_id`),
  KEY `committee_expenses_approved_by_foreign` (`approved_by`),
  CONSTRAINT `committee_expenses_approved_by_foreign` FOREIGN KEY (`approved_by`) REFERENCES `employees` (`id`),
  CONSTRAINT `committee_expenses_committee_budget_item_id_foreign` FOREIGN KEY (`committee_budget_item_id`) REFERENCES `committee_budget_items` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `committee_expenses`
--

LOCK TABLES `committee_expenses` WRITE;
/*!40000 ALTER TABLE `committee_expenses` DISABLE KEYS */;
/*!40000 ALTER TABLE `committee_expenses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `committee_external_members`
--

DROP TABLE IF EXISTS `committee_external_members`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `committee_external_members` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `committee_id` bigint(20) unsigned NOT NULL,
  `name` varchar(255) NOT NULL,
  `institution` varchar(255) DEFAULT NULL,
  `role` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `committee_external_members_committee_id_foreign` (`committee_id`),
  CONSTRAINT `committee_external_members_committee_id_foreign` FOREIGN KEY (`committee_id`) REFERENCES `committees` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `committee_external_members`
--

LOCK TABLES `committee_external_members` WRITE;
/*!40000 ALTER TABLE `committee_external_members` DISABLE KEYS */;
/*!40000 ALTER TABLE `committee_external_members` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `committee_members`
--

DROP TABLE IF EXISTS `committee_members`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `committee_members` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `committee_id` bigint(20) unsigned NOT NULL,
  `employee_id` bigint(20) unsigned NOT NULL,
  `role` varchar(255) NOT NULL,
  `is_leader` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `committee_members_committee_id_foreign` (`committee_id`),
  KEY `committee_members_employee_id_foreign` (`employee_id`),
  CONSTRAINT `committee_members_committee_id_foreign` FOREIGN KEY (`committee_id`) REFERENCES `committees` (`id`),
  CONSTRAINT `committee_members_employee_id_foreign` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `committee_members`
--

LOCK TABLES `committee_members` WRITE;
/*!40000 ALTER TABLE `committee_members` DISABLE KEYS */;
/*!40000 ALTER TABLE `committee_members` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `committee_task_progress`
--

DROP TABLE IF EXISTS `committee_task_progress`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `committee_task_progress` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `committee_task_id` bigint(20) unsigned NOT NULL,
  `description` text DEFAULT NULL,
  `progress_date` date NOT NULL,
  `status` enum('in_progress','done') NOT NULL,
  `attachment` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `committee_task_progress_committee_task_id_foreign` (`committee_task_id`),
  CONSTRAINT `committee_task_progress_committee_task_id_foreign` FOREIGN KEY (`committee_task_id`) REFERENCES `committee_tasks` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `committee_task_progress`
--

LOCK TABLES `committee_task_progress` WRITE;
/*!40000 ALTER TABLE `committee_task_progress` DISABLE KEYS */;
/*!40000 ALTER TABLE `committee_task_progress` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `committee_tasks`
--

DROP TABLE IF EXISTS `committee_tasks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `committee_tasks` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `committee_id` bigint(20) unsigned NOT NULL,
  `assigned_to` bigint(20) unsigned DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `start_date` date DEFAULT NULL,
  `due_date` date DEFAULT NULL,
  `priority` enum('low','medium','high') NOT NULL,
  `status` enum('todo','in_progress','done','blocked') NOT NULL,
  `committee_member_id` bigint(20) unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `committee_tasks_committee_id_foreign` (`committee_id`),
  KEY `committee_tasks_assigned_to_foreign` (`assigned_to`),
  CONSTRAINT `committee_tasks_assigned_to_foreign` FOREIGN KEY (`assigned_to`) REFERENCES `committee_members` (`id`),
  CONSTRAINT `committee_tasks_committee_id_foreign` FOREIGN KEY (`committee_id`) REFERENCES `committees` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `committee_tasks`
--

LOCK TABLES `committee_tasks` WRITE;
/*!40000 ALTER TABLE `committee_tasks` DISABLE KEYS */;
/*!40000 ALTER TABLE `committee_tasks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `committees`
--

DROP TABLE IF EXISTS `committees`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `committees` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `objective` text NOT NULL,
  `expected_outcome` text DEFAULT NULL,
  `start_date` date NOT NULL,
  `end_date` date DEFAULT NULL,
  `created_by` bigint(20) unsigned NOT NULL,
  `status` enum('draft','active','completed','cancelled') NOT NULL,
  `employee_id` bigint(20) unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `committees_created_by_foreign` (`created_by`),
  CONSTRAINT `committees_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `employees` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `committees`
--

LOCK TABLES `committees` WRITE;
/*!40000 ALTER TABLE `committees` DISABLE KEYS */;
/*!40000 ALTER TABLE `committees` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `community_service_members`
--

DROP TABLE IF EXISTS `community_service_members`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `community_service_members` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `community_service_id` bigint(20) unsigned NOT NULL,
  `lecturer_id` bigint(20) unsigned NOT NULL,
  `role` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `community_service_members_community_service_id_foreign` (`community_service_id`),
  KEY `community_service_members_lecturer_id_foreign` (`lecturer_id`),
  CONSTRAINT `community_service_members_community_service_id_foreign` FOREIGN KEY (`community_service_id`) REFERENCES `community_services` (`id`),
  CONSTRAINT `community_service_members_lecturer_id_foreign` FOREIGN KEY (`lecturer_id`) REFERENCES `lecturers` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `community_service_members`
--

LOCK TABLES `community_service_members` WRITE;
/*!40000 ALTER TABLE `community_service_members` DISABLE KEYS */;
/*!40000 ALTER TABLE `community_service_members` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `community_services`
--

DROP TABLE IF EXISTS `community_services`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `community_services` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `location` varchar(255) NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date DEFAULT NULL,
  `funding_source` varchar(255) DEFAULT NULL,
  `status` enum('proposed','ongoing','completed') NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `community_services`
--

LOCK TABLES `community_services` WRITE;
/*!40000 ALTER TABLE `community_services` DISABLE KEYS */;
/*!40000 ALTER TABLE `community_services` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `conference_proceedings`
--

DROP TABLE IF EXISTS `conference_proceedings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `conference_proceedings` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `publication_id` bigint(20) unsigned NOT NULL,
  `conference_name` varchar(255) NOT NULL,
  `conference_location` varchar(255) DEFAULT NULL,
  `conference_date` date DEFAULT NULL,
  `publisher` varchar(255) DEFAULT NULL,
  `isbn` varchar(255) DEFAULT NULL,
  `pages` varchar(255) DEFAULT NULL,
  `indexing` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `conference_proceedings_publication_id_foreign` (`publication_id`),
  CONSTRAINT `conference_proceedings_publication_id_foreign` FOREIGN KEY (`publication_id`) REFERENCES `publications` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `conference_proceedings`
--

LOCK TABLES `conference_proceedings` WRITE;
/*!40000 ALTER TABLE `conference_proceedings` DISABLE KEYS */;
/*!40000 ALTER TABLE `conference_proceedings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `document_revisions`
--

DROP TABLE IF EXISTS `document_revisions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `document_revisions` (
  `id` int(11) NOT NULL,
  `document_id` bigint(20) unsigned NOT NULL,
  `rev_no` int(11) DEFAULT NULL,
  `doc_date` int(11) DEFAULT NULL,
  `doc_month` int(11) DEFAULT NULL,
  `doc_year` int(11) DEFAULT NULL,
  `active` tinyint(4) DEFAULT NULL,
  `uploaded_file` varchar(45) DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_document_revisions_documents1_idx` (`document_id`),
  CONSTRAINT `fk_document_revisions_documents1` FOREIGN KEY (`document_id`) REFERENCES `documents` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `document_revisions`
--

LOCK TABLES `document_revisions` WRITE;
/*!40000 ALTER TABLE `document_revisions` DISABLE KEYS */;
/*!40000 ALTER TABLE `document_revisions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `document_types`
--

DROP TABLE IF EXISTS `document_types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `document_types` (
  `id` bigint(20) unsigned NOT NULL,
  `name` varchar(45) DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `document_types`
--

LOCK TABLES `document_types` WRITE;
/*!40000 ALTER TABLE `document_types` DISABLE KEYS */;
/*!40000 ALTER TABLE `document_types` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `documents`
--

DROP TABLE IF EXISTS `documents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `documents` (
  `id` bigint(20) unsigned NOT NULL,
  `name` varchar(45) DEFAULT NULL,
  `document_type_id` bigint(20) unsigned DEFAULT NULL,
  `doc_no` varchar(45) DEFAULT NULL,
  `unit_owner` bigint(20) unsigned DEFAULT NULL,
  `published` tinyint(4) DEFAULT NULL,
  `scope` varchar(45) DEFAULT NULL,
  `created_by` bigint(20) unsigned DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_documents_users1_idx` (`created_by`),
  KEY `fk_documents_document_types1_idx` (`document_type_id`),
  CONSTRAINT `fk_documents_document_types1` FOREIGN KEY (`document_type_id`) REFERENCES `document_types` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `fk_documents_users1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `documents`
--

LOCK TABLES `documents` WRITE;
/*!40000 ALTER TABLE `documents` DISABLE KEYS */;
/*!40000 ALTER TABLE `documents` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `education_histories`
--

DROP TABLE IF EXISTS `education_histories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `education_histories` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `employee_id` bigint(20) unsigned NOT NULL,
  `degree` varchar(255) NOT NULL,
  `institution` varchar(255) NOT NULL,
  `major` varchar(255) DEFAULT NULL,
  `start_year` year(4) NOT NULL,
  `end_year` year(4) DEFAULT NULL,
  `gpa` decimal(3,2) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `education_histories_employee_id_foreign` (`employee_id`),
  CONSTRAINT `education_histories_employee_id_foreign` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `education_histories`
--

LOCK TABLES `education_histories` WRITE;
/*!40000 ALTER TABLE `education_histories` DISABLE KEYS */;
/*!40000 ALTER TABLE `education_histories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `employee_grades`
--

DROP TABLE IF EXISTS `employee_grades`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `employee_grades` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `employee_grades`
--

LOCK TABLES `employee_grades` WRITE;
/*!40000 ALTER TABLE `employee_grades` DISABLE KEYS */;
/*!40000 ALTER TABLE `employee_grades` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `employees`
--

DROP TABLE IF EXISTS `employees`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `employees` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `employee_number` varchar(255) NOT NULL,
  `national_id_number` varchar(255) DEFAULT NULL,
  `tax_id_number` varchar(255) DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `birth_place` varchar(255) NOT NULL,
  `birth_date` date NOT NULL,
  `gender` enum('male','female') NOT NULL,
  `religion` varchar(255) DEFAULT NULL,
  `marital_status` enum('single','married','divorced') NOT NULL,
  `address` text NOT NULL,
  `phone_number` varchar(255) DEFAULT NULL,
  `organization_unit_id` bigint(20) unsigned NOT NULL,
  `hire_date` date NOT NULL,
  `employment_status_id` bigint(20) unsigned NOT NULL,
  `status` enum('active','inactive') NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `employees_employee_number_unique` (`employee_number`),
  KEY `employees_organization_unit_id_foreign` (`organization_unit_id`),
  KEY `employees_employment_status_id_foreign` (`employment_status_id`),
  CONSTRAINT `employees_employment_status_id_foreign` FOREIGN KEY (`employment_status_id`) REFERENCES `employment_statuses` (`id`),
  CONSTRAINT `employees_organization_unit_id_foreign` FOREIGN KEY (`organization_unit_id`) REFERENCES `organization_units` (`id`),
  CONSTRAINT `employees_user_id_foreign` FOREIGN KEY (`id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `employees`
--

LOCK TABLES `employees` WRITE;
/*!40000 ALTER TABLE `employees` DISABLE KEYS */;
INSERT INTO `employees` VALUES (1,'EMP0001',NULL,NULL,'Admin SIP','Padang','2000-01-01','male',NULL,'single','Kampus Unand, Limau Manis',NULL,1,'2024-01-01',1,'active','2026-06-04 01:37:33','2026-06-04 01:37:33'),(2,'EMP0002',NULL,NULL,'Wakil Dekan','Padang','2000-01-01','male',NULL,'single','Kampus Unand, Limau Manis',NULL,1,'2024-01-01',1,'active','2026-06-04 01:37:33','2026-06-04 01:37:33');
/*!40000 ALTER TABLE `employees` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `employment_statuses`
--

DROP TABLE IF EXISTS `employment_statuses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `employment_statuses` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `employment_statuses`
--

LOCK TABLES `employment_statuses` WRITE;
/*!40000 ALTER TABLE `employment_statuses` DISABLE KEYS */;
INSERT INTO `employment_statuses` VALUES (1,'PNS','Pegawai Negeri Sipil','2026-06-04 01:37:33','2026-06-04 01:37:33');
/*!40000 ALTER TABLE `employment_statuses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `equipment_loans`
--

DROP TABLE IF EXISTS `equipment_loans`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `equipment_loans` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `equipment_id` bigint(20) unsigned NOT NULL,
  `employee_id` bigint(20) unsigned NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date DEFAULT NULL,
  `status` enum('requested','approved','rejected','returned') NOT NULL,
  `approved_by` bigint(20) unsigned DEFAULT NULL,
  `approved_by_id` bigint(20) unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `asset_loans_employee_id_foreign` (`employee_id`),
  KEY `asset_loans_approved_by_foreign` (`approved_by`),
  KEY `asset_loans_asset_equipment_id_foreign_idx` (`equipment_id`),
  CONSTRAINT `asset_loans_approved_by_foreign` FOREIGN KEY (`approved_by`) REFERENCES `employees` (`id`),
  CONSTRAINT `asset_loans_asset_equipment_id_foreign` FOREIGN KEY (`equipment_id`) REFERENCES `equipments` (`id`),
  CONSTRAINT `asset_loans_employee_id_foreign` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `equipment_loans`
--

LOCK TABLES `equipment_loans` WRITE;
/*!40000 ALTER TABLE `equipment_loans` DISABLE KEYS */;
/*!40000 ALTER TABLE `equipment_loans` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `equipment_maintenance_request_log`
--

DROP TABLE IF EXISTS `equipment_maintenance_request_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `equipment_maintenance_request_log` (
  `id` bigint(20) NOT NULL,
  `equipment_maintenance_request_id` bigint(20) unsigned DEFAULT NULL,
  `log` varchar(45) DEFAULT NULL,
  `logged_by` bigint(20) unsigned DEFAULT NULL,
  `logged_at` datetime DEFAULT NULL,
  `log_file` varchar(255) DEFAULT NULL,
  `verified_by` bigint(20) unsigned DEFAULT NULL,
  `verified_at` datetime DEFAULT NULL,
  `verification_file` varchar(255) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `status` int(11) DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_equipment_maintenance_request_log_equipment_maintenance__idx` (`equipment_maintenance_request_id`),
  KEY `fk_equipment_maintenance_request_log_employees1_idx` (`logged_by`),
  KEY `fk_equipment_maintenance_request_log_employees2_idx` (`verified_by`),
  CONSTRAINT `fk_equipment_maintenance_request_log_employees1` FOREIGN KEY (`logged_by`) REFERENCES `employees` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `fk_equipment_maintenance_request_log_employees2` FOREIGN KEY (`verified_by`) REFERENCES `employees` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `fk_equipment_maintenance_request_log_equipment_maintenance_re1` FOREIGN KEY (`equipment_maintenance_request_id`) REFERENCES `equipment_maintenance_requests` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `equipment_maintenance_request_log`
--

LOCK TABLES `equipment_maintenance_request_log` WRITE;
/*!40000 ALTER TABLE `equipment_maintenance_request_log` DISABLE KEYS */;
/*!40000 ALTER TABLE `equipment_maintenance_request_log` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `equipment_maintenance_requests`
--

DROP TABLE IF EXISTS `equipment_maintenance_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `equipment_maintenance_requests` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `equipment_id` bigint(20) unsigned NOT NULL,
  `reported_by` bigint(20) unsigned NOT NULL,
  `issue_description` text NOT NULL,
  `status` enum('reported','in_progress','resolved') NOT NULL,
  `reported_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `resolved_at` timestamp NULL DEFAULT NULL,
  `employee_id` bigint(20) unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `asset_maintenance_requests_reported_by_foreign` (`reported_by`),
  KEY `asset_maintenance_requests_asset_equipment_foreign_idx` (`equipment_id`),
  CONSTRAINT `asset_maintenance_requests_asset_equipment_foreign` FOREIGN KEY (`equipment_id`) REFERENCES `equipments` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `asset_maintenance_requests_reported_by_foreign` FOREIGN KEY (`reported_by`) REFERENCES `employees` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `equipment_maintenance_requests`
--

LOCK TABLES `equipment_maintenance_requests` WRITE;
/*!40000 ALTER TABLE `equipment_maintenance_requests` DISABLE KEYS */;
/*!40000 ALTER TABLE `equipment_maintenance_requests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `equipment_proc_items`
--

DROP TABLE IF EXISTS `equipment_proc_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `equipment_proc_items` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `equipment_proc_id` bigint(20) unsigned NOT NULL,
  `name` varchar(255) NOT NULL,
  `specification` text DEFAULT NULL,
  `quantity` int(11) NOT NULL,
  `estimated_price` decimal(14,2) DEFAULT NULL,
  `asset_equipment_procurement_id` bigint(20) unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `asset_equipment_proc_items_asset_equipment_proc_id_foreign` (`equipment_proc_id`),
  CONSTRAINT `asset_equipment_proc_items_asset_equipment_proc_id_foreign` FOREIGN KEY (`equipment_proc_id`) REFERENCES `equipment_procurements` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `equipment_proc_items`
--

LOCK TABLES `equipment_proc_items` WRITE;
/*!40000 ALTER TABLE `equipment_proc_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `equipment_proc_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `equipment_procurements`
--

DROP TABLE IF EXISTS `equipment_procurements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `equipment_procurements` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `request_number` varchar(255) NOT NULL,
  `title` varchar(255) NOT NULL,
  `status` enum('draft','submitted','approved','rejected','completed') NOT NULL,
  `created_by` bigint(20) unsigned NOT NULL,
  `employee_id` bigint(20) unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `asset_equipment_procurements_request_number_unique` (`request_number`),
  KEY `asset_equipment_procurements_created_by_foreign` (`created_by`),
  CONSTRAINT `asset_equipment_procurements_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `employees` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `equipment_procurements`
--

LOCK TABLES `equipment_procurements` WRITE;
/*!40000 ALTER TABLE `equipment_procurements` DISABLE KEYS */;
/*!40000 ALTER TABLE `equipment_procurements` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `equipment_requests`
--

DROP TABLE IF EXISTS `equipment_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `equipment_requests` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `request_number` varchar(255) NOT NULL,
  `employee_id` bigint(20) unsigned NOT NULL,
  `name` varchar(255) NOT NULL,
  `specification` text DEFAULT NULL,
  `purchase_link` varchar(255) DEFAULT NULL,
  `photo` varchar(255) DEFAULT NULL,
  `quantity` int(11) NOT NULL,
  `status` enum('pending','approved','rejected') NOT NULL,
  `submitted_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `approved_by` bigint(20) unsigned DEFAULT NULL,
  `approved_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `asset_equipment_requests_request_number_unique` (`request_number`),
  KEY `asset_equipment_requests_employee_id_foreign` (`employee_id`),
  KEY `asset_equipment_requests_approved_by_foreign` (`approved_by`),
  CONSTRAINT `asset_equipment_requests_approved_by_foreign` FOREIGN KEY (`approved_by`) REFERENCES `employees` (`id`),
  CONSTRAINT `asset_equipment_requests_employee_id_foreign` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `equipment_requests`
--

LOCK TABLES `equipment_requests` WRITE;
/*!40000 ALTER TABLE `equipment_requests` DISABLE KEYS */;
/*!40000 ALTER TABLE `equipment_requests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `equipments`
--

DROP TABLE IF EXISTS `equipments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `equipments` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `asset_id` bigint(20) unsigned NOT NULL,
  `brand` varchar(255) DEFAULT NULL,
  `model` varchar(255) DEFAULT NULL,
  `serial_number` varchar(255) DEFAULT NULL,
  `specification` text DEFAULT NULL,
  `purchase_link` varchar(255) DEFAULT NULL,
  `photo` varchar(255) DEFAULT NULL,
  `depreciation_value` decimal(14,2) DEFAULT NULL,
  `useful_life` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `asset_equipment_asset_id_foreign` (`asset_id`),
  CONSTRAINT `asset_equipment_asset_id_foreign` FOREIGN KEY (`asset_id`) REFERENCES `assets` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `equipments`
--

LOCK TABLES `equipments` WRITE;
/*!40000 ALTER TABLE `equipments` DISABLE KEYS */;
/*!40000 ALTER TABLE `equipments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `event_attendances`
--

DROP TABLE IF EXISTS `event_attendances`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `event_attendances` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `event_registration_id` bigint(20) unsigned NOT NULL,
  `checked_in_at` timestamp NULL DEFAULT NULL,
  `checked_out_at` timestamp NULL DEFAULT NULL,
  `checked_by` bigint(20) unsigned DEFAULT NULL,
  `attendance_method` enum('manual','qr_scan','system') NOT NULL,
  `status` enum('present','absent','partial') NOT NULL,
  `checked_by_id` bigint(20) unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `event_attendances_event_registration_id_foreign` (`event_registration_id`),
  KEY `event_attendances_checked_by_foreign` (`checked_by`),
  CONSTRAINT `event_attendances_checked_by_foreign` FOREIGN KEY (`checked_by`) REFERENCES `employees` (`id`),
  CONSTRAINT `event_attendances_event_registration_id_foreign` FOREIGN KEY (`event_registration_id`) REFERENCES `event_registrations` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `event_attendances`
--

LOCK TABLES `event_attendances` WRITE;
/*!40000 ALTER TABLE `event_attendances` DISABLE KEYS */;
/*!40000 ALTER TABLE `event_attendances` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `event_committee_members`
--

DROP TABLE IF EXISTS `event_committee_members`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `event_committee_members` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `event_id` bigint(20) unsigned NOT NULL,
  `employee_id` bigint(20) unsigned NOT NULL,
  `role` varchar(255) NOT NULL,
  `is_leader` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `event_committee_members_event_id_foreign` (`event_id`),
  KEY `event_committee_members_employee_id_foreign` (`employee_id`),
  CONSTRAINT `event_committee_members_employee_id_foreign` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`),
  CONSTRAINT `event_committee_members_event_id_foreign` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `event_committee_members`
--

LOCK TABLES `event_committee_members` WRITE;
/*!40000 ALTER TABLE `event_committee_members` DISABLE KEYS */;
/*!40000 ALTER TABLE `event_committee_members` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `event_documents`
--

DROP TABLE IF EXISTS `event_documents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `event_documents` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `event_id` bigint(20) unsigned NOT NULL,
  `title` varchar(255) NOT NULL,
  `document_type` enum('report','photo','proposal','minutes','attendance','other') NOT NULL,
  `file_path` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `uploaded_by` bigint(20) unsigned NOT NULL,
  `uploaded_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `uploaded_by_id` bigint(20) unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `event_documents_event_id_foreign` (`event_id`),
  KEY `event_documents_uploaded_by_foreign` (`uploaded_by`),
  CONSTRAINT `event_documents_event_id_foreign` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`),
  CONSTRAINT `event_documents_uploaded_by_foreign` FOREIGN KEY (`uploaded_by`) REFERENCES `employees` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `event_documents`
--

LOCK TABLES `event_documents` WRITE;
/*!40000 ALTER TABLE `event_documents` DISABLE KEYS */;
/*!40000 ALTER TABLE `event_documents` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `event_registrations`
--

DROP TABLE IF EXISTS `event_registrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `event_registrations` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `event_id` bigint(20) unsigned NOT NULL,
  `user_id` bigint(20) unsigned NOT NULL,
  `registration_number` varchar(255) NOT NULL,
  `registered_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `attendance_status` enum('registered','attended','no_show','cancelled') NOT NULL,
  `notes` text DEFAULT NULL,
  `ticket_number` varchar(255) NOT NULL,
  `qr_code` varchar(255) DEFAULT NULL,
  `issued_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `certificate_number` varchar(255) NOT NULL,
  `file_path` varchar(255) DEFAULT NULL,
  `generated_by` bigint(20) unsigned DEFAULT NULL,
  `generated_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `event_registrations_registration_number_unique` (`registration_number`),
  UNIQUE KEY `event_registrations_ticket_number_unique` (`ticket_number`),
  UNIQUE KEY `event_registrations_certificate_number_unique` (`certificate_number`),
  KEY `event_registrations_user_id_foreign` (`user_id`),
  KEY `event_registrations_generated_by_foreign` (`generated_by`),
  KEY `event_registrations_event_id_foreign_idx` (`event_id`),
  CONSTRAINT `event_registrations_event_id_foreign` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`),
  CONSTRAINT `event_registrations_generated_by_foreign` FOREIGN KEY (`generated_by`) REFERENCES `employees` (`id`),
  CONSTRAINT `event_registrations_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `event_registrations`
--

LOCK TABLES `event_registrations` WRITE;
/*!40000 ALTER TABLE `event_registrations` DISABLE KEYS */;
/*!40000 ALTER TABLE `event_registrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `event_reminders`
--

DROP TABLE IF EXISTS `event_reminders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `event_reminders` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `event_id` bigint(20) unsigned NOT NULL,
  `sent_by` bigint(20) unsigned NOT NULL,
  `channel` enum('email','whatsapp','sms','system') NOT NULL,
  `message` text NOT NULL,
  `sent_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `sent_by_id` bigint(20) unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `event_reminders_event_id_foreign` (`event_id`),
  KEY `event_reminders_sent_by_foreign` (`sent_by`),
  CONSTRAINT `event_reminders_event_id_foreign` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`),
  CONSTRAINT `event_reminders_sent_by_foreign` FOREIGN KEY (`sent_by`) REFERENCES `employees` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `event_reminders`
--

LOCK TABLES `event_reminders` WRITE;
/*!40000 ALTER TABLE `event_reminders` DISABLE KEYS */;
/*!40000 ALTER TABLE `event_reminders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `events`
--

DROP TABLE IF EXISTS `events`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `events` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `objectives` text DEFAULT NULL,
  `event_type` enum('seminar','workshop','training','conference','webinar','other') NOT NULL,
  `delivery_mode` enum('offline','online','hybrid') NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `start_time` time DEFAULT NULL,
  `end_time` time DEFAULT NULL,
  `venue` varchar(255) DEFAULT NULL,
  `online_platform` varchar(255) DEFAULT NULL,
  `online_link` varchar(255) DEFAULT NULL,
  `quota` int(11) DEFAULT NULL,
  `registration_deadline` datetime DEFAULT NULL,
  `cover_image` varchar(255) DEFAULT NULL,
  `banner_image` varchar(255) DEFAULT NULL,
  `status` enum('draft','published','closed','cancelled') NOT NULL,
  `created_by` bigint(20) unsigned NOT NULL,
  `published_by` bigint(20) unsigned DEFAULT NULL,
  `published_at` timestamp NULL DEFAULT NULL,
  `created_by_id` bigint(20) unsigned NOT NULL,
  `published_by_id` bigint(20) unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `events_slug_unique` (`slug`),
  KEY `events_created_by_foreign` (`created_by`),
  CONSTRAINT `events_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `employees` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `events`
--

LOCK TABLES `events` WRITE;
/*!40000 ALTER TABLE `events` DISABLE KEYS */;
/*!40000 ALTER TABLE `events` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `express_sessions`
--

DROP TABLE IF EXISTS `express_sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `express_sessions` (
  `session_id` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `expires` int(11) unsigned NOT NULL,
  `data` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  PRIMARY KEY (`session_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `express_sessions`
--

LOCK TABLES `express_sessions` WRITE;
/*!40000 ALTER TABLE `express_sessions` DISABLE KEYS */;
INSERT INTO `express_sessions` VALUES ('7EfVHiRwADz4XEjTNAeio0JohqYHVbkR',1781581208,'{\"cookie\":{\"originalMaxAge\":86400000,\"expires\":\"2026-06-16T03:40:08.183Z\",\"httpOnly\":true,\"path\":\"/\"},\"userId\":1,\"username\":\"Admin SIP\",\"permissions\":[\"manage_procurement\",\"manage_vendor\",\"manage_po\",\"manage_receiving\"]}');
/*!40000 ALTER TABLE `express_sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `failed_jobs`
--

DROP TABLE IF EXISTS `failed_jobs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `failed_jobs` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `uuid` varchar(255) NOT NULL,
  `connection` text NOT NULL,
  `queue` text NOT NULL,
  `payload` longtext NOT NULL,
  `exception` longtext NOT NULL,
  `failed_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `failed_jobs_uuid_unique` (`uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `failed_jobs`
--

LOCK TABLES `failed_jobs` WRITE;
/*!40000 ALTER TABLE `failed_jobs` DISABLE KEYS */;
/*!40000 ALTER TABLE `failed_jobs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `functional_positions`
--

DROP TABLE IF EXISTS `functional_positions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `functional_positions` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `level` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `functional_positions`
--

LOCK TABLES `functional_positions` WRITE;
/*!40000 ALTER TABLE `functional_positions` DISABLE KEYS */;
/*!40000 ALTER TABLE `functional_positions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `holidays`
--

DROP TABLE IF EXISTS `holidays`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `holidays` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `date` date NOT NULL,
  `name` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `holidays`
--

LOCK TABLES `holidays` WRITE;
/*!40000 ALTER TABLE `holidays` DISABLE KEYS */;
/*!40000 ALTER TABLE `holidays` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `implementation_arrangements`
--

DROP TABLE IF EXISTS `implementation_arrangements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `implementation_arrangements` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `partnership_id` bigint(20) unsigned NOT NULL,
  `partnership_impl_id` bigint(20) unsigned NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `document_number` varchar(255) DEFAULT NULL,
  `document_file` varchar(255) DEFAULT NULL,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `partnership_implementation_id` bigint(20) unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `implementation_arrangements_partnership_id_foreign` (`partnership_id`),
  KEY `implementation_arrangements_partnership_impl_id_foreign` (`partnership_impl_id`),
  CONSTRAINT `implementation_arrangements_partnership_id_foreign` FOREIGN KEY (`partnership_id`) REFERENCES `partnerships` (`id`),
  CONSTRAINT `implementation_arrangements_partnership_impl_id_foreign` FOREIGN KEY (`partnership_impl_id`) REFERENCES `partnership_implementations` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `implementation_arrangements`
--

LOCK TABLES `implementation_arrangements` WRITE;
/*!40000 ALTER TABLE `implementation_arrangements` DISABLE KEYS */;
/*!40000 ALTER TABLE `implementation_arrangements` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `inventories`
--

DROP TABLE IF EXISTS `inventories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `inventories` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `item_id` bigint(20) unsigned NOT NULL,
  `quantity` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `inventories_item_id_foreign` (`item_id`),
  CONSTRAINT `inventories_item_id_foreign` FOREIGN KEY (`item_id`) REFERENCES `items` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `inventories`
--

LOCK TABLES `inventories` WRITE;
/*!40000 ALTER TABLE `inventories` DISABLE KEYS */;
/*!40000 ALTER TABLE `inventories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `inventory_procurement_items`
--

DROP TABLE IF EXISTS `inventory_procurement_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `inventory_procurement_items` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `inventory_procurement_id` bigint(20) unsigned NOT NULL,
  `item_id` bigint(20) unsigned DEFAULT NULL,
  `item_name` varchar(255) DEFAULT NULL,
  `quantity` int(11) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `inventory_procurement_items_inventory_procurement_id_foreign` (`inventory_procurement_id`),
  KEY `inventory_procurement_items_item_id_foreign` (`item_id`),
  CONSTRAINT `inventory_procurement_items_inventory_procurement_id_foreign` FOREIGN KEY (`inventory_procurement_id`) REFERENCES `inventory_procurements` (`id`),
  CONSTRAINT `inventory_procurement_items_item_id_foreign` FOREIGN KEY (`item_id`) REFERENCES `items` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `inventory_procurement_items`
--

LOCK TABLES `inventory_procurement_items` WRITE;
/*!40000 ALTER TABLE `inventory_procurement_items` DISABLE KEYS */;
INSERT INTO `inventory_procurement_items` VALUES (3,1,NULL,'ROG ZEPHYRUS',1,'2026-06-05 09:12:40','2026-06-05 09:12:40'),(4,1,NULL,'LENOVO IDEAPAD',12,'2026-06-05 09:12:40','2026-06-05 09:12:40'),(5,2,NULL,'Mouse',5,'2026-06-05 09:48:33','2026-06-05 09:48:33');
/*!40000 ALTER TABLE `inventory_procurement_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `inventory_procurements`
--

DROP TABLE IF EXISTS `inventory_procurements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `inventory_procurements` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `request_number` varchar(255) NOT NULL,
  `title` varchar(255) NOT NULL,
  `status` enum('draft','submitted','approved','rejected') NOT NULL,
  `created_by` bigint(20) unsigned NOT NULL,
  `approved_at` timestamp NULL DEFAULT NULL,
  `employee_id` bigint(20) unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `inventory_procurements_request_number_unique` (`request_number`),
  KEY `inventory_procurements_created_by_foreign` (`created_by`),
  CONSTRAINT `inventory_procurements_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `employees` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `inventory_procurements`
--

LOCK TABLES `inventory_procurements` WRITE;
/*!40000 ALTER TABLE `inventory_procurements` DISABLE KEYS */;
INSERT INTO `inventory_procurements` VALUES (1,'PRQ-20260605-0001','Pengadaan Monitor','approved',1,NULL,1,'2026-06-05 09:12:10','2026-06-05 09:24:00'),(2,'PRQ-20260605-0002','Lab','rejected',1,NULL,1,'2026-06-05 09:48:33','2026-06-05 09:48:33');
/*!40000 ALTER TABLE `inventory_procurements` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `inventory_purchase_items`
--

DROP TABLE IF EXISTS `inventory_purchase_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `inventory_purchase_items` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `inventory_purchase_id` bigint(20) unsigned NOT NULL,
  `item_id` bigint(20) unsigned NOT NULL,
  `quantity` int(11) NOT NULL,
  `price` decimal(12,2) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `received_quantity` int(11) DEFAULT NULL,
  `received_note` varchar(255) DEFAULT NULL,
  `received_defective` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `inventory_purchase_items_inventory_purchase_id_foreign` (`inventory_purchase_id`),
  KEY `inventory_purchase_items_item_id_foreign` (`item_id`),
  CONSTRAINT `inventory_purchase_items_inventory_purchase_id_foreign` FOREIGN KEY (`inventory_purchase_id`) REFERENCES `inventory_purchases` (`id`),
  CONSTRAINT `inventory_purchase_items_item_id_foreign` FOREIGN KEY (`item_id`) REFERENCES `items` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `inventory_purchase_items`
--

LOCK TABLES `inventory_purchase_items` WRITE;
/*!40000 ALTER TABLE `inventory_purchase_items` DISABLE KEYS */;
INSERT INTO `inventory_purchase_items` VALUES (1,1,1,1,400000.00,NULL,'2026-06-05 09:27:43',1,NULL,0),(2,1,2,12,200000.00,NULL,'2026-06-05 09:27:43',5,NULL,7);
/*!40000 ALTER TABLE `inventory_purchase_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `inventory_purchases`
--

DROP TABLE IF EXISTS `inventory_purchases`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `inventory_purchases` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `purchase_number` varchar(255) NOT NULL,
  `inventory_procurement_id` bigint(20) unsigned DEFAULT NULL,
  `purchase_date` date NOT NULL,
  `supplier` varchar(255) DEFAULT NULL,
  `status` enum('pending','approved','rejected','completed') NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `inventory_purchases_purchase_number_unique` (`purchase_number`),
  KEY `inventory_purchases_inventory_procurement_id_foreign` (`inventory_procurement_id`),
  CONSTRAINT `inventory_purchases_inventory_procurement_id_foreign` FOREIGN KEY (`inventory_procurement_id`) REFERENCES `inventory_procurements` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `inventory_purchases`
--

LOCK TABLES `inventory_purchases` WRITE;
/*!40000 ALTER TABLE `inventory_purchases` DISABLE KEYS */;
INSERT INTO `inventory_purchases` VALUES (1,'PO-202607-0001',1,'2026-07-01','Someone','completed',NULL,'2026-06-05 09:31:16');
/*!40000 ALTER TABLE `inventory_purchases` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `inventory_receiving_attachments`
--

DROP TABLE IF EXISTS `inventory_receiving_attachments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `inventory_receiving_attachments` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `inventory_purchase_id` bigint(20) unsigned NOT NULL,
  `file_path` varchar(255) NOT NULL,
  `original_name` varchar(255) DEFAULT NULL,
  `mime_type` varchar(100) DEFAULT NULL,
  `size` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_ira_purchase` (`inventory_purchase_id`),
  CONSTRAINT `fk_ira_purchase` FOREIGN KEY (`inventory_purchase_id`) REFERENCES `inventory_purchases` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `inventory_receiving_attachments`
--

LOCK TABLES `inventory_receiving_attachments` WRITE;
/*!40000 ALTER TABLE `inventory_receiving_attachments` DISABLE KEYS */;
INSERT INTO `inventory_receiving_attachments` VALUES (1,1,'1780651663255-741736577.jpeg','WhatsApp Image 2026-06-04 at 21.25.16.jpeg','image/jpeg',77244,'2026-06-05 09:27:43');
/*!40000 ALTER TABLE `inventory_receiving_attachments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `inventory_request_approvals`
--

DROP TABLE IF EXISTS `inventory_request_approvals`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `inventory_request_approvals` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `inventory_request_id` bigint(20) unsigned NOT NULL,
  `approver_id` bigint(20) unsigned NOT NULL,
  `status` enum('approved','rejected') NOT NULL,
  `notes` text DEFAULT NULL,
  `action_date` timestamp NOT NULL DEFAULT current_timestamp(),
  `employee_id` bigint(20) unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `inventory_request_approvals_inventory_request_id_foreign` (`inventory_request_id`),
  KEY `inventory_request_approvals_approver_id_foreign` (`approver_id`),
  CONSTRAINT `inventory_request_approvals_approver_id_foreign` FOREIGN KEY (`approver_id`) REFERENCES `employees` (`id`),
  CONSTRAINT `inventory_request_approvals_inventory_request_id_foreign` FOREIGN KEY (`inventory_request_id`) REFERENCES `inventory_requests` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `inventory_request_approvals`
--

LOCK TABLES `inventory_request_approvals` WRITE;
/*!40000 ALTER TABLE `inventory_request_approvals` DISABLE KEYS */;
/*!40000 ALTER TABLE `inventory_request_approvals` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `inventory_request_details`
--

DROP TABLE IF EXISTS `inventory_request_details`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `inventory_request_details` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `inventory_request_id` bigint(20) unsigned NOT NULL,
  `item_id` bigint(20) unsigned DEFAULT NULL,
  `item_name` varchar(255) DEFAULT NULL,
  `specification` text DEFAULT NULL,
  `quantity` int(11) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `inventory_request_details_inventory_request_id_foreign` (`inventory_request_id`),
  KEY `inventory_request_details_item_id_foreign` (`item_id`),
  CONSTRAINT `inventory_request_details_inventory_request_id_foreign` FOREIGN KEY (`inventory_request_id`) REFERENCES `inventory_requests` (`id`),
  CONSTRAINT `inventory_request_details_item_id_foreign` FOREIGN KEY (`item_id`) REFERENCES `items` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `inventory_request_details`
--

LOCK TABLES `inventory_request_details` WRITE;
/*!40000 ALTER TABLE `inventory_request_details` DISABLE KEYS */;
/*!40000 ALTER TABLE `inventory_request_details` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `inventory_requests`
--

DROP TABLE IF EXISTS `inventory_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `inventory_requests` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `request_number` varchar(255) NOT NULL,
  `title` varchar(255) DEFAULT NULL,
  `employee_id` bigint(20) unsigned NOT NULL,
  `request_date` date NOT NULL,
  `status` enum('pending','approved','rejected','fulfilled') NOT NULL,
  `approved_by` bigint(20) unsigned DEFAULT NULL,
  `approved_at` timestamp NULL DEFAULT NULL,
  `approved_by_id` bigint(20) unsigned NOT NULL,
  `inventory_procurement_id` bigint(20) unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `inventory_requests_request_number_unique` (`request_number`),
  KEY `inventory_requests_employee_id_foreign` (`employee_id`),
  KEY `inventory_requests_approved_by_foreign` (`approved_by`),
  KEY `inventory_requests_inventory_procurement_id_foreign` (`inventory_procurement_id`),
  CONSTRAINT `inventory_requests_approved_by_foreign` FOREIGN KEY (`approved_by`) REFERENCES `employees` (`id`),
  CONSTRAINT `inventory_requests_employee_id_foreign` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`),
  CONSTRAINT `inventory_requests_inventory_procurement_id_foreign` FOREIGN KEY (`inventory_procurement_id`) REFERENCES `inventory_procurements` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `inventory_requests`
--

LOCK TABLES `inventory_requests` WRITE;
/*!40000 ALTER TABLE `inventory_requests` DISABLE KEYS */;
/*!40000 ALTER TABLE `inventory_requests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `inventory_transactions`
--

DROP TABLE IF EXISTS `inventory_transactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `inventory_transactions` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `item_id` bigint(20) unsigned NOT NULL,
  `type` enum('in','out','adjustment') NOT NULL,
  `quantity` int(11) NOT NULL,
  `transaction_date` date NOT NULL,
  `reference` varchar(255) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `inventory_transactions_item_id_foreign` (`item_id`),
  CONSTRAINT `inventory_transactions_item_id_foreign` FOREIGN KEY (`item_id`) REFERENCES `items` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `inventory_transactions`
--

LOCK TABLES `inventory_transactions` WRITE;
/*!40000 ALTER TABLE `inventory_transactions` DISABLE KEYS */;
INSERT INTO `inventory_transactions` VALUES (1,1,'out',1,'2026-06-05','PO-202607-0001','Barang cacat / rusak - Rusak Parah','2026-06-05 09:28:08','2026-06-05 09:28:08'),(2,1,'in',1,'2026-06-05','PO-202607-0001','Barang ganti - Sudah Diganti dengan yang baik','2026-06-05 09:28:52','2026-06-05 09:28:52'),(3,1,'in',1,'2026-06-05','PO-202607-0001','Penerimaan barang dikonfirmasi','2026-06-05 09:31:16','2026-06-05 09:31:16'),(4,2,'in',12,'2026-06-05','PO-202607-0001','Penerimaan barang dikonfirmasi','2026-06-05 09:31:16','2026-06-05 09:31:16');
/*!40000 ALTER TABLE `inventory_transactions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `items`
--

DROP TABLE IF EXISTS `items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `items` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `code` varchar(255) NOT NULL,
  `unit` varchar(255) NOT NULL,
  `minimal_quantity` int(11) NOT NULL DEFAULT 0,
  `description` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `items_code_unique` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `items`
--

LOCK TABLES `items` WRITE;
/*!40000 ALTER TABLE `items` DISABLE KEYS */;
INSERT INTO `items` VALUES (1,'ROG ZEPHYRUS','ITM-MQ0PZ8U7-294','unit',0,NULL,'2026-06-05 09:26:25','2026-06-05 09:26:25'),(2,'LENOVO IDEAPAD','ITM-MQ0PZ8UE-581','unit',0,NULL,'2026-06-05 09:26:25','2026-06-05 09:26:25');
/*!40000 ALTER TABLE `items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `job_batches`
--

DROP TABLE IF EXISTS `job_batches`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `job_batches` (
  `id` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `total_jobs` int(11) NOT NULL,
  `pending_jobs` int(11) NOT NULL,
  `failed_jobs` int(11) NOT NULL,
  `failed_job_ids` longtext NOT NULL,
  `options` mediumtext DEFAULT NULL,
  `cancelled_at` int(11) DEFAULT NULL,
  `created_at` int(11) NOT NULL,
  `finished_at` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `job_batches`
--

LOCK TABLES `job_batches` WRITE;
/*!40000 ALTER TABLE `job_batches` DISABLE KEYS */;
/*!40000 ALTER TABLE `job_batches` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `job_responsibilities`
--

DROP TABLE IF EXISTS `job_responsibilities`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `job_responsibilities` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `structural_position_id` bigint(20) unsigned NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `type` enum('main','function') NOT NULL,
  `order` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `job_responsibilities_structural_position_id_foreign` (`structural_position_id`),
  CONSTRAINT `job_responsibilities_structural_position_id_foreign` FOREIGN KEY (`structural_position_id`) REFERENCES `structural_positions` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `job_responsibilities`
--

LOCK TABLES `job_responsibilities` WRITE;
/*!40000 ALTER TABLE `job_responsibilities` DISABLE KEYS */;
/*!40000 ALTER TABLE `job_responsibilities` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `jobs`
--

DROP TABLE IF EXISTS `jobs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `jobs` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `queue` varchar(255) NOT NULL,
  `payload` longtext NOT NULL,
  `attempts` tinyint(3) unsigned NOT NULL,
  `reserved_at` int(10) unsigned DEFAULT NULL,
  `available_at` int(10) unsigned NOT NULL,
  `created_at` int(10) unsigned NOT NULL,
  PRIMARY KEY (`id`),
  KEY `jobs_queue_index` (`queue`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `jobs`
--

LOCK TABLES `jobs` WRITE;
/*!40000 ALTER TABLE `jobs` DISABLE KEYS */;
/*!40000 ALTER TABLE `jobs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `journal_publications`
--

DROP TABLE IF EXISTS `journal_publications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `journal_publications` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `publication_id` bigint(20) unsigned NOT NULL,
  `journal_name` varchar(255) NOT NULL,
  `issn` varchar(255) DEFAULT NULL,
  `publisher` varchar(255) DEFAULT NULL,
  `volume` varchar(255) DEFAULT NULL,
  `issue` varchar(255) DEFAULT NULL,
  `pages` varchar(255) DEFAULT NULL,
  `indexing` varchar(255) DEFAULT NULL,
  `quartile` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `journal_publications_publication_id_foreign` (`publication_id`),
  CONSTRAINT `journal_publications_publication_id_foreign` FOREIGN KEY (`publication_id`) REFERENCES `publications` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `journal_publications`
--

LOCK TABLES `journal_publications` WRITE;
/*!40000 ALTER TABLE `journal_publications` DISABLE KEYS */;
/*!40000 ALTER TABLE `journal_publications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `leave_approvals`
--

DROP TABLE IF EXISTS `leave_approvals`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `leave_approvals` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `leave_request_id` bigint(20) unsigned NOT NULL,
  `approver_id` bigint(20) unsigned NOT NULL,
  `level` int(11) NOT NULL,
  `status` enum('pending','approved','rejected') NOT NULL,
  `notes` text DEFAULT NULL,
  `action_date` timestamp NULL DEFAULT NULL,
  `employee_id` bigint(20) unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `leave_approvals_leave_request_id_foreign` (`leave_request_id`),
  KEY `leave_approvals_approver_id_foreign` (`approver_id`),
  CONSTRAINT `leave_approvals_approver_id_foreign` FOREIGN KEY (`approver_id`) REFERENCES `employees` (`id`),
  CONSTRAINT `leave_approvals_leave_request_id_foreign` FOREIGN KEY (`leave_request_id`) REFERENCES `leave_requests` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `leave_approvals`
--

LOCK TABLES `leave_approvals` WRITE;
/*!40000 ALTER TABLE `leave_approvals` DISABLE KEYS */;
/*!40000 ALTER TABLE `leave_approvals` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `leave_balances`
--

DROP TABLE IF EXISTS `leave_balances`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `leave_balances` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `employee_id` bigint(20) unsigned NOT NULL,
  `leave_type_id` bigint(20) unsigned NOT NULL,
  `year` year(4) NOT NULL,
  `quota` int(11) NOT NULL,
  `used` int(11) NOT NULL DEFAULT 0,
  `remaining` int(11) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `leave_balances_employee_id_foreign` (`employee_id`),
  KEY `leave_balances_leave_type_id_foreign` (`leave_type_id`),
  CONSTRAINT `leave_balances_employee_id_foreign` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`),
  CONSTRAINT `leave_balances_leave_type_id_foreign` FOREIGN KEY (`leave_type_id`) REFERENCES `leave_types` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `leave_balances`
--

LOCK TABLES `leave_balances` WRITE;
/*!40000 ALTER TABLE `leave_balances` DISABLE KEYS */;
/*!40000 ALTER TABLE `leave_balances` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `leave_requests`
--

DROP TABLE IF EXISTS `leave_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `leave_requests` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `employee_id` bigint(20) unsigned NOT NULL,
  `leave_type_id` bigint(20) unsigned NOT NULL,
  `approver_id` bigint(20) unsigned DEFAULT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `total_days` int(11) NOT NULL,
  `reason` text DEFAULT NULL,
  `attachment` varchar(255) DEFAULT NULL,
  `address_leave` varchar(255) DEFAULT NULL,
  `contact_leave` varchar(255) DEFAULT NULL,
  `status` enum('pending','approved','rejected','cancelled') NOT NULL,
  `submitted_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `approved_at` timestamp NULL DEFAULT NULL,
  `approver_id_id` bigint(20) unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `leave_requests_employee_id_foreign` (`employee_id`),
  KEY `leave_requests_leave_type_id_foreign` (`leave_type_id`),
  KEY `leave_requests_approver_id_foreign` (`approver_id`),
  CONSTRAINT `leave_requests_approver_id_foreign` FOREIGN KEY (`approver_id`) REFERENCES `employees` (`id`),
  CONSTRAINT `leave_requests_employee_id_foreign` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`),
  CONSTRAINT `leave_requests_leave_type_id_foreign` FOREIGN KEY (`leave_type_id`) REFERENCES `leave_types` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `leave_requests`
--

LOCK TABLES `leave_requests` WRITE;
/*!40000 ALTER TABLE `leave_requests` DISABLE KEYS */;
/*!40000 ALTER TABLE `leave_requests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `leave_types`
--

DROP TABLE IF EXISTS `leave_types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `leave_types` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `default_quota` int(11) NOT NULL,
  `requires_attachment` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `leave_types`
--

LOCK TABLES `leave_types` WRITE;
/*!40000 ALTER TABLE `leave_types` DISABLE KEYS */;
/*!40000 ALTER TABLE `leave_types` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `lecturer_functional_positions`
--

DROP TABLE IF EXISTS `lecturer_functional_positions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `lecturer_functional_positions` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `lecturer_id` bigint(20) unsigned NOT NULL,
  `functional_position_id` bigint(20) unsigned NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date DEFAULT NULL,
  `decree_number` varchar(255) DEFAULT NULL,
  `decree_date` date DEFAULT NULL,
  `sk_file` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `lecturer_functional_positions_lecturer_id_foreign` (`lecturer_id`),
  KEY `lecturer_functional_positions_functional_position_id_foreign` (`functional_position_id`),
  CONSTRAINT `lecturer_functional_positions_functional_position_id_foreign` FOREIGN KEY (`functional_position_id`) REFERENCES `functional_positions` (`id`),
  CONSTRAINT `lecturer_functional_positions_lecturer_id_foreign` FOREIGN KEY (`lecturer_id`) REFERENCES `lecturers` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `lecturer_functional_positions`
--

LOCK TABLES `lecturer_functional_positions` WRITE;
/*!40000 ALTER TABLE `lecturer_functional_positions` DISABLE KEYS */;
/*!40000 ALTER TABLE `lecturer_functional_positions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `lecturers`
--

DROP TABLE IF EXISTS `lecturers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `lecturers` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `academic_rank` varchar(255) NOT NULL,
  `functional_position` varchar(255) DEFAULT NULL,
  `expertise` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `lecturers_employee_id_foreign` FOREIGN KEY (`id`) REFERENCES `employees` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `lecturers`
--

LOCK TABLES `lecturers` WRITE;
/*!40000 ALTER TABLE `lecturers` DISABLE KEYS */;
/*!40000 ALTER TABLE `lecturers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `meeting_consumption_requests`
--

DROP TABLE IF EXISTS `meeting_consumption_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `meeting_consumption_requests` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `meeting_id` bigint(20) unsigned NOT NULL,
  `description` text DEFAULT NULL,
  `estimated_participants` int(11) NOT NULL,
  `status` enum('requested','approved','rejected','fulfilled') NOT NULL,
  `requested_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `approved_by` bigint(20) unsigned DEFAULT NULL,
  `employee_id` bigint(20) unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `meeting_consumption_requests_meeting_id_foreign` (`meeting_id`),
  KEY `meeting_consumption_requests_approved_by_foreign` (`approved_by`),
  CONSTRAINT `meeting_consumption_requests_approved_by_foreign` FOREIGN KEY (`approved_by`) REFERENCES `employees` (`id`),
  CONSTRAINT `meeting_consumption_requests_meeting_id_foreign` FOREIGN KEY (`meeting_id`) REFERENCES `meetings` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `meeting_consumption_requests`
--

LOCK TABLES `meeting_consumption_requests` WRITE;
/*!40000 ALTER TABLE `meeting_consumption_requests` DISABLE KEYS */;
/*!40000 ALTER TABLE `meeting_consumption_requests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `meeting_documents`
--

DROP TABLE IF EXISTS `meeting_documents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `meeting_documents` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `meeting_id` bigint(20) unsigned NOT NULL,
  `title` varchar(255) NOT NULL,
  `file_path` varchar(255) NOT NULL,
  `file_type` varchar(255) DEFAULT NULL,
  `uploaded_by` bigint(20) unsigned NOT NULL,
  `uploaded_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `employee_id` bigint(20) unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `meeting_documents_meeting_id_foreign` (`meeting_id`),
  KEY `meeting_documents_uploaded_by_foreign` (`uploaded_by`),
  CONSTRAINT `meeting_documents_meeting_id_foreign` FOREIGN KEY (`meeting_id`) REFERENCES `meetings` (`id`),
  CONSTRAINT `meeting_documents_uploaded_by_foreign` FOREIGN KEY (`uploaded_by`) REFERENCES `employees` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `meeting_documents`
--

LOCK TABLES `meeting_documents` WRITE;
/*!40000 ALTER TABLE `meeting_documents` DISABLE KEYS */;
/*!40000 ALTER TABLE `meeting_documents` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `meeting_external_participants`
--

DROP TABLE IF EXISTS `meeting_external_participants`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `meeting_external_participants` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `meeting_id` bigint(20) unsigned NOT NULL,
  `name` varchar(255) NOT NULL,
  `institution` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `meeting_external_participants_meeting_id_foreign` (`meeting_id`),
  CONSTRAINT `meeting_external_participants_meeting_id_foreign` FOREIGN KEY (`meeting_id`) REFERENCES `meetings` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `meeting_external_participants`
--

LOCK TABLES `meeting_external_participants` WRITE;
/*!40000 ALTER TABLE `meeting_external_participants` DISABLE KEYS */;
/*!40000 ALTER TABLE `meeting_external_participants` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `meeting_minutes`
--

DROP TABLE IF EXISTS `meeting_minutes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `meeting_minutes` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `meeting_id` bigint(20) unsigned NOT NULL,
  `summary` text NOT NULL,
  `file` varchar(255) DEFAULT NULL,
  `is_confidential` tinyint(1) NOT NULL DEFAULT 0,
  `created_by` bigint(20) unsigned NOT NULL,
  `employee_id` bigint(20) unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `meeting_minutes_meeting_id_foreign` (`meeting_id`),
  KEY `meeting_minutes_created_by_foreign` (`created_by`),
  CONSTRAINT `meeting_minutes_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `employees` (`id`),
  CONSTRAINT `meeting_minutes_meeting_id_foreign` FOREIGN KEY (`meeting_id`) REFERENCES `meetings` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `meeting_minutes`
--

LOCK TABLES `meeting_minutes` WRITE;
/*!40000 ALTER TABLE `meeting_minutes` DISABLE KEYS */;
/*!40000 ALTER TABLE `meeting_minutes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `meeting_participants`
--

DROP TABLE IF EXISTS `meeting_participants`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `meeting_participants` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `meeting_id` bigint(20) unsigned NOT NULL,
  `employee_id` bigint(20) unsigned NOT NULL,
  `status` enum('invited','confirmed','attended') NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `meeting_participants_meeting_id_foreign` (`meeting_id`),
  KEY `meeting_participants_employee_id_foreign` (`employee_id`),
  CONSTRAINT `meeting_participants_employee_id_foreign` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`),
  CONSTRAINT `meeting_participants_meeting_id_foreign` FOREIGN KEY (`meeting_id`) REFERENCES `meetings` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `meeting_participants`
--

LOCK TABLES `meeting_participants` WRITE;
/*!40000 ALTER TABLE `meeting_participants` DISABLE KEYS */;
/*!40000 ALTER TABLE `meeting_participants` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `meetings`
--

DROP TABLE IF EXISTS `meetings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `meetings` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `organizer_id` bigint(20) unsigned NOT NULL,
  `leader_id` bigint(20) unsigned NOT NULL,
  `meeting_type` enum('offline','online','hybrid') NOT NULL,
  `meeting_date` date NOT NULL,
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `asset_room_id` bigint(20) unsigned DEFAULT NULL,
  `online_platform` varchar(255) DEFAULT NULL,
  `online_link` varchar(255) DEFAULT NULL,
  `committee_id` bigint(20) unsigned DEFAULT NULL,
  `is_confidential` tinyint(1) NOT NULL DEFAULT 0,
  `status` enum('draft','scheduled','completed','cancelled') NOT NULL,
  `organizer_id_id` bigint(20) unsigned NOT NULL,
  `leader_id_id` bigint(20) unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `meetings_organizer_id_foreign` (`organizer_id`),
  KEY `meetings_leader_id_foreign` (`leader_id`),
  KEY `meetings_asset_room_id_foreign` (`asset_room_id`),
  KEY `meetings_committee_id_foreign` (`committee_id`),
  CONSTRAINT `meetings_asset_room_id_foreign` FOREIGN KEY (`asset_room_id`) REFERENCES `rooms` (`id`),
  CONSTRAINT `meetings_committee_id_foreign` FOREIGN KEY (`committee_id`) REFERENCES `committees` (`id`),
  CONSTRAINT `meetings_leader_id_foreign` FOREIGN KEY (`leader_id`) REFERENCES `employees` (`id`),
  CONSTRAINT `meetings_organizer_id_foreign` FOREIGN KEY (`organizer_id`) REFERENCES `employees` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `meetings`
--

LOCK TABLES `meetings` WRITE;
/*!40000 ALTER TABLE `meetings` DISABLE KEYS */;
/*!40000 ALTER TABLE `meetings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `model_has_permissions`
--

DROP TABLE IF EXISTS `model_has_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `model_has_permissions` (
  `permission_id` bigint(20) unsigned NOT NULL,
  `model_type` varchar(255) NOT NULL,
  `model_id` bigint(20) unsigned NOT NULL,
  PRIMARY KEY (`permission_id`,`model_id`,`model_type`),
  KEY `model_has_permissions_model_id_model_type_index` (`model_id`,`model_type`),
  CONSTRAINT `model_has_permissions_permission_id_foreign` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `model_has_permissions`
--

LOCK TABLES `model_has_permissions` WRITE;
/*!40000 ALTER TABLE `model_has_permissions` DISABLE KEYS */;
/*!40000 ALTER TABLE `model_has_permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `model_has_roles`
--

DROP TABLE IF EXISTS `model_has_roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `model_has_roles` (
  `role_id` bigint(20) unsigned NOT NULL,
  `model_type` varchar(255) NOT NULL,
  `model_id` bigint(20) unsigned NOT NULL,
  PRIMARY KEY (`role_id`,`model_id`,`model_type`),
  KEY `model_has_roles_model_id_model_type_index` (`model_id`,`model_type`),
  CONSTRAINT `model_has_roles_role_id_foreign` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `model_has_roles`
--

LOCK TABLES `model_has_roles` WRITE;
/*!40000 ALTER TABLE `model_has_roles` DISABLE KEYS */;
INSERT INTO `model_has_roles` VALUES (1,'App\\Models\\User',1),(2,'App\\Models\\User',2);
/*!40000 ALTER TABLE `model_has_roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `nomenclature_classifications`
--

DROP TABLE IF EXISTS `nomenclature_classifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `nomenclature_classifications` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `nomenclature_id` bigint(20) unsigned NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `nomenclature_classifications_nomenclature_id_foreign` (`nomenclature_id`),
  CONSTRAINT `nomenclature_classifications_nomenclature_id_foreign` FOREIGN KEY (`nomenclature_id`) REFERENCES `nomenclatures` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `nomenclature_classifications`
--

LOCK TABLES `nomenclature_classifications` WRITE;
/*!40000 ALTER TABLE `nomenclature_classifications` DISABLE KEYS */;
/*!40000 ALTER TABLE `nomenclature_classifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `nomenclatures`
--

DROP TABLE IF EXISTS `nomenclatures`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `nomenclatures` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `qualification` text NOT NULL,
  `duties` text NOT NULL,
  `grade` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `nomenclatures`
--

LOCK TABLES `nomenclatures` WRITE;
/*!40000 ALTER TABLE `nomenclatures` DISABLE KEYS */;
/*!40000 ALTER TABLE `nomenclatures` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `official_travel`
--

DROP TABLE IF EXISTS `official_travel`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `official_travel` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `request_number` varchar(255) NOT NULL,
  `purpose` varchar(255) NOT NULL,
  `destination` varchar(255) NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `invitation_file` varchar(255) DEFAULT NULL,
  `status` enum('draft','pending','approved','rejected','completed') NOT NULL,
  `submitted_by` bigint(20) unsigned NOT NULL,
  `submitted_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `approved_by` bigint(20) unsigned DEFAULT NULL,
  `approved_at` timestamp NULL DEFAULT NULL,
  `travel_outcome` text DEFAULT NULL,
  `outcome_followup` text DEFAULT NULL,
  `submitted_by_id` bigint(20) unsigned NOT NULL,
  `approved_by_id` bigint(20) unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `official_travel_request_number_unique` (`request_number`),
  KEY `official_travel_submitted_by_foreign` (`submitted_by`),
  KEY `official_travel_approved_by_foreign` (`approved_by`),
  CONSTRAINT `official_travel_approved_by_foreign` FOREIGN KEY (`approved_by`) REFERENCES `employees` (`id`),
  CONSTRAINT `official_travel_submitted_by_foreign` FOREIGN KEY (`submitted_by`) REFERENCES `employees` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `official_travel`
--

LOCK TABLES `official_travel` WRITE;
/*!40000 ALTER TABLE `official_travel` DISABLE KEYS */;
/*!40000 ALTER TABLE `official_travel` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `official_travel_approvals`
--

DROP TABLE IF EXISTS `official_travel_approvals`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `official_travel_approvals` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `official_travel_id` bigint(20) unsigned NOT NULL,
  `approver_id` bigint(20) unsigned NOT NULL,
  `status` enum('approved','rejected') NOT NULL,
  `notes` text DEFAULT NULL,
  `action_date` timestamp NOT NULL DEFAULT current_timestamp(),
  `employee_id` bigint(20) unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `official_travel_approvals_official_travel_id_foreign` (`official_travel_id`),
  KEY `official_travel_approvals_approver_id_foreign` (`approver_id`),
  CONSTRAINT `official_travel_approvals_approver_id_foreign` FOREIGN KEY (`approver_id`) REFERENCES `employees` (`id`),
  CONSTRAINT `official_travel_approvals_official_travel_id_foreign` FOREIGN KEY (`official_travel_id`) REFERENCES `official_travels` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `official_travel_approvals`
--

LOCK TABLES `official_travel_approvals` WRITE;
/*!40000 ALTER TABLE `official_travel_approvals` DISABLE KEYS */;
/*!40000 ALTER TABLE `official_travel_approvals` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `official_travel_documents`
--

DROP TABLE IF EXISTS `official_travel_documents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `official_travel_documents` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `official_travel_id` bigint(20) unsigned NOT NULL,
  `title` varchar(255) NOT NULL,
  `file_path` varchar(255) NOT NULL,
  `file_type` varchar(255) DEFAULT NULL,
  `uploaded_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `official_travel_documents_official_travel_id_foreign` (`official_travel_id`),
  CONSTRAINT `official_travel_documents_official_travel_id_foreign` FOREIGN KEY (`official_travel_id`) REFERENCES `official_travels` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `official_travel_documents`
--

LOCK TABLES `official_travel_documents` WRITE;
/*!40000 ALTER TABLE `official_travel_documents` DISABLE KEYS */;
/*!40000 ALTER TABLE `official_travel_documents` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `official_travel_itineraries`
--

DROP TABLE IF EXISTS `official_travel_itineraries`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `official_travel_itineraries` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `official_travel_id` bigint(20) unsigned NOT NULL,
  `date` date NOT NULL,
  `location` varchar(255) NOT NULL,
  `activity` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `official_travel_itineraries_official_travel_id_foreign` (`official_travel_id`),
  CONSTRAINT `official_travel_itineraries_official_travel_id_foreign` FOREIGN KEY (`official_travel_id`) REFERENCES `official_travels` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `official_travel_itineraries`
--

LOCK TABLES `official_travel_itineraries` WRITE;
/*!40000 ALTER TABLE `official_travel_itineraries` DISABLE KEYS */;
/*!40000 ALTER TABLE `official_travel_itineraries` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `official_travel_members`
--

DROP TABLE IF EXISTS `official_travel_members`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `official_travel_members` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `official_travel_id` bigint(20) unsigned NOT NULL,
  `employee_id` bigint(20) unsigned NOT NULL,
  `report_date` date NOT NULL,
  `summary` text NOT NULL,
  `attachment` varchar(255) DEFAULT NULL,
  `role` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `official_travel_members_official_travel_id_foreign` (`official_travel_id`),
  KEY `official_travel_members_employee_id_foreign` (`employee_id`),
  CONSTRAINT `official_travel_members_employee_id_foreign` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`),
  CONSTRAINT `official_travel_members_official_travel_id_foreign` FOREIGN KEY (`official_travel_id`) REFERENCES `official_travels` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `official_travel_members`
--

LOCK TABLES `official_travel_members` WRITE;
/*!40000 ALTER TABLE `official_travel_members` DISABLE KEYS */;
/*!40000 ALTER TABLE `official_travel_members` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `organization_units`
--

DROP TABLE IF EXISTS `organization_units`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `organization_units` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `code` varchar(255) DEFAULT NULL,
  `parent_id` bigint(20) unsigned DEFAULT NULL,
  `type` enum('university','faculty','department','lab','unit') NOT NULL,
  `description` text DEFAULT NULL,
  `organization_unit_id` bigint(20) unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `organization_units_code_unique` (`code`),
  KEY `organization_units_parent_id_foreign` (`parent_id`),
  CONSTRAINT `organization_units_parent_id_foreign` FOREIGN KEY (`parent_id`) REFERENCES `organization_units` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `organization_units`
--

LOCK TABLES `organization_units` WRITE;
/*!40000 ALTER TABLE `organization_units` DISABLE KEYS */;
INSERT INTO `organization_units` VALUES (1,'Fakultas Teknologi Informasi','FTI',NULL,'faculty','FTI Unand',1,'2026-06-04 01:37:33','2026-06-04 01:37:33');
/*!40000 ALTER TABLE `organization_units` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `overtime_approval_logs`
--

DROP TABLE IF EXISTS `overtime_approval_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `overtime_approval_logs` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `overtime_request_id` bigint(20) unsigned NOT NULL,
  `approver_id` bigint(20) unsigned NOT NULL,
  `status` enum('approved','rejected') NOT NULL,
  `notes` text DEFAULT NULL,
  `action_date` timestamp NOT NULL DEFAULT current_timestamp(),
  `employee_id` bigint(20) unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `overtime_approval_logs_overtime_request_id_foreign` (`overtime_request_id`),
  KEY `overtime_approval_logs_approver_id_foreign` (`approver_id`),
  CONSTRAINT `overtime_approval_logs_approver_id_foreign` FOREIGN KEY (`approver_id`) REFERENCES `employees` (`id`),
  CONSTRAINT `overtime_approval_logs_overtime_request_id_foreign` FOREIGN KEY (`overtime_request_id`) REFERENCES `overtime_requests` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `overtime_approval_logs`
--

LOCK TABLES `overtime_approval_logs` WRITE;
/*!40000 ALTER TABLE `overtime_approval_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `overtime_approval_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `overtime_request_members`
--

DROP TABLE IF EXISTS `overtime_request_members`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `overtime_request_members` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `overtime_request_id` bigint(20) unsigned NOT NULL,
  `employee_id` bigint(20) unsigned NOT NULL,
  `role` varchar(255) DEFAULT NULL,
  `job_desc` varchar(255) DEFAULT NULL,
  `planned_hours` decimal(5,2) NOT NULL,
  `actual_start_time` datetime NOT NULL,
  `actual_end_time` datetime NOT NULL,
  `actual_hours` decimal(5,2) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `overtime_request_members_overtime_request_id_foreign` (`overtime_request_id`),
  KEY `overtime_request_members_employee_id_foreign` (`employee_id`),
  CONSTRAINT `overtime_request_members_employee_id_foreign` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`),
  CONSTRAINT `overtime_request_members_overtime_request_id_foreign` FOREIGN KEY (`overtime_request_id`) REFERENCES `overtime_requests` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `overtime_request_members`
--

LOCK TABLES `overtime_request_members` WRITE;
/*!40000 ALTER TABLE `overtime_request_members` DISABLE KEYS */;
/*!40000 ALTER TABLE `overtime_request_members` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `overtime_requests`
--

DROP TABLE IF EXISTS `overtime_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `overtime_requests` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `request_number` varchar(255) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `request_date` date NOT NULL,
  `planned_start_time` datetime NOT NULL,
  `planned_end_time` datetime NOT NULL,
  `submitted_by` bigint(20) unsigned NOT NULL,
  `approved_by` bigint(20) unsigned DEFAULT NULL,
  `status` enum('draft','pending','approved','rejected','completed','cancelled') NOT NULL,
  `submitted_at` timestamp NULL DEFAULT NULL,
  `approved_at` timestamp NULL DEFAULT NULL,
  `submitted_by_id` bigint(20) unsigned NOT NULL,
  `approved_by_id` bigint(20) unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `overtime_requests_request_number_unique` (`request_number`),
  KEY `overtime_requests_submitted_by_foreign` (`submitted_by`),
  KEY `overtime_requests_approved_by_foreign` (`approved_by`),
  CONSTRAINT `overtime_requests_approved_by_foreign` FOREIGN KEY (`approved_by`) REFERENCES `employees` (`id`),
  CONSTRAINT `overtime_requests_submitted_by_foreign` FOREIGN KEY (`submitted_by`) REFERENCES `employees` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `overtime_requests`
--

LOCK TABLES `overtime_requests` WRITE;
/*!40000 ALTER TABLE `overtime_requests` DISABLE KEYS */;
/*!40000 ALTER TABLE `overtime_requests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `partner_contacts`
--

DROP TABLE IF EXISTS `partner_contacts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `partner_contacts` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `partner_id` bigint(20) unsigned NOT NULL,
  `name` varchar(255) NOT NULL,
  `position` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `phone` varchar(255) DEFAULT NULL,
  `is_primary` tinyint(1) NOT NULL DEFAULT 0,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `partner_contacts_partner_id_foreign` (`partner_id`),
  CONSTRAINT `partner_contacts_partner_id_foreign` FOREIGN KEY (`partner_id`) REFERENCES `partners` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `partner_contacts`
--

LOCK TABLES `partner_contacts` WRITE;
/*!40000 ALTER TABLE `partner_contacts` DISABLE KEYS */;
/*!40000 ALTER TABLE `partner_contacts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `partner_follow_ups`
--

DROP TABLE IF EXISTS `partner_follow_ups`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `partner_follow_ups` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `partner_potential_id` bigint(20) unsigned NOT NULL,
  `activity_date` date NOT NULL,
  `notes` text DEFAULT NULL,
  `status` enum('planned','ongoing','completed') NOT NULL,
  `conducted_by` bigint(20) unsigned NOT NULL,
  `employee_id` bigint(20) unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `partner_follow_ups_partner_potential_id_foreign` (`partner_potential_id`),
  KEY `partner_follow_ups_conducted_by_foreign` (`conducted_by`),
  CONSTRAINT `partner_follow_ups_conducted_by_foreign` FOREIGN KEY (`conducted_by`) REFERENCES `employees` (`id`),
  CONSTRAINT `partner_follow_ups_partner_potential_id_foreign` FOREIGN KEY (`partner_potential_id`) REFERENCES `partner_potentials` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `partner_follow_ups`
--

LOCK TABLES `partner_follow_ups` WRITE;
/*!40000 ALTER TABLE `partner_follow_ups` DISABLE KEYS */;
/*!40000 ALTER TABLE `partner_follow_ups` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `partner_potential_fields`
--

DROP TABLE IF EXISTS `partner_potential_fields`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `partner_potential_fields` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `partner_potential_id` bigint(20) unsigned NOT NULL,
  `field` enum('research','community_service','internship','training','other') NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `partner_potential_fields_partner_potential_id_foreign` (`partner_potential_id`),
  CONSTRAINT `partner_potential_fields_partner_potential_id_foreign` FOREIGN KEY (`partner_potential_id`) REFERENCES `partner_potentials` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `partner_potential_fields`
--

LOCK TABLES `partner_potential_fields` WRITE;
/*!40000 ALTER TABLE `partner_potential_fields` DISABLE KEYS */;
/*!40000 ALTER TABLE `partner_potential_fields` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `partner_potentials`
--

DROP TABLE IF EXISTS `partner_potentials`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `partner_potentials` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `partner_id` bigint(20) unsigned NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `status` enum('identified','in_discussion','proposed','converted','rejected') NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `partner_potentials_partner_id_foreign` (`partner_id`),
  CONSTRAINT `partner_potentials_partner_id_foreign` FOREIGN KEY (`partner_id`) REFERENCES `partners` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `partner_potentials`
--

LOCK TABLES `partner_potentials` WRITE;
/*!40000 ALTER TABLE `partner_potentials` DISABLE KEYS */;
/*!40000 ALTER TABLE `partner_potentials` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `partners`
--

DROP TABLE IF EXISTS `partners`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `partners` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `type` enum('university','company','government','ngo','other') NOT NULL,
  `address` text DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `phone` varchar(255) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `partners`
--

LOCK TABLES `partners` WRITE;
/*!40000 ALTER TABLE `partners` DISABLE KEYS */;
/*!40000 ALTER TABLE `partners` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `partnership_documents`
--

DROP TABLE IF EXISTS `partnership_documents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `partnership_documents` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `partnership_id` bigint(20) unsigned NOT NULL,
  `file_path` varchar(255) NOT NULL,
  `signed_date` date NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `partnership_documents_partnership_id_foreign` (`partnership_id`),
  CONSTRAINT `partnership_documents_partnership_id_foreign` FOREIGN KEY (`partnership_id`) REFERENCES `partnerships` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `partnership_documents`
--

LOCK TABLES `partnership_documents` WRITE;
/*!40000 ALTER TABLE `partnership_documents` DISABLE KEYS */;
/*!40000 ALTER TABLE `partnership_documents` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `partnership_implementations`
--

DROP TABLE IF EXISTS `partnership_implementations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `partnership_implementations` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `partnership_id` bigint(20) unsigned NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `start_date` date NOT NULL,
  `end_date` date DEFAULT NULL,
  `status` enum('planned','ongoing','completed') NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `partnership_implementations_partnership_id_foreign` (`partnership_id`),
  CONSTRAINT `partnership_implementations_partnership_id_foreign` FOREIGN KEY (`partnership_id`) REFERENCES `partnerships` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `partnership_implementations`
--

LOCK TABLES `partnership_implementations` WRITE;
/*!40000 ALTER TABLE `partnership_implementations` DISABLE KEYS */;
/*!40000 ALTER TABLE `partnership_implementations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `partnerships`
--

DROP TABLE IF EXISTS `partnerships`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `partnerships` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `partner_id` bigint(20) unsigned NOT NULL,
  `partner_potential_id` bigint(20) unsigned DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `document_type` enum('moa','pks') NOT NULL,
  `document_number` varchar(255) NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `status` enum('active','expired','terminated') NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `partnerships_partner_id_foreign` (`partner_id`),
  KEY `partnerships_partner_potential_id_foreign` (`partner_potential_id`),
  CONSTRAINT `partnerships_partner_id_foreign` FOREIGN KEY (`partner_id`) REFERENCES `partners` (`id`),
  CONSTRAINT `partnerships_partner_potential_id_foreign` FOREIGN KEY (`partner_potential_id`) REFERENCES `partner_potentials` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `partnerships`
--

LOCK TABLES `partnerships` WRITE;
/*!40000 ALTER TABLE `partnerships` DISABLE KEYS */;
/*!40000 ALTER TABLE `partnerships` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `password_reset_tokens`
--

DROP TABLE IF EXISTS `password_reset_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `password_reset_tokens` (
  `email` varchar(255) NOT NULL,
  `token` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `password_reset_tokens`
--

LOCK TABLES `password_reset_tokens` WRITE;
/*!40000 ALTER TABLE `password_reset_tokens` DISABLE KEYS */;
/*!40000 ALTER TABLE `password_reset_tokens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `permissions`
--

DROP TABLE IF EXISTS `permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `permissions` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `guard_name` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `permissions_name_guard_name_unique` (`name`,`guard_name`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `permissions`
--

LOCK TABLES `permissions` WRITE;
/*!40000 ALTER TABLE `permissions` DISABLE KEYS */;
INSERT INTO `permissions` VALUES (1,'manage_procurement','web',NULL,NULL),(2,'manage_approval','web',NULL,NULL),(3,'manage_vendor','web',NULL,NULL),(4,'manage_po','web',NULL,NULL),(5,'manage_receiving','web',NULL,NULL);
/*!40000 ALTER TABLE `permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `publication_authors`
--

DROP TABLE IF EXISTS `publication_authors`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `publication_authors` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `publication_id` bigint(20) unsigned NOT NULL,
  `lecturer_id` bigint(20) unsigned NOT NULL,
  `author_order` int(11) NOT NULL,
  `is_corresponding` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `publication_authors_publication_id_foreign` (`publication_id`),
  KEY `publication_authors_lecturer_id_foreign` (`lecturer_id`),
  CONSTRAINT `publication_authors_lecturer_id_foreign` FOREIGN KEY (`lecturer_id`) REFERENCES `lecturers` (`id`),
  CONSTRAINT `publication_authors_publication_id_foreign` FOREIGN KEY (`publication_id`) REFERENCES `publications` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `publication_authors`
--

LOCK TABLES `publication_authors` WRITE;
/*!40000 ALTER TABLE `publication_authors` DISABLE KEYS */;
/*!40000 ALTER TABLE `publication_authors` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `publications`
--

DROP TABLE IF EXISTS `publications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `publications` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `publication_date` date NOT NULL,
  `doi` varchar(255) DEFAULT NULL,
  `url` varchar(255) DEFAULT NULL,
  `abstract` text DEFAULT NULL,
  `research_id` bigint(20) unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `publications_research_id_foreign` (`research_id`),
  CONSTRAINT `publications_research_id_foreign` FOREIGN KEY (`research_id`) REFERENCES `research` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `publications`
--

LOCK TABLES `publications` WRITE;
/*!40000 ALTER TABLE `publications` DISABLE KEYS */;
/*!40000 ALTER TABLE `publications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `research`
--

DROP TABLE IF EXISTS `research`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `research` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `start_date` date NOT NULL,
  `end_date` date DEFAULT NULL,
  `funding_source` varchar(255) DEFAULT NULL,
  `budget` decimal(12,2) DEFAULT NULL,
  `status` enum('proposed','ongoing','completed') NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `research`
--

LOCK TABLES `research` WRITE;
/*!40000 ALTER TABLE `research` DISABLE KEYS */;
/*!40000 ALTER TABLE `research` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `research_members`
--

DROP TABLE IF EXISTS `research_members`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `research_members` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `research_id` bigint(20) unsigned NOT NULL,
  `lecturer_id` bigint(20) unsigned NOT NULL,
  `role` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `research_members_research_id_foreign` (`research_id`),
  KEY `research_members_lecturer_id_foreign` (`lecturer_id`),
  CONSTRAINT `research_members_lecturer_id_foreign` FOREIGN KEY (`lecturer_id`) REFERENCES `lecturers` (`id`),
  CONSTRAINT `research_members_research_id_foreign` FOREIGN KEY (`research_id`) REFERENCES `research` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `research_members`
--

LOCK TABLES `research_members` WRITE;
/*!40000 ALTER TABLE `research_members` DISABLE KEYS */;
/*!40000 ALTER TABLE `research_members` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `role_has_permissions`
--

DROP TABLE IF EXISTS `role_has_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `role_has_permissions` (
  `permission_id` bigint(20) unsigned NOT NULL,
  `role_id` bigint(20) unsigned NOT NULL,
  PRIMARY KEY (`permission_id`,`role_id`),
  KEY `role_has_permissions_role_id_foreign` (`role_id`),
  CONSTRAINT `role_has_permissions_permission_id_foreign` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `role_has_permissions_role_id_foreign` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `role_has_permissions`
--

LOCK TABLES `role_has_permissions` WRITE;
/*!40000 ALTER TABLE `role_has_permissions` DISABLE KEYS */;
INSERT INTO `role_has_permissions` VALUES (1,1),(2,2),(3,1),(4,1),(5,1);
/*!40000 ALTER TABLE `role_has_permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `roles`
--

DROP TABLE IF EXISTS `roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `roles` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `guard_name` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `roles_name_guard_name_unique` (`name`,`guard_name`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `roles`
--

LOCK TABLES `roles` WRITE;
/*!40000 ALTER TABLE `roles` DISABLE KEYS */;
INSERT INTO `roles` VALUES (1,'admin','web',NULL,NULL),(2,'wadir','web',NULL,NULL);
/*!40000 ALTER TABLE `roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `room_loans`
--

DROP TABLE IF EXISTS `room_loans`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `room_loans` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `room_id` bigint(20) unsigned NOT NULL,
  `employee_id` bigint(20) unsigned NOT NULL,
  `start_time` datetime NOT NULL,
  `end_time` datetime NOT NULL,
  `purpose` varchar(255) DEFAULT NULL,
  `status` enum('requested','approved','rejected','completed') NOT NULL,
  `approved_by` bigint(20) unsigned DEFAULT NULL,
  `approved_by_id` bigint(20) unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `room_loans_asset_room_id_foreign` (`room_id`),
  KEY `room_loans_employee_id_foreign` (`employee_id`),
  KEY `room_loans_approved_by_foreign` (`approved_by`),
  CONSTRAINT `room_loans_approved_by_foreign` FOREIGN KEY (`approved_by`) REFERENCES `employees` (`id`),
  CONSTRAINT `room_loans_asset_room_id_foreign` FOREIGN KEY (`room_id`) REFERENCES `rooms` (`id`),
  CONSTRAINT `room_loans_employee_id_foreign` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `room_loans`
--

LOCK TABLES `room_loans` WRITE;
/*!40000 ALTER TABLE `room_loans` DISABLE KEYS */;
/*!40000 ALTER TABLE `room_loans` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `room_maintenance_request_log`
--

DROP TABLE IF EXISTS `room_maintenance_request_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `room_maintenance_request_log` (
  `id` bigint(20) NOT NULL,
  `room_maintenance_request_id` bigint(20) unsigned DEFAULT NULL,
  `log` varchar(45) DEFAULT NULL,
  `logged_by` bigint(20) unsigned DEFAULT NULL,
  `logged_at` datetime DEFAULT NULL,
  `log_file` varchar(255) DEFAULT NULL,
  `verified_by` bigint(20) unsigned DEFAULT NULL,
  `verified_at` datetime DEFAULT NULL,
  `verification_file` varchar(255) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `status` int(11) DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_room_maintenance_request_log_room_maintenance_requests1_idx` (`room_maintenance_request_id`),
  KEY `fk_room_maintenance_request_log_employees1_idx` (`logged_by`),
  KEY `fk_room_maintenance_request_log_employees2_idx` (`verified_by`),
  CONSTRAINT `fk_room_maintenance_request_log_employees1` FOREIGN KEY (`logged_by`) REFERENCES `employees` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `fk_room_maintenance_request_log_employees2` FOREIGN KEY (`verified_by`) REFERENCES `employees` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `fk_room_maintenance_request_log_room_maintenance_requests1` FOREIGN KEY (`room_maintenance_request_id`) REFERENCES `room_maintenance_requests` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `room_maintenance_request_log`
--

LOCK TABLES `room_maintenance_request_log` WRITE;
/*!40000 ALTER TABLE `room_maintenance_request_log` DISABLE KEYS */;
/*!40000 ALTER TABLE `room_maintenance_request_log` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `room_maintenance_requests`
--

DROP TABLE IF EXISTS `room_maintenance_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `room_maintenance_requests` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `room_id` bigint(20) unsigned NOT NULL,
  `reported_by` bigint(20) unsigned NOT NULL,
  `issue_description` text NOT NULL,
  `status` enum('reported','in_progress','resolved') NOT NULL,
  `reported_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `resolved_at` timestamp NULL DEFAULT NULL,
  `employee_id` bigint(20) unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `room_maintenance_requests_asset_room_id_foreign` (`room_id`),
  KEY `room_maintenance_requests_reported_by_foreign` (`reported_by`),
  CONSTRAINT `room_maintenance_requests_asset_room_id_foreign` FOREIGN KEY (`room_id`) REFERENCES `rooms` (`id`),
  CONSTRAINT `room_maintenance_requests_reported_by_foreign` FOREIGN KEY (`reported_by`) REFERENCES `employees` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `room_maintenance_requests`
--

LOCK TABLES `room_maintenance_requests` WRITE;
/*!40000 ALTER TABLE `room_maintenance_requests` DISABLE KEYS */;
/*!40000 ALTER TABLE `room_maintenance_requests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `rooms`
--

DROP TABLE IF EXISTS `rooms`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `rooms` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `asset_id` bigint(20) unsigned NOT NULL,
  `building_id` bigint(20) unsigned NOT NULL,
  `name` varchar(255) NOT NULL,
  `code` varchar(255) NOT NULL,
  `floor` varchar(255) DEFAULT NULL,
  `capacity` int(11) NOT NULL,
  `is_public` tinyint(1) NOT NULL DEFAULT 0,
  `responsible_employee_id` bigint(20) unsigned NOT NULL,
  `employee_id` bigint(20) unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `asset_rooms_code_unique` (`code`),
  KEY `asset_rooms_asset_id_foreign` (`asset_id`),
  KEY `asset_rooms_building_id_foreign` (`building_id`),
  KEY `asset_rooms_responsible_employee_id_foreign` (`responsible_employee_id`),
  CONSTRAINT `asset_rooms_asset_id_foreign` FOREIGN KEY (`asset_id`) REFERENCES `assets` (`id`),
  CONSTRAINT `asset_rooms_building_id_foreign` FOREIGN KEY (`building_id`) REFERENCES `buildings` (`id`),
  CONSTRAINT `asset_rooms_responsible_employee_id_foreign` FOREIGN KEY (`responsible_employee_id`) REFERENCES `employees` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rooms`
--

LOCK TABLES `rooms` WRITE;
/*!40000 ALTER TABLE `rooms` DISABLE KEYS */;
/*!40000 ALTER TABLE `rooms` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sessions`
--

DROP TABLE IF EXISTS `sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `sessions` (
  `id` varchar(255) NOT NULL,
  `user_id` bigint(20) unsigned DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `payload` longtext NOT NULL,
  `last_activity` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `sessions_user_id_index` (`user_id`),
  KEY `sessions_last_activity_index` (`last_activity`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sessions`
--

LOCK TABLES `sessions` WRITE;
/*!40000 ALTER TABLE `sessions` DISABLE KEYS */;
/*!40000 ALTER TABLE `sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `staff`
--

DROP TABLE IF EXISTS `staff`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `staff` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `position` varchar(255) NOT NULL,
  `department` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `staff_employee_id_foreign` FOREIGN KEY (`id`) REFERENCES `employees` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `staff`
--

LOCK TABLES `staff` WRITE;
/*!40000 ALTER TABLE `staff` DISABLE KEYS */;
/*!40000 ALTER TABLE `staff` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `staff_nomenclature_histories`
--

DROP TABLE IF EXISTS `staff_nomenclature_histories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `staff_nomenclature_histories` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `staff_id` bigint(20) unsigned NOT NULL,
  `nomenclature_class_id` bigint(20) unsigned NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date DEFAULT NULL,
  `nomenclature_classification_id` bigint(20) unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `staff_nomenclature_histories_staff_id_foreign` (`staff_id`),
  KEY `staff_nomenclature_histories_nomenclature_class_id_foreign` (`nomenclature_class_id`),
  CONSTRAINT `staff_nomenclature_histories_nomenclature_class_id_foreign` FOREIGN KEY (`nomenclature_class_id`) REFERENCES `nomenclature_classifications` (`id`),
  CONSTRAINT `staff_nomenclature_histories_staff_id_foreign` FOREIGN KEY (`staff_id`) REFERENCES `staff` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `staff_nomenclature_histories`
--

LOCK TABLES `staff_nomenclature_histories` WRITE;
/*!40000 ALTER TABLE `staff_nomenclature_histories` DISABLE KEYS */;
/*!40000 ALTER TABLE `staff_nomenclature_histories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `structural_position_histories`
--

DROP TABLE IF EXISTS `structural_position_histories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `structural_position_histories` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `employee_id` bigint(20) unsigned NOT NULL,
  `structural_position_id` bigint(20) unsigned NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date DEFAULT NULL,
  `decree_number` varchar(255) DEFAULT NULL,
  `decree_date` date DEFAULT NULL,
  `document` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `structural_position_histories_employee_id_foreign` (`employee_id`),
  KEY `structural_position_histories_structural_position_id_foreign` (`structural_position_id`),
  CONSTRAINT `structural_position_histories_employee_id_foreign` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`),
  CONSTRAINT `structural_position_histories_structural_position_id_foreign` FOREIGN KEY (`structural_position_id`) REFERENCES `structural_positions` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `structural_position_histories`
--

LOCK TABLES `structural_position_histories` WRITE;
/*!40000 ALTER TABLE `structural_position_histories` DISABLE KEYS */;
/*!40000 ALTER TABLE `structural_position_histories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `structural_positions`
--

DROP TABLE IF EXISTS `structural_positions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `structural_positions` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `parent_id` bigint(20) unsigned DEFAULT NULL,
  `grade` varchar(255) NOT NULL,
  `qualification` text DEFAULT NULL,
  `description` text DEFAULT NULL,
  `structural_position_id` bigint(20) unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `structural_positions_parent_id_foreign` (`parent_id`),
  CONSTRAINT `structural_positions_parent_id_foreign` FOREIGN KEY (`parent_id`) REFERENCES `structural_positions` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `structural_positions`
--

LOCK TABLES `structural_positions` WRITE;
/*!40000 ALTER TABLE `structural_positions` DISABLE KEYS */;
/*!40000 ALTER TABLE `structural_positions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `student_request_active_references`
--

DROP TABLE IF EXISTS `student_request_active_references`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `student_request_active_references` (
  `id` bigint(20) unsigned NOT NULL,
  `student_requests_id` bigint(20) unsigned NOT NULL,
  `student_study_plan_file` varchar(45) DEFAULT NULL,
  `parent_decree_file` varchar(45) DEFAULT NULL,
  `checked_by` bigint(20) unsigned NOT NULL,
  `checked_at` datetime DEFAULT NULL,
  `check_reason` text DEFAULT NULL,
  `signed_by` bigint(20) unsigned NOT NULL,
  `signed_at` datetime DEFAULT NULL,
  `sign_reason` text DEFAULT NULL,
  `status` varchar(45) DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_student_request_recomendations_student_requests1_idx` (`student_requests_id`),
  KEY `fk_student_request_recomendations_employees1_idx` (`signed_by`),
  KEY `fk_student_request_recomendations_employees2_idx` (`checked_by`),
  CONSTRAINT `fk_student_request_recomendations_employees1` FOREIGN KEY (`signed_by`) REFERENCES `employees` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `fk_student_request_recomendations_employees2` FOREIGN KEY (`checked_by`) REFERENCES `employees` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `fk_student_request_recomendations_student_requests1` FOREIGN KEY (`student_requests_id`) REFERENCES `student_requests` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `student_request_active_references`
--

LOCK TABLES `student_request_active_references` WRITE;
/*!40000 ALTER TABLE `student_request_active_references` DISABLE KEYS */;
/*!40000 ALTER TABLE `student_request_active_references` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `student_request_grad_references`
--

DROP TABLE IF EXISTS `student_request_grad_references`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `student_request_grad_references` (
  `id` bigint(20) unsigned NOT NULL,
  `student_requests_id` bigint(20) unsigned NOT NULL,
  `cover_letter_department_file` varchar(45) DEFAULT NULL,
  `proof_o_grad_registration_file` varchar(45) DEFAULT NULL,
  `checked_by` bigint(20) unsigned NOT NULL,
  `checked_at` datetime DEFAULT NULL,
  `check_reason` text DEFAULT NULL,
  `signed_by` bigint(20) unsigned NOT NULL,
  `signed_at` datetime DEFAULT NULL,
  `sign_reason` text DEFAULT NULL,
  `status` varchar(45) DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_student_request_recomendations_student_requests1_idx` (`student_requests_id`),
  KEY `fk_student_request_recomendations_employees1_idx` (`signed_by`),
  KEY `fk_student_request_recomendations_employees2_idx` (`checked_by`),
  CONSTRAINT `fk_student_request_recomendations_employees10` FOREIGN KEY (`signed_by`) REFERENCES `employees` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `fk_student_request_recomendations_employees20` FOREIGN KEY (`checked_by`) REFERENCES `employees` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `fk_student_request_recomendations_student_requests10` FOREIGN KEY (`student_requests_id`) REFERENCES `student_requests` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `student_request_grad_references`
--

LOCK TABLES `student_request_grad_references` WRITE;
/*!40000 ALTER TABLE `student_request_grad_references` DISABLE KEYS */;
/*!40000 ALTER TABLE `student_request_grad_references` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `student_request_refund`
--

DROP TABLE IF EXISTS `student_request_refund`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `student_request_refund` (
  `id` bigint(20) unsigned NOT NULL,
  `student_request_id` bigint(20) unsigned DEFAULT NULL,
  `refund_type` enum('UKT','PI') DEFAULT NULL,
  `reason` text DEFAULT NULL,
  `refund_nominal` int(11) DEFAULT NULL,
  `application_letter_file` varchar(45) DEFAULT NULL,
  `ukt_payment_receipt_file` varchar(45) DEFAULT NULL,
  `rector_decree_file` varchar(45) DEFAULT NULL,
  `saving_book_fiel` varchar(45) DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_student_request_refund_student_requests1_idx` (`student_request_id`),
  CONSTRAINT `fk_student_request_refund_student_requests1` FOREIGN KEY (`student_request_id`) REFERENCES `student_requests` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `student_request_refund`
--

LOCK TABLES `student_request_refund` WRITE;
/*!40000 ALTER TABLE `student_request_refund` DISABLE KEYS */;
/*!40000 ALTER TABLE `student_request_refund` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `student_request_refund_approvals`
--

DROP TABLE IF EXISTS `student_request_refund_approvals`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `student_request_refund_approvals` (
  `id` bigint(20) unsigned NOT NULL,
  `student_request_refund_id` bigint(20) unsigned NOT NULL,
  `level` varchar(45) DEFAULT NULL,
  `approved_by` bigint(20) unsigned NOT NULL,
  `approval_reason` varchar(45) DEFAULT NULL,
  `approval_position` varchar(45) DEFAULT NULL,
  `status` int(11) DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_student_request_refund_approvals_student_request_refund1_idx` (`student_request_refund_id`),
  KEY `fk_student_request_refund_approvals_employees1_idx` (`approved_by`),
  CONSTRAINT `fk_student_request_refund_approvals_employees1` FOREIGN KEY (`approved_by`) REFERENCES `employees` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `fk_student_request_refund_approvals_student_request_refund1` FOREIGN KEY (`student_request_refund_id`) REFERENCES `student_request_refund` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `student_request_refund_approvals`
--

LOCK TABLES `student_request_refund_approvals` WRITE;
/*!40000 ALTER TABLE `student_request_refund_approvals` DISABLE KEYS */;
/*!40000 ALTER TABLE `student_request_refund_approvals` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `student_request_resignation`
--

DROP TABLE IF EXISTS `student_request_resignation`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `student_request_resignation` (
  `id` bigint(20) unsigned NOT NULL,
  `student_requests_id` bigint(20) unsigned NOT NULL,
  `student_address` text DEFAULT NULL,
  `student_hp` varchar(45) DEFAULT NULL,
  `current_gpa` double DEFAULT NULL,
  `current_credits` int(11) DEFAULT NULL,
  `reasons` varchar(45) DEFAULT NULL,
  `application_letter_file` varchar(45) DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_student_request_resignation_student_requests1_idx` (`student_requests_id`),
  CONSTRAINT `fk_student_request_resignation_student_requests1` FOREIGN KEY (`student_requests_id`) REFERENCES `student_requests` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `student_request_resignation`
--

LOCK TABLES `student_request_resignation` WRITE;
/*!40000 ALTER TABLE `student_request_resignation` DISABLE KEYS */;
/*!40000 ALTER TABLE `student_request_resignation` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `student_request_resignation_approvals`
--

DROP TABLE IF EXISTS `student_request_resignation_approvals`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `student_request_resignation_approvals` (
  `id` bigint(20) unsigned NOT NULL,
  `student_request_resignation_id` bigint(20) unsigned NOT NULL,
  `level` varchar(45) DEFAULT NULL,
  `approved_by` bigint(20) unsigned NOT NULL,
  `approval_reason` varchar(45) DEFAULT NULL,
  `approval_position` varchar(45) DEFAULT NULL,
  `status` int(11) DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_student_request_refund_approvals_employees1_idx` (`approved_by`),
  KEY `fk_student_request_refund_approvals_student_request_refund1_idx` (`student_request_resignation_id`),
  CONSTRAINT `fk_student_request_refund_approvals_employees10` FOREIGN KEY (`approved_by`) REFERENCES `employees` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `fk_student_request_refund_approvals_student_request_refund10` FOREIGN KEY (`student_request_resignation_id`) REFERENCES `student_request_resignation` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `student_request_resignation_approvals`
--

LOCK TABLES `student_request_resignation_approvals` WRITE;
/*!40000 ALTER TABLE `student_request_resignation_approvals` DISABLE KEYS */;
/*!40000 ALTER TABLE `student_request_resignation_approvals` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `student_requests`
--

DROP TABLE IF EXISTS `student_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `student_requests` (
  `id` bigint(20) unsigned NOT NULL,
  `request_nunmber` varchar(45) DEFAULT NULL,
  `request_type` varchar(45) DEFAULT NULL,
  `title` varchar(45) DEFAULT NULL,
  `description` varchar(45) DEFAULT NULL,
  `status` int(11) DEFAULT NULL,
  `requested_by` bigint(20) unsigned DEFAULT NULL,
  `requested_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_student_requests_students1_idx` (`requested_by`),
  CONSTRAINT `fk_student_requests_students1` FOREIGN KEY (`requested_by`) REFERENCES `students` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `student_requests`
--

LOCK TABLES `student_requests` WRITE;
/*!40000 ALTER TABLE `student_requests` DISABLE KEYS */;
/*!40000 ALTER TABLE `student_requests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `students`
--

DROP TABLE IF EXISTS `students`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `students` (
  `id` bigint(20) unsigned NOT NULL,
  `name` varchar(255) NOT NULL,
  `regno` varchar(255) NOT NULL,
  `birth_date` datetime DEFAULT NULL,
  `birth_place` varchar(45) DEFAULT NULL,
  `gender` int(11) DEFAULT NULL,
  `religion` int(11) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `campus_email` varchar(255) DEFAULT NULL,
  `phone_no` varchar(45) DEFAULT NULL,
  `home_address` varchar(255) DEFAULT NULL,
  `home_town` varchar(45) DEFAULT NULL,
  `home_province` varchar(45) DEFAULT NULL,
  `home_postalcode` varchar(5) DEFAULT NULL,
  `current_address` varchar(255) DEFAULT NULL,
  `current_town` varchar(45) DEFAULT NULL,
  `current_province` varchar(45) DEFAULT NULL,
  `current_postalcode` varchar(5) DEFAULT NULL,
  `department_id` bigint(20) unsigned DEFAULT NULL,
  `year` int(11) DEFAULT NULL,
  `status` int(11) DEFAULT NULL,
  `advisor_id` bigint(20) unsigned DEFAULT NULL,
  `citizenship` varchar(45) DEFAULT NULL,
  `photo` varchar(45) DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_students_lecturers1_idx` (`advisor_id`),
  KEY `fk_students_organization_units1_idx` (`department_id`),
  CONSTRAINT `fk_students_lecturers1` FOREIGN KEY (`advisor_id`) REFERENCES `lecturers` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `fk_students_organization_units1` FOREIGN KEY (`department_id`) REFERENCES `organization_units` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `fk_students_users` FOREIGN KEY (`id`) REFERENCES `users` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `students`
--

LOCK TABLES `students` WRITE;
/*!40000 ALTER TABLE `students` DISABLE KEYS */;
/*!40000 ALTER TABLE `students` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `survey_answer_options`
--

DROP TABLE IF EXISTS `survey_answer_options`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `survey_answer_options` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `survey_answer_id` bigint(20) unsigned NOT NULL,
  `survey_question_option_id` bigint(20) unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `survey_answer_options_survey_answer_id_foreign` (`survey_answer_id`),
  KEY `survey_answer_options_survey_question_option_id_foreign` (`survey_question_option_id`),
  CONSTRAINT `survey_answer_options_survey_answer_id_foreign` FOREIGN KEY (`survey_answer_id`) REFERENCES `survey_answers` (`id`),
  CONSTRAINT `survey_answer_options_survey_question_option_id_foreign` FOREIGN KEY (`survey_question_option_id`) REFERENCES `survey_question_options` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `survey_answer_options`
--

LOCK TABLES `survey_answer_options` WRITE;
/*!40000 ALTER TABLE `survey_answer_options` DISABLE KEYS */;
/*!40000 ALTER TABLE `survey_answer_options` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `survey_answers`
--

DROP TABLE IF EXISTS `survey_answers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `survey_answers` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `survey_response_id` bigint(20) unsigned NOT NULL,
  `survey_question_id` bigint(20) unsigned NOT NULL,
  `answer_text` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `survey_answers_survey_response_id_foreign` (`survey_response_id`),
  KEY `survey_answers_survey_question_id_foreign` (`survey_question_id`),
  CONSTRAINT `survey_answers_survey_question_id_foreign` FOREIGN KEY (`survey_question_id`) REFERENCES `survey_questions` (`id`),
  CONSTRAINT `survey_answers_survey_response_id_foreign` FOREIGN KEY (`survey_response_id`) REFERENCES `survey_responses` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `survey_answers`
--

LOCK TABLES `survey_answers` WRITE;
/*!40000 ALTER TABLE `survey_answers` DISABLE KEYS */;
/*!40000 ALTER TABLE `survey_answers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `survey_invitations`
--

DROP TABLE IF EXISTS `survey_invitations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `survey_invitations` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `survey_id` bigint(20) unsigned NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `phone` varchar(255) DEFAULT NULL,
  `pin` varchar(255) NOT NULL,
  `is_used` tinyint(1) NOT NULL DEFAULT 0,
  `used_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `survey_invitations_pin_unique` (`pin`),
  KEY `survey_invitations_survey_id_foreign` (`survey_id`),
  CONSTRAINT `survey_invitations_survey_id_foreign` FOREIGN KEY (`survey_id`) REFERENCES `surveys` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `survey_invitations`
--

LOCK TABLES `survey_invitations` WRITE;
/*!40000 ALTER TABLE `survey_invitations` DISABLE KEYS */;
/*!40000 ALTER TABLE `survey_invitations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `survey_question_assignments`
--

DROP TABLE IF EXISTS `survey_question_assignments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `survey_question_assignments` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `survey_id` bigint(20) unsigned NOT NULL,
  `survey_question_id` bigint(20) unsigned NOT NULL,
  `order` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `survey_question_assignments_survey_id_foreign` (`survey_id`),
  KEY `survey_question_assignments_survey_question_id_foreign` (`survey_question_id`),
  CONSTRAINT `survey_question_assignments_survey_id_foreign` FOREIGN KEY (`survey_id`) REFERENCES `surveys` (`id`),
  CONSTRAINT `survey_question_assignments_survey_question_id_foreign` FOREIGN KEY (`survey_question_id`) REFERENCES `survey_questions` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `survey_question_assignments`
--

LOCK TABLES `survey_question_assignments` WRITE;
/*!40000 ALTER TABLE `survey_question_assignments` DISABLE KEYS */;
/*!40000 ALTER TABLE `survey_question_assignments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `survey_question_options`
--

DROP TABLE IF EXISTS `survey_question_options`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `survey_question_options` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `survey_question_id` bigint(20) unsigned NOT NULL,
  `option_text` varchar(255) NOT NULL,
  `weight` decimal(5,2) NOT NULL DEFAULT 0.00,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `survey_question_options_survey_question_id_foreign` (`survey_question_id`),
  CONSTRAINT `survey_question_options_survey_question_id_foreign` FOREIGN KEY (`survey_question_id`) REFERENCES `survey_questions` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `survey_question_options`
--

LOCK TABLES `survey_question_options` WRITE;
/*!40000 ALTER TABLE `survey_question_options` DISABLE KEYS */;
/*!40000 ALTER TABLE `survey_question_options` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `survey_questions`
--

DROP TABLE IF EXISTS `survey_questions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `survey_questions` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `question_text` text NOT NULL,
  `type` enum('single_choice','multiple_choice','short_answer') NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `survey_questions`
--

LOCK TABLES `survey_questions` WRITE;
/*!40000 ALTER TABLE `survey_questions` DISABLE KEYS */;
/*!40000 ALTER TABLE `survey_questions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `survey_responses`
--

DROP TABLE IF EXISTS `survey_responses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `survey_responses` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `survey_id` bigint(20) unsigned NOT NULL,
  `survey_invitation_id` bigint(20) unsigned NOT NULL,
  `submitted_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `survey_responses_survey_id_foreign` (`survey_id`),
  KEY `survey_responses_survey_invitation_id_foreign` (`survey_invitation_id`),
  CONSTRAINT `survey_responses_survey_id_foreign` FOREIGN KEY (`survey_id`) REFERENCES `surveys` (`id`),
  CONSTRAINT `survey_responses_survey_invitation_id_foreign` FOREIGN KEY (`survey_invitation_id`) REFERENCES `survey_invitations` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `survey_responses`
--

LOCK TABLES `survey_responses` WRITE;
/*!40000 ALTER TABLE `survey_responses` DISABLE KEYS */;
/*!40000 ALTER TABLE `survey_responses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `surveys`
--

DROP TABLE IF EXISTS `surveys`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `surveys` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 0,
  `created_by` bigint(20) unsigned NOT NULL,
  `employee_id` bigint(20) unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `surveys_created_by_foreign` (`created_by`),
  CONSTRAINT `surveys_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `employees` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `surveys`
--

LOCK TABLES `surveys` WRITE;
/*!40000 ALTER TABLE `surveys` DISABLE KEYS */;
/*!40000 ALTER TABLE `surveys` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `travel_cost_components`
--

DROP TABLE IF EXISTS `travel_cost_components`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `travel_cost_components` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `code` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `travel_cost_components_code_unique` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `travel_cost_components`
--

LOCK TABLES `travel_cost_components` WRITE;
/*!40000 ALTER TABLE `travel_cost_components` DISABLE KEYS */;
/*!40000 ALTER TABLE `travel_cost_components` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `travel_cost_standards`
--

DROP TABLE IF EXISTS `travel_cost_standards`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `travel_cost_standards` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `city_id` bigint(20) unsigned NOT NULL,
  `structural_position_id` bigint(20) unsigned DEFAULT NULL,
  `employee_grade_id` bigint(20) unsigned DEFAULT NULL,
  `travel_cost_component_id` bigint(20) unsigned NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `travel_cost_standards_city_id_foreign` (`city_id`),
  KEY `travel_cost_standards_structural_position_id_foreign` (`structural_position_id`),
  KEY `travel_cost_standards_employee_grade_id_foreign` (`employee_grade_id`),
  KEY `travel_cost_standards_travel_cost_component_id_foreign` (`travel_cost_component_id`),
  CONSTRAINT `travel_cost_standards_city_id_foreign` FOREIGN KEY (`city_id`) REFERENCES `cities` (`id`),
  CONSTRAINT `travel_cost_standards_employee_grade_id_foreign` FOREIGN KEY (`employee_grade_id`) REFERENCES `employee_grades` (`id`),
  CONSTRAINT `travel_cost_standards_structural_position_id_foreign` FOREIGN KEY (`structural_position_id`) REFERENCES `structural_positions` (`id`),
  CONSTRAINT `travel_cost_standards_travel_cost_component_id_foreign` FOREIGN KEY (`travel_cost_component_id`) REFERENCES `travel_cost_components` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `travel_cost_standards`
--

LOCK TABLES `travel_cost_standards` WRITE;
/*!40000 ALTER TABLE `travel_cost_standards` DISABLE KEYS */;
/*!40000 ALTER TABLE `travel_cost_standards` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `travel_expenses`
--

DROP TABLE IF EXISTS `travel_expenses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `travel_expenses` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `official_travel_id` bigint(20) unsigned NOT NULL,
  `employee_id` bigint(20) unsigned NOT NULL,
  `travel_cost_component_id` bigint(20) unsigned NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `description` text DEFAULT NULL,
  `receipt_file` varchar(255) DEFAULT NULL,
  `submitted_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `verified_at` timestamp NULL DEFAULT NULL,
  `status` enum('submitted','approved','rejected') NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `travel_expenses_official_travel_id_foreign` (`official_travel_id`),
  KEY `travel_expenses_employee_id_foreign` (`employee_id`),
  KEY `travel_expenses_travel_cost_component_id_foreign` (`travel_cost_component_id`),
  CONSTRAINT `travel_expenses_employee_id_foreign` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`),
  CONSTRAINT `travel_expenses_official_travel_id_foreign` FOREIGN KEY (`official_travel_id`) REFERENCES `official_travels` (`id`),
  CONSTRAINT `travel_expenses_travel_cost_component_id_foreign` FOREIGN KEY (`travel_cost_component_id`) REFERENCES `travel_cost_components` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `travel_expenses`
--

LOCK TABLES `travel_expenses` WRITE;
/*!40000 ALTER TABLE `travel_expenses` DISABLE KEYS */;
/*!40000 ALTER TABLE `travel_expenses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `users` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `two_factor_secret` text DEFAULT NULL,
  `two_factor_recovery_codes` text DEFAULT NULL,
  `two_factor_confirmed_at` timestamp NULL DEFAULT NULL,
  `remember_token` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_unique` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'Admin SIP','admin@unand.ac.id',NULL,'$2b$10$J1Ed8oNrrn6Ijm0HniwAeudj2Cws8BmcC3K80v20ApJYzAE0zXKPm',NULL,NULL,NULL,NULL,'2026-06-03 08:45:58','2026-06-03 23:09:49'),(2,'Wakil Dekan','wadir@unand.ac.id',NULL,'$2b$10$0pFeOu7t8jnYaAxUH7aMiOAcVxI8T6YRqCNckDncUhEanGF7YMFhe',NULL,NULL,NULL,NULL,'2026-06-03 08:53:27','2026-06-03 23:09:49');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-15 10:48:36
