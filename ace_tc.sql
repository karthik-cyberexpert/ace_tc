CREATE DATABASE  IF NOT EXISTS `ace_tc` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `ace_tc`;
-- MySQL dump 10.13  Distrib 8.0.45, for Win64 (x86_64)
--
-- Host: localhost    Database: ace_tc
-- ------------------------------------------------------
-- Server version	8.0.45

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `certificates`
--

DROP TABLE IF EXISTS `certificates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `certificates` (
  `id` int NOT NULL AUTO_INCREMENT,
  `student_id` int NOT NULL,
  `issue_date` date NOT NULL,
  `auth_code` varchar(100) NOT NULL,
  `status` varchar(50) NOT NULL,
  `tcPromotion` enum('yes','no') DEFAULT 'yes',
  `tcCompleted` enum('yes','no') DEFAULT 'yes',
  `tcFeesPaid` enum('yes','no') DEFAULT 'yes',
  `tcLeftDate` date DEFAULT NULL,
  `tcApplyDate` date DEFAULT NULL,
  `tcConduct` varchar(255) DEFAULT NULL,
  `tcScholarship` enum('yes','no') DEFAULT 'no',
  `tcScholarshipScheme` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `auth_code` (`auth_code`),
  KEY `student_id` (`student_id`),
  CONSTRAINT `certificates_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `certificates`
--

LOCK TABLES `certificates` WRITE;
/*!40000 ALTER TABLE `certificates` DISABLE KEYS */;
INSERT INTO `certificates` VALUES (1,100,'2026-04-07','BE22CSE049','AWAITING AUTH','yes','yes','yes','2026-04-07','2026-04-07','Good','yes','asdf'),(2,98,'2026-04-07','BE22CSE047','AWAITING AUTH','yes','yes','yes','2026-04-07','2026-04-07','Good','no',''),(3,74,'2026-04-07','BE22CSE023','AWAITING AUTH','yes','yes','yes','2026-04-07','2026-04-07','Good','no',''),(4,72,'2026-04-07','BE22CSE021','AWAITING AUTH','yes','yes','yes','2026-04-07','2026-04-07','Good','no',''),(5,58,'2026-04-07','BE22CSE007','AWAITING AUTH','yes','yes','yes','2026-04-07','2026-04-07','Good','no',''),(6,47,'2026-04-07','BE22CSE046','AWAITING AUTH','yes','yes','yes','2026-04-07','2026-04-07','Good','no',''),(7,4,'2026-04-07','BE22CSE003','ISSUED','yes','yes','yes','2026-04-07','2026-04-07','Good','no','');
/*!40000 ALTER TABLE `certificates` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `students`
--

DROP TABLE IF EXISTS `students`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `students` (
  `id` int NOT NULL AUTO_INCREMENT,
  `registerNo` varchar(50) NOT NULL,
  `admissionNo` varchar(50) NOT NULL,
  `umisNo` varchar(100) DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `fatherName` varchar(255) DEFAULT NULL,
  `nationality` varchar(100) DEFAULT NULL,
  `religion` varchar(100) DEFAULT NULL,
  `caste` varchar(100) DEFAULT NULL,
  `dob` date DEFAULT NULL,
  `dateOfAdmission` date DEFAULT NULL,
  `course` varchar(100) DEFAULT NULL,
  `branch` varchar(100) DEFAULT NULL,
  `mediumOfInstruction` varchar(50) DEFAULT NULL,
  `batchStart` varchar(10) DEFAULT NULL,
  `batchEnd` varchar(10) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `registerNo` (`registerNo`)
) ENGINE=InnoDB AUTO_INCREMENT=102 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `students`
--

LOCK TABLES `students` WRITE;
/*!40000 ALTER TABLE `students` DISABLE KEYS */;
INSERT INTO `students` VALUES (1,'REG1000','ADM2000','UMIS3000','Harish Patel','Manoj Sharma','Indian','Christian','BC','2005-05-29','2023-09-18','BE','ECE','English','2023','2027'),(2,'REG1001','ADM2001','UMIS3001','Karthik Gowda','Suresh Patel','Indian','Christian','ST','2002-04-18','2022-09-21','B.Tech','AIDS','English','2022','2026'),(3,'REG1002','ADM2002','UMIS3002','Vikram Reddy','Vikram Verma','Indian','Christian','MBC','2004-04-27','2023-06-04','BE','CSE','English','2023','2027'),(4,'REG1003','ADM2003','UMIS3003','Amit Iyer','Rohit Nair','Indian','Christian','BC','2003-11-21','2022-09-22','BE','CSE (CYBER SECURITY)','English','2022','2026'),(5,'REG1004','ADM2004','UMIS3004','Suresh Verma','Suresh Verma','Indian','Christian','SC','2005-02-10','2023-07-27','B.Tech','AIDS','English','2023','2027'),(6,'REG1005','ADM2005','UMIS3005','Amit Sharma','Arjun Iyer','Indian','Christian','OC','2005-09-09','2023-09-15','BE','CSE','English','2023','2027'),(7,'REG1006','ADM2006','UMIS3006','Vikram Verma','Harish Gowda','Indian','Christian','ST','2003-06-10','2022-01-06','B.Tech','AIDS','English','2022','2026'),(8,'REG1007','ADM2007','UMIS3007','Rahul Iyer','Vignesh Das','Indian','Hindu','MBC','2005-11-28','2023-05-24','BE','CSE (CYBER SECURITY)','English','2023','2027'),(9,'REG1008','ADM2008','UMIS3008','Karthik Singh','Rohit Patel','Indian','Muslim','MBC','2004-06-01','2023-11-03','BE','ECE','English','2023','2027'),(10,'REG1009','ADM2009','UMIS3009','Manoj Das','Karthik Nair','Indian','Christian','ST','2002-10-08','2023-11-22','BE','CSE','English','2023','2027'),(11,'REG1010','ADM2010','UMIS3010','Suresh Iyer','Karthik Nair','Indian','Hindu','ST','2005-10-12','2022-06-19','BE','ECE','English','2022','2026'),(12,'REG1011','ADM2011','UMIS3011','Vikram Das','Vignesh Verma','Indian','Christian','MBC','2005-08-31','2023-08-09','B.Tech','IT','English','2023','2027'),(13,'REG1012','ADM2012','UMIS3012','Vikram Kumar','Vignesh Reddy','Indian','Hindu','BC','2005-09-21','2023-11-18','B.Tech','AIDS','English','2023','2027'),(14,'REG1013','ADM2013','UMIS3013','Harish Das','Rahul Kumar','Indian','Hindu','ST','2003-04-24','2023-06-03','B.Tech','AIML','English','2023','2027'),(15,'REG1014','ADM2014','UMIS3014','Harish Das','Vignesh Iyer','Indian','Muslim','BC','2005-01-09','2022-02-19','BE','ECE','English','2022','2026'),(16,'REG1015','ADM2015','UMIS3015','Amit Reddy','Vignesh Patel','Indian','Christian','BC','2004-01-16','2022-03-22','B.Tech','IT','English','2022','2026'),(17,'REG1016','ADM2016','UMIS3016','Vikram Patel','Suresh Patel','Indian','Muslim','SC','2004-01-16','2022-04-08','B.Tech','AIDS','English','2022','2026'),(18,'REG1017','ADM2017','UMIS3017','Karthik Gowda','Karthik Verma','Indian','Hindu','OC','2004-01-14','2023-07-16','B.Tech','IT','English','2023','2027'),(19,'REG1018','ADM2018','UMIS3018','Vignesh Singh','Rahul Iyer','Indian','Christian','BC','2003-07-04','2023-12-11','BE','ECE','English','2023','2027'),(20,'REG1019','ADM2019','UMIS3019','Karthik Nair','Harish Das','Indian','Hindu','BC','2005-12-10','2023-02-09','B.Tech','AIML','English','2023','2027'),(21,'REG1020','ADM2020','UMIS3020','Vignesh Das','Suresh Verma','Indian','Muslim','SC','2005-05-31','2023-11-16','BE','ECE','English','2023','2027'),(22,'REG1021','ADM2021','UMIS3021','Vignesh Nair','Amit Reddy','Indian','Christian','ST','2005-12-14','2023-11-22','BE','CSE (CYBER SECURITY)','English','2023','2027'),(23,'REG1022','ADM2022','UMIS3022','Manoj Kumar','Vignesh Reddy','Indian','Christian','OC','2003-08-30','2022-10-11','B.Tech','AIDS','English','2022','2026'),(24,'REG1023','ADM2023','UMIS3023','Harish Sharma','Vikram Reddy','Indian','Muslim','OC','2003-09-27','2023-05-29','B.Tech','IT','English','2023','2027'),(25,'REG1024','ADM2024','UMIS3024','Vikram Sharma','Amit Das','Indian','Muslim','SC','2003-02-28','2023-02-22','BE','CSE','English','2023','2027'),(26,'REG1025','ADM2025','UMIS3025','Harish Singh','Rahul Iyer','Indian','Muslim','BC','2005-09-25','2022-12-08','BE','ECE','English','2022','2026'),(27,'REG1026','ADM2026','UMIS3026','Karthik Das','Vignesh Kumar','Indian','Hindu','MBC','2005-08-05','2022-01-08','B.Tech','AIML','English','2022','2026'),(28,'REG1027','ADM2027','UMIS3027','Manoj Gowda','Suresh Kumar','Indian','Muslim','ST','2003-03-22','2023-05-15','B.Tech','IT','English','2023','2027'),(29,'REG1028','ADM2028','UMIS3028','Rahul Iyer','Suresh Iyer','Indian','Christian','OC','2004-11-30','2022-12-14','B.Tech','IT','English','2022','2026'),(30,'REG1029','ADM2029','UMIS3029','Amit Gowda','Suresh Nair','Indian','Christian','BC','2002-04-04','2023-04-18','BE','CSE (CYBER SECURITY)','English','2023','2027'),(31,'REG1030','ADM2030','UMIS3030','Harish Nair','Amit Verma','Indian','Christian','OC','2004-04-22','2023-05-26','B.Tech','AIDS','English','2023','2027'),(32,'REG1031','ADM2031','UMIS3031','Arjun Kumar','Karthik Sharma','Indian','Muslim','ST','2004-08-29','2022-09-20','B.Tech','AIDS','English','2022','2026'),(33,'REG1032','ADM2032','UMIS3032','Rohit Singh','Rohit Patel','Indian','Christian','SC','2002-05-04','2023-10-16','BE','ECE','English','2023','2027'),(34,'REG1033','ADM2033','UMIS3033','Arjun Sharma','Vignesh Gowda','Indian','Christian','ST','2004-12-12','2023-10-31','B.Tech','AIDS','English','2023','2027'),(35,'REG1034','ADM2034','UMIS3034','Vikram Nair','Rohit Sharma','Indian','Muslim','BC','2004-04-05','2022-12-23','B.Tech','AIML','English','2022','2026'),(36,'REG1035','ADM2035','UMIS3035','Rohit Gowda','Rohit Verma','Indian','Muslim','ST','2002-05-07','2023-05-15','BE','ECE','English','2023','2027'),(37,'REG1036','ADM2036','UMIS3036','Arjun Singh','Harish Patel','Indian','Christian','SC','2002-01-27','2023-03-02','BE','CSE','English','2023','2027'),(38,'REG1037','ADM2037','UMIS3037','Manoj Patel','Karthik Iyer','Indian','Hindu','ST','2003-10-18','2023-11-27','BE','CSE (CYBER SECURITY)','English','2023','2027'),(39,'REG1038','ADM2038','UMIS3038','Arjun Kumar','Arjun Das','Indian','Muslim','BC','2002-01-04','2023-03-29','BE','ECE','English','2023','2027'),(40,'REG1039','ADM2039','UMIS3039','Harish Iyer','Vignesh Nair','Indian','Christian','BC','2004-03-08','2022-06-03','BE','ECE','English','2022','2026'),(41,'REG1040','ADM2040','UMIS3040','Harish Nair','Vignesh Singh','Indian','Muslim','BC','2003-07-19','2023-10-13','BE','ECE','English','2023','2027'),(42,'REG1041','ADM2041','UMIS3041','Suresh Das','Manoj Sharma','Indian','Hindu','SC','2004-05-22','2022-12-30','B.Tech','AIDS','English','2022','2026'),(43,'REG1042','ADM2042','UMIS3042','Vignesh Reddy','Arjun Nair','Indian','Christian','BC','2002-02-19','2023-04-25','BE','ECE','English','2023','2027'),(44,'REG1043','ADM2043','UMIS3043','Harish Reddy','Vikram Patel','Indian','Hindu','SC','2002-04-04','2023-03-27','BE','CSE','English','2023','2027'),(45,'REG1044','ADM2044','UMIS3044','Manoj Kumar','Rahul Kumar','Indian','Christian','BC','2004-02-04','2023-06-02','BE','CSE (CYBER SECURITY)','English','2023','2027'),(46,'REG1045','ADM2045','UMIS3045','Suresh Sharma','Arjun Reddy','Indian','Christian','SC','2005-07-01','2022-04-22','B.Tech','IT','English','2022','2026'),(47,'REG1046','ADM2046','UMIS3046','Karthik Reddy','Rahul Das','Indian','Hindu','OC','2002-05-14','2022-03-08','BE','CSE (CYBER SECURITY)','English','2022','2026'),(48,'REG1047','ADM2047','UMIS3047','Rohit Reddy','Manoj Sharma','Indian','Muslim','MBC','2005-09-15','2022-03-13','BE','ECE','English','2022','2026'),(49,'REG1048','ADM2048','UMIS3048','Rahul Das','Vignesh Nair','Indian','Christian','BC','2004-11-23','2023-10-19','BE','CSE (CYBER SECURITY)','English','2023','2027'),(50,'REG1049','ADM2049','UMIS3049','Rohit Reddy','Amit Reddy','Indian','Hindu','SC','2005-12-03','2022-11-26','B.Tech','AIML','English','2022','2026'),(51,'REG2000','ADM3000','UMIS4000','Nisha Das','Harish Verma','Indian','Muslim','MBC','2004-12-19','2022-12-02','B.Tech','AIML','English','2022','2026'),(52,'REG2001','ADM3001','UMIS4001','Aishwarya Nair','Vikram Nair','Indian','Hindu','BC','2004-12-13','2023-07-18','B.Tech','AIDS','English','2023','2027'),(53,'REG2002','ADM3002','UMIS4002','Ananya Singh','Arjun Iyer','Indian','Hindu','SC','2002-10-06','2022-08-26','B.Tech','IT','English','2022','2026'),(54,'REG2003','ADM3003','UMIS4003','Pooja Patel','Vikram Singh','Indian','Muslim','OC','2003-01-24','2022-10-12','B.Tech','AIML','English','2022','2026'),(55,'REG2004','ADM3004','UMIS4004','Kavya Singh','Harish Singh','Indian','Hindu','OC','2002-03-08','2023-04-07','BE','ECE','English','2023','2027'),(56,'REG2005','ADM3005','UMIS4005','Kavya Das','Amit Nair','Indian','Hindu','ST','2002-07-13','2022-06-23','B.Tech','AIDS','English','2022','2026'),(57,'REG2006','ADM3006','UMIS4006','Pooja Sharma','Arjun Singh','Indian','Muslim','OC','2003-02-08','2022-06-22','BE','ECE','English','2022','2026'),(58,'REG2007','ADM3007','UMIS4007','Ananya Nair','Suresh Nair','Indian','Muslim','SC','2004-01-04','2022-05-19','BE','CSE (CYBER SECURITY)','English','2022','2026'),(59,'REG2008','ADM3008','UMIS4008','Nisha Gowda','Harish Sharma','Indian','Hindu','SC','2005-11-30','2023-02-22','BE','CSE','English','2023','2027'),(60,'REG2009','ADM3009','UMIS4009','Nisha Iyer','Vikram Kumar','Indian','Hindu','BC','2005-03-17','2022-01-12','B.Tech','AIDS','English','2022','2026'),(61,'REG2010','ADM3010','UMIS4010','Meena Reddy','Suresh Kumar','Indian','Christian','ST','2003-06-05','2022-05-27','B.Tech','AIML','English','2022','2026'),(62,'REG2011','ADM3011','UMIS4011','Aishwarya Sharma','Vikram Patel','Indian','Muslim','MBC','2002-02-22','2023-10-19','B.Tech','IT','English','2023','2027'),(63,'REG2012','ADM3012','UMIS4012','Ananya Kumar','Vikram Gowda','Indian','Hindu','SC','2004-05-26','2023-08-13','B.Tech','AIML','English','2023','2027'),(64,'REG2013','ADM3013','UMIS4013','Nisha Sharma','Amit Kumar','Indian','Hindu','ST','2003-08-14','2023-10-25','BE','CSE','English','2023','2027'),(65,'REG2014','ADM3014','UMIS4014','Swathi Reddy','Arjun Das','Indian','Christian','ST','2005-01-18','2023-02-20','B.Tech','IT','English','2023','2027'),(66,'REG2015','ADM3015','UMIS4015','Ananya Patel','Karthik Das','Indian','Hindu','BC','2003-01-09','2022-04-29','BE','ECE','English','2022','2026'),(67,'REG2016','ADM3016','UMIS4016','Kavya Reddy','Amit Nair','Indian','Muslim','ST','2005-05-08','2022-03-26','BE','CSE','English','2022','2026'),(68,'REG2017','ADM3017','UMIS4017','Divya Sharma','Karthik Sharma','Indian','Hindu','BC','2004-09-20','2023-01-07','B.Tech','IT','English','2023','2027'),(69,'REG2018','ADM3018','UMIS4018','Pooja Reddy','Rahul Verma','Indian','Christian','BC','2004-10-03','2023-11-17','B.Tech','IT','English','2023','2027'),(70,'REG2019','ADM3019','UMIS4019','Swathi Reddy','Rohit Kumar','Indian','Muslim','BC','2004-05-26','2022-08-23','B.Tech','IT','English','2022','2026'),(71,'REG2020','ADM3020','UMIS4020','Pooja Nair','Arjun Iyer','Indian','Christian','OC','2004-08-30','2022-08-30','BE','CSE','English','2022','2026'),(72,'REG2021','ADM3021','UMIS4021','Ananya Kumar','Amit Gowda','Indian','Muslim','SC','2004-09-28','2022-12-02','BE','CSE (CYBER SECURITY)','English','2022','2026'),(73,'REG2022','ADM3022','UMIS4022','Aishwarya Patel','Karthik Reddy','Indian','Christian','BC','2003-11-08','2023-10-17','BE','CSE (CYBER SECURITY)','English','2023','2027'),(74,'REG2023','ADM3023','UMIS4023','Pooja Gowda','Suresh Gowda','Indian','Muslim','BC','2005-07-15','2022-10-11','BE','CSE (CYBER SECURITY)','English','2022','2026'),(75,'REG2024','ADM3024','UMIS4024','Pooja Iyer','Suresh Iyer','Indian','Muslim','BC','2002-06-24','2023-05-25','BE','CSE','English','2023','2027'),(76,'REG2025','ADM3025','UMIS4025','Pooja Singh','Karthik Sharma','Indian','Hindu','MBC','2005-09-08','2023-06-28','BE','CSE (CYBER SECURITY)','English','2023','2027'),(77,'REG2026','ADM3026','UMIS4026','Priya Das','Arjun Singh','Indian','Christian','SC','2002-09-18','2022-10-05','B.Tech','AIDS','English','2022','2026'),(78,'REG2027','ADM3027','UMIS4027','Swathi Verma','Vikram Singh','Indian','Muslim','OC','2002-01-15','2023-08-25','B.Tech','AIDS','English','2023','2027'),(79,'REG2028','ADM3028','UMIS4028','Aishwarya Das','Rahul Verma','Indian','Hindu','MBC','2004-08-27','2022-12-29','BE','CSE','English','2022','2026'),(80,'REG2029','ADM3029','UMIS4029','Ananya Iyer','Vignesh Gowda','Indian','Muslim','MBC','2002-04-05','2023-01-18','BE','CSE','English','2023','2027'),(81,'REG2030','ADM3030','UMIS4030','Sneha Verma','Amit Nair','Indian','Hindu','MBC','2003-09-13','2023-08-30','B.Tech','AIDS','English','2023','2027'),(82,'REG2031','ADM3031','UMIS4031','Pooja Das','Vikram Das','Indian','Christian','SC','2003-09-26','2022-08-19','B.Tech','AIDS','English','2022','2026'),(83,'REG2032','ADM3032','UMIS4032','Divya Patel','Suresh Das','Indian','Hindu','MBC','2002-11-08','2023-06-14','BE','CSE','English','2023','2027'),(84,'REG2033','ADM3033','UMIS4033','Sneha Sharma','Harish Nair','Indian','Muslim','BC','2004-10-29','2022-04-09','B.Tech','AIDS','English','2022','2026'),(85,'REG2034','ADM3034','UMIS4034','Swathi Sharma','Rahul Sharma','Indian','Christian','BC','2004-09-17','2022-03-14','B.Tech','AIML','English','2022','2026'),(86,'REG2035','ADM3035','UMIS4035','Sneha Kumar','Vikram Patel','Indian','Christian','SC','2004-02-01','2022-04-01','B.Tech','AIML','English','2022','2026'),(87,'REG2036','ADM3036','UMIS4036','Meena Kumar','Suresh Patel','Indian','Hindu','SC','2002-10-15','2023-12-09','BE','CSE','English','2023','2027'),(88,'REG2037','ADM3037','UMIS4037','Kavya Kumar','Amit Gowda','Indian','Hindu','BC','2003-07-08','2023-09-09','B.Tech','AIDS','English','2023','2027'),(89,'REG2038','ADM3038','UMIS4038','Kavya Nair','Harish Verma','Indian','Muslim','OC','2005-12-18','2022-10-19','B.Tech','AIDS','English','2022','2026'),(90,'REG2039','ADM3039','UMIS4039','Sneha Nair','Arjun Patel','Indian','Christian','MBC','2005-10-08','2023-10-23','BE','CSE (CYBER SECURITY)','English','2023','2027'),(91,'REG2040','ADM3040','UMIS4040','Sneha Singh','Vikram Iyer','Indian','Hindu','OC','2005-04-20','2022-09-14','B.Tech','AIML','English','2022','2026'),(92,'REG2041','ADM3041','UMIS4041','Priya Singh','Vikram Sharma','Indian','Hindu','BC','2004-04-28','2022-01-07','BE','ECE','English','2022','2026'),(93,'REG2042','ADM3042','UMIS4042','Meena Das','Rahul Kumar','Indian','Muslim','MBC','2005-05-21','2022-09-21','BE','ECE','English','2022','2026'),(94,'REG2043','ADM3043','UMIS4043','Divya Nair','Vignesh Iyer','Indian','Muslim','BC','2005-03-15','2022-11-30','B.Tech','IT','English','2022','2026'),(95,'REG2044','ADM3044','UMIS4044','Ananya Sharma','Rahul Nair','Indian','Hindu','MBC','2004-05-02','2022-12-18','BE','ECE','English','2022','2026'),(96,'REG2045','ADM3045','UMIS4045','Pooja Patel','Vignesh Iyer','Indian','Hindu','OC','2002-08-28','2023-08-10','BE','CSE (CYBER SECURITY)','English','2023','2027'),(97,'REG2046','ADM3046','UMIS4046','Pooja Sharma','Manoj Patel','Indian','Christian','MBC','2004-12-29','2023-09-28','BE','CSE (CYBER SECURITY)','English','2023','2027'),(98,'REG2047','ADM3047','UMIS4047','Sneha Gowda','Suresh Kumar','Indian','Muslim','ST','2005-08-03','2022-03-13','BE','CSE (CYBER SECURITY)','English','2022','2026'),(99,'REG2048','ADM3048','UMIS4048','Sneha Reddy','Amit Reddy','Indian','Muslim','MBC','2003-09-08','2023-05-13','BE','CSE (CYBER SECURITY)','English','2023','2027'),(100,'REG2049','ADM3049','UMIS4049','Aishwarya Gowda','Vikram Verma','Indian','Christian','BC','2004-08-31','2022-01-05','BE','CSE (CYBER SECURITY)','English','2022','2026'),(101,'21CS101','A123','U456','John Doe','Father Name','Indian','Hindu','General','2003-01-01','2021-08-15','B.Tech','Computer Science','English','2021','2025');
/*!40000 ALTER TABLE `students` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `role` enum('Admin','Office','Principal') NOT NULL,
  `password` varchar(255) NOT NULL,
  `username` varchar(100) NOT NULL,
  `onboarding` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'System Admin','admin@ace.edu','Admin','admin123','admin',1),(2,'Office Staff','office@ace.edu','Office','123456','office',0),(3,'Principal','principal@ace.edu','Principal','12345678','principal',0);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping events for database 'ace_tc'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-04-07 15:53:56
