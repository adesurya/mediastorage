-- MySQL dump 10.13  Distrib 8.0.30, for Win64 (x86_64)
--
-- Host: localhost    Database: media_storage_db
-- ------------------------------------------------------
-- Server version	8.0.30

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `ai_influencers`
--

DROP TABLE IF EXISTS `ai_influencers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ai_influencers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `name` varchar(255) NOT NULL,
  `original_prompt` text NOT NULL,
  `optimized_prompt` text,
  `task_id` varchar(255) DEFAULT NULL,
  `status` enum('pending','optimizing','generating','completed','failed') DEFAULT 'pending',
  `image_url` varchar(500) DEFAULT NULL,
  `local_image_path` varchar(500) DEFAULT NULL,
  `error_message` text,
  `cost_time` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `expires_at` timestamp NOT NULL,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_created` (`user_id`,`created_at` DESC),
  KEY `idx_task_id` (`task_id`),
  KEY `idx_status` (`status`),
  KEY `idx_expires` (`expires_at`),
  KEY `idx_user_status` (`user_id`,`status`),
  CONSTRAINT `ai_influencers_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ai_influencers`
--

LOCK TABLES `ai_influencers` WRITE;
/*!40000 ALTER TABLE `ai_influencers` DISABLE KEYS */;
INSERT INTO `ai_influencers` VALUES (1,1,'Sarah','\"A hyper-realistic, close-up portrait of a woman in her 20s with an oval face, straight hair, fair skin, and slit eyes. She is wearing glasses. The image captures a soft, low-key lighting effect, emphasizing her youthful and intelligent aura. Shot using a Leica M10-R with a 50mm f/1.4 lens, the image evokes a classic black and white Ilford HP5 Plus film aesthetic.\"',NULL,'d1871c1d69f0e91267bdfeaea8dc5c41','completed','https://i.ibb.co/9mnwGCCg/sijagoai-sarah-1-jpg.png','/uploads/ai-influencers/sijagoai_sarah_1.jpg',NULL,8,'2025-12-27 06:08:53','2025-12-28 06:08:53','2025-12-27 06:13:49');
/*!40000 ALTER TABLE `ai_influencers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `categories`
--

DROP TABLE IF EXISTS `categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `categories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `description` text,
  `user_id` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_category_per_user` (`name`,`user_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `categories_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categories`
--

LOCK TABLES `categories` WRITE;
/*!40000 ALTER TABLE `categories` DISABLE KEYS */;
INSERT INTO `categories` VALUES (1,'HDA Go - Bale Puri',NULL,1,'2025-10-03 10:52:20','2025-10-03 10:54:52');
/*!40000 ALTER TABLE `categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `idea_chats`
--

DROP TABLE IF EXISTS `idea_chats`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `idea_chats` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `title` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_created` (`user_id`,`created_at` DESC),
  CONSTRAINT `idea_chats_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `idea_chats`
--

LOCK TABLES `idea_chats` WRITE;
/*!40000 ALTER TABLE `idea_chats` DISABLE KEYS */;
/*!40000 ALTER TABLE `idea_chats` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `idea_messages`
--

DROP TABLE IF EXISTS `idea_messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `idea_messages` (
  `id` int NOT NULL AUTO_INCREMENT,
  `chat_id` int NOT NULL,
  `role` enum('user','assistant') NOT NULL,
  `content` text NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_chat_created` (`chat_id`,`created_at`),
  CONSTRAINT `idea_messages_ibfk_1` FOREIGN KEY (`chat_id`) REFERENCES `idea_chats` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `idea_messages`
--

LOCK TABLES `idea_messages` WRITE;
/*!40000 ALTER TABLE `idea_messages` DISABLE KEYS */;
/*!40000 ALTER TABLE `idea_messages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `image_upscales`
--

DROP TABLE IF EXISTS `image_upscales`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `image_upscales` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `original_image_url` varchar(500) NOT NULL COMMENT 'URL gambar original dari IMGBB',
  `local_image_path` varchar(500) DEFAULT NULL COMMENT 'Path lokal gambar original',
  `task_id` varchar(255) DEFAULT NULL COMMENT 'Task ID dari API kie.ai',
  `status` enum('pending','generating','completed','failed') DEFAULT 'pending',
  `result_image_url` varchar(500) DEFAULT NULL COMMENT 'URL hasil dari IMGBB',
  `local_result_path` varchar(500) DEFAULT NULL COMMENT 'Path lokal hasil upscale',
  `error_message` text,
  `cost_time` int DEFAULT NULL COMMENT 'Waktu pemrosesan dalam detik',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `expires_at` timestamp NOT NULL COMMENT 'Waktu kadaluarsa (24 jam dari created_at)',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_created` (`user_id`,`created_at` DESC),
  KEY `idx_task_id` (`task_id`),
  KEY `idx_status` (`status`),
  KEY `idx_expires` (`expires_at`),
  KEY `idx_user_status` (`user_id`,`status`),
  KEY `idx_user_status_created` (`user_id`,`status`,`created_at` DESC),
  CONSTRAINT `image_upscales_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `image_upscales`
--

LOCK TABLES `image_upscales` WRITE;
/*!40000 ALTER TABLE `image_upscales` DISABLE KEYS */;
INSERT INTO `image_upscales` VALUES (1,1,'https://i.ibb.co/nNyRCrLg/1-image1-1766900805872-jpg.webp','/uploads/image-upscale/1/original_1766912452305.webp','44053e2cd5cadab9a99b757fe26b4755','completed','https://i.ibb.co/W4Hc9wCj/sijagoai-upscale-1766912701380-png.webp','/uploads/image-upscale/1/sijagoai_upscale_1766912701380.png',NULL,8,'2025-12-28 09:00:52','2025-12-29 09:00:52','2025-12-28 09:05:08');
/*!40000 ALTER TABLE `image_upscales` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `media`
--

DROP TABLE IF EXISTS `media`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `media` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `category_id` int DEFAULT NULL,
  `filename` varchar(255) NOT NULL,
  `original_name` varchar(255) NOT NULL,
  `file_path` varchar(500) NOT NULL,
  `file_size` bigint NOT NULL,
  `mime_type` varchar(100) NOT NULL,
  `public_url` varchar(500) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `category_id` (`category_id`),
  CONSTRAINT `media_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `media_ibfk_2` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL,
  CONSTRAINT `media_ibfk_3` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL,
  CONSTRAINT `media_ibfk_4` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL,
  CONSTRAINT `media_ibfk_5` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL,
  CONSTRAINT `media_ibfk_6` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL,
  CONSTRAINT `media_ibfk_7` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL,
  CONSTRAINT `media_ibfk_8` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `media`
--

LOCK TABLES `media` WRITE;
/*!40000 ALTER TABLE `media` DISABLE KEYS */;
/*!40000 ALTER TABLE `media` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `personas`
--

DROP TABLE IF EXISTS `personas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `personas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `prompt` text NOT NULL,
  `optimized_prompt` text,
  `request_id` varchar(255) NOT NULL,
  `status` enum('processing','completed','failed') DEFAULT 'processing',
  `image_url` varchar(500) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_created` (`user_id`,`created_at` DESC),
  KEY `idx_request_id` (`request_id`),
  CONSTRAINT `personas_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `personas`
--

LOCK TABLES `personas` WRITE;
/*!40000 ALTER TABLE `personas` DISABLE KEYS */;
INSERT INTO `personas` VALUES (1,1,'A 30-year-old Indigenous Indonesian woman with shoulder-length white hair, wearing traditional attire, standing in a lush green landscape, smiling warmly.','A 30-year-old Indigenous Indonesian woman with shoulder-length white hair, wearing traditional attire, standing in a lush green landscape, smiling warmly.','781166f6-825c-42ab-a568-abb04450c7c4','completed','/uploads/personas/persona_781166f6-825c-42ab-a568-abb04450c7c4_1763182543053.png','2025-11-15 04:55:30','2025-11-15 04:55:43'),(2,1,'A beautiful Japanese girl with fair skin, shoulder-length hair, and a sensual face.','A beautiful Japanese girl with fair skin, shoulder-length hair, and a sensual face.','44fe2939-5caa-4887-a650-343830d9502d','completed','/uploads/personas/persona_44fe2939-5caa-4887-a650-343830d9502d_1763216850082.png','2025-11-15 14:27:03','2025-11-15 14:27:30'),(3,1,'A beautiful Japanese girl with fair skin, shoulder-length hair, and a sensual face.','A beautiful Japanese girl with fair skin, shoulder-length hair, and a sensual face.','acb88fef-6479-407b-a8cb-d8ee61a9e4a8','completed','/uploads/personas/persona_acb88fef-6479-407b-a8cb-d8ee61a9e4a8_1763216880755.png','2025-11-15 14:27:03','2025-11-15 14:28:00'),(4,1,'Create an image of an exotic woman with long, flowing blonde hair. She has striking green eyes and a warm, sun-kissed complexion. She is wearing a vibrant, intricate dress that reflects a blend of cultural styles, adorned with colorful patterns. The background features a lush tropical landscape with palm trees and a clear blue sky, enhancing the exotic ambiance. The lighting is soft and golden, giving the scene a dreamy, enchanting quality.','Create an image of an exotic woman with long, flowing blonde hair. She has striking green eyes and a warm, sun-kissed complexion. She is wearing a vibrant, intricate dress that reflects a blend of cultural styles, adorned with colorful patterns. The background features a lush tropical landscape with palm trees and a clear blue sky, enhancing the exotic ambiance. The lighting is soft and golden, giving the scene a dreamy, enchanting quality.','717019f7-9aad-4921-aee0-70c5defd5756','completed','/uploads/personas/persona_717019f7-9aad-4921-aee0-70c5defd5756_1763302253781.png','2025-11-16 14:08:50','2025-11-16 14:10:53'),(5,1,'Create an image of an exotic woman with long, flowing blonde hair. She has striking green eyes and a warm, sun-kissed complexion. She is wearing a vibrant, intricate dress that reflects a blend of cultural styles, adorned with colorful patterns. The background features a lush tropical landscape with palm trees and a clear blue sky, enhancing the exotic ambiance. The lighting is soft and golden, giving the scene a dreamy, enchanting quality.','Create an image of an exotic woman with long, flowing blonde hair. She has striking green eyes and a warm, sun-kissed complexion. She is wearing a vibrant, intricate dress that reflects a blend of cultural styles, adorned with colorful patterns. The background features a lush tropical landscape with palm trees and a clear blue sky, enhancing the exotic ambiance. The lighting is soft and golden, giving the scene a dreamy, enchanting quality.','b3f85293-26e5-40ad-b485-663a19ecd958','completed','/uploads/personas/persona_b3f85293-26e5-40ad-b485-663a19ecd958_1763302159800.png','2025-11-16 14:08:50','2025-11-16 14:09:19'),(6,1,'A young Chinese female doctor in her 20s, with fair skin and a beautiful face, wearing a white lab coat, standing in a modern clinic setting, smiling confidently, with medical equipment in the background.','A young Chinese female doctor in her 20s, with fair skin and a beautiful face, wearing a white lab coat, standing in a modern clinic setting, smiling confidently, with medical equipment in the background.','0c6b40f8-d204-46a5-bedc-9b8a13a600ad','completed','/uploads/personas/persona_0c6b40f8-d204-46a5-bedc-9b8a13a600ad_1763302848922.png','2025-11-16 14:20:31','2025-11-16 14:20:48'),(7,1,'A young Chinese female doctor in her 20s, with fair skin and a beautiful face, wearing a white lab coat, standing in a modern clinic setting, smiling confidently, with medical equipment in the background.','A young Chinese female doctor in her 20s, with fair skin and a beautiful face, wearing a white lab coat, standing in a modern clinic setting, smiling confidently, with medical equipment in the background.','0aa4ba9a-e930-42c6-abf6-5c4af4d923c6','completed','/uploads/personas/persona_0aa4ba9a-e930-42c6-abf6-5c4af4d923c6_1763302912152.png','2025-11-16 14:20:31','2025-11-16 14:21:52');
/*!40000 ALTER TABLE `personas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `photo_products`
--

DROP TABLE IF EXISTS `photo_products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `photo_products` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `product_name` varchar(255) NOT NULL,
  `original_prompt` text NOT NULL,
  `optimized_prompt` text,
  `image1_url` varchar(500) NOT NULL,
  `image2_url` varchar(500) DEFAULT NULL,
  `local_image1_path` varchar(500) DEFAULT NULL,
  `local_image2_path` varchar(500) DEFAULT NULL,
  `task_id` varchar(255) DEFAULT NULL,
  `status` enum('pending','optimizing','generating','completed','failed') DEFAULT 'pending',
  `result_image_url` varchar(500) DEFAULT NULL,
  `local_result_path` varchar(500) DEFAULT NULL,
  `error_message` text,
  `cost_time` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `expires_at` timestamp NOT NULL,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_created` (`user_id`,`created_at` DESC),
  KEY `idx_task_id` (`task_id`),
  KEY `idx_status` (`status`),
  KEY `idx_expires` (`expires_at`),
  KEY `idx_user_status` (`user_id`,`status`),
  CONSTRAINT `photo_products_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `photo_products`
--

LOCK TABLES `photo_products` WRITE;
/*!40000 ALTER TABLE `photo_products` DISABLE KEYS */;
INSERT INTO `photo_products` VALUES (1,1,'Laborie','\"Photograph from a 45-degree angle of a woman from Image 2 holding the Laborie Derma product from Image 1. Her fingers should have a natural, relaxed grip around the product, positioned at chest level. Use a soft, diffused studio lighting setup to illuminate the product, creating a shallow depth of field with the product in sharp focus. Background should be a clean, neutral tone to highlight the product, ensuring a professional and commercial aesthetic. Apply professional color grading for a high-end finish.\"',NULL,'https://i.ibb.co/5g8RjDLd/1766811627282-Whats-App-Image-2025-12-24-at-12-18-03-jpeg.jpg','https://i.ibb.co/pjQ4Js4n/1-image2-1766817968130-jpg.png','/uploads/photo-products/1/image1_1766817965258.jpg','/uploads/photo-products/1/image2_1766817968130.jpg','9d4ede881f07b242666a5becc582cf1d','completed','https://i.ibb.co/tM0VpVhM/sijagoai-laborie-result-jpg.jpg','/uploads/photo-products/1/sijagoai_laborie_result.jpg',NULL,8,'2025-12-27 06:46:05','2025-12-28 06:46:05','2025-12-27 06:49:29'),(2,1,'Moncus','\"Capture a medium shot of a woman from Image 1 holding the Laborie product from Image 2. Her hands should be in a relaxed yet firm grip, positioned towards the camera at waist level. Use a three-point lighting setup for balanced illumination, enhancing product\'s detail. Maintain a shallow depth of field with the product in sharp focus. Use a clean, minimalistic background to accentuate the product. Adopt a professional, commercial aesthetic with high-end color grading.\"',NULL,'https://i.ibb.co/N2QnM6Ch/2-image1-1766930802036-jpg.jpg','https://i.ibb.co/jvMD7D6t/2-image2-1766930804746-jpg.jpg','/uploads/photo-products/2/image1_1766930802036.jpg','/uploads/photo-products/2/image2_1766930804746.jpg','ab391c73cc32f267cf98f6794729d3fe','generating',NULL,NULL,NULL,NULL,'2025-12-28 14:06:41','2025-12-29 14:06:42','2025-12-28 14:06:46');
/*!40000 ALTER TABLE `photo_products` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `photo_studios`
--

DROP TABLE IF EXISTS `photo_studios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `photo_studios` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `style_name` varchar(100) NOT NULL COMMENT 'Nama style yang dipilih user',
  `style_image_path` varchar(500) NOT NULL COMMENT 'Path ke file style di server',
  `product_image_url` varchar(500) NOT NULL COMMENT 'URL produk yang diupload user',
  `local_product_path` varchar(500) DEFAULT NULL COMMENT 'Path lokal product image',
  `task_id` varchar(255) DEFAULT NULL COMMENT 'Task ID dari API kie.ai',
  `status` enum('pending','generating','completed','failed') DEFAULT 'pending',
  `result_image_url` varchar(500) DEFAULT NULL COMMENT 'URL hasil dari IMGBB',
  `local_result_path` varchar(500) DEFAULT NULL COMMENT 'Path lokal hasil generation',
  `original_api_url` varchar(500) DEFAULT NULL COMMENT 'URL original dari API sebelum upload ke IMGBB',
  `error_message` text,
  `cost_time` int DEFAULT NULL COMMENT 'Waktu pemrosesan dalam detik',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `expires_at` timestamp NOT NULL COMMENT 'Waktu kadaluarsa (24 jam dari created_at)',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_created` (`user_id`,`created_at` DESC),
  KEY `idx_task_id` (`task_id`),
  KEY `idx_status` (`status`),
  KEY `idx_expires` (`expires_at`),
  KEY `idx_user_status` (`user_id`,`status`),
  KEY `idx_user_status_created` (`user_id`,`status`,`created_at` DESC),
  CONSTRAINT `photo_studios_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `photo_studios`
--

LOCK TABLES `photo_studios` WRITE;
/*!40000 ALTER TABLE `photo_studios` DISABLE KEYS */;
INSERT INTO `photo_studios` VALUES (1,1,'Electronic-Concrete-Tech','/styles/photo-studio/Electronic-Concrete-Tech.png','https://i.ibb.co/nNyRCrLg/1-image1-1766900805872-jpg.webp','/uploads/photo-studio/1/image1_1766901139996.jpg',NULL,'generating',NULL,NULL,NULL,NULL,NULL,'2025-12-28 05:52:19','2025-12-29 05:52:20','2025-12-28 05:52:27'),(2,1,'Electronic-LED-Glow','/styles/photo-studio/Electronic-LED-Glow.png','https://i.ibb.co/nNyRCrLg/1-image1-1766900805872-jpg.webp','/uploads/photo-studio/2/image1_1766901385253.jpg',NULL,'failed',NULL,NULL,NULL,'Unknown API error',NULL,'2025-12-28 05:56:25','2025-12-29 05:56:25','2025-12-28 05:56:32'),(3,1,'Electronic-Geometric-Grid','/styles/photo-studio/Electronic-Geometric-Grid.png','https://i.ibb.co/HDr8mNfW/3-image1-1766903598419-jpg.jpg','/uploads/photo-studio/3/image1_1766903598419.jpg',NULL,'failed',NULL,NULL,NULL,'You do not have access permissions',NULL,'2025-12-28 06:33:18','2025-12-29 06:33:18','2025-12-28 06:33:23'),(4,1,'Electronic-Geometric-Grid','/styles/photo-studio/Electronic-Geometric-Grid.png','https://i.ibb.co/HDr8mNfW/3-image1-1766903598419-jpg.jpg','/uploads/photo-studio/4/image1_1766903968439.jpg','9c94f03378d94e5e2aaa525cd9476a68','completed','https://i.ibb.co/5gZF0h51/sijagoai-electronic-geometric-grid-result-png.png','/uploads/photo-studio/4/sijagoai_electronic_geometric_grid_result.png',NULL,NULL,8,'2025-12-28 06:39:28','2025-12-29 06:39:28','2025-12-28 06:45:44');
/*!40000 ALTER TABLE `photo_studios` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product_ideas`
--

DROP TABLE IF EXISTS `product_ideas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_ideas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `product_name` varchar(255) NOT NULL,
  `product_description` text NOT NULL,
  `product_url` varchar(500) DEFAULT NULL,
  `product_image` longtext,
  `ide_konten` text,
  `highlight_points` text,
  `hook` text,
  `value` text,
  `cta` text,
  `status` enum('processing','completed','failed') DEFAULT 'processing',
  `error_message` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_created` (`user_id`,`created_at` DESC),
  CONSTRAINT `product_ideas_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_ideas`
--

LOCK TABLES `product_ideas` WRITE;
/*!40000 ALTER TABLE `product_ideas` DISABLE KEYS */;
INSERT INTO `product_ideas` VALUES (1,1,'Iqoo 15','Flagship Handphone\nGaming Handphone\nChipset Snapdragon 8 Gen Elite\nPersicope Camera','https://www.iqoo.com/id/products/iqoo-15',NULL,'\"Bertransformasi menjadi seorang Gamer Menakjubkan dengan Iqoo 15 - Ponsel Gaming dengan Performa Terkuat!\"','[\"\\\"Iqoo 15, ponsel flagship dengan performa gaming terbaik.\\\"\",\"\\\"Ditenagai oleh Chipset Snapdragon 8 Gen Elite.\\\"\",\"\\\"Persembahan kamera persicope kualitas premium.\\\"\",\"\\\"Lebih cepat, lebih kuat, dan lebih menakjubkan.\\\"\",\"\\\"Permainan tanpa gangguan, memaksimalkan pengalaman gaming Anda.\\\"\"]','\"Jadilah raja game dengan Iqoo 15, ponsel gaming terhebat yang dirancang khusus untuk Anda!\"','\"Mainkan game sepuasnya dengan chipset Snapdragon 8 Gen Elite dari Iqoo 15. Dengan kinerja luar biasa cepat dan kuat, bebas lag dan gangguan! Kamera persicope-nya akan ubah cara Anda mengabadikan momen. Lebih dari sekedar ponsel, Iqoo 15 adalah teman gaming Anda yang tak tergantikan. Dapatkan keunggulan dalam setiap pertempuran dan jadilah pemain terbaik!\"','\"Tunggu apa lagi? Tingkatkan permainan Anda bersama Iqoo 15! Kunjungi https://www.iqoo.com/id/products/iqoo-15 dan rasakan performa gaming yang tak tertandingi. Jadilah bagian dari revolusi gaming hari ini!\"','completed',NULL,'2025-12-26 16:32:26','2025-12-26 16:32:40');
/*!40000 ALTER TABLE `product_ideas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product_promotions`
--

DROP TABLE IF EXISTS `product_promotions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_promotions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `prompt` text NOT NULL,
  `optimized_prompt` text,
  `image_urls` text NOT NULL,
  `request_id` varchar(255) NOT NULL,
  `status` enum('processing','completed','failed') DEFAULT 'processing',
  `result_image_url` varchar(500) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_created` (`user_id`,`created_at` DESC),
  KEY `idx_request_id` (`request_id`),
  CONSTRAINT `product_promotions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_promotions`
--

LOCK TABLES `product_promotions` WRITE;
/*!40000 ALTER TABLE `product_promotions` DISABLE KEYS */;
INSERT INTO `product_promotions` VALUES (1,1,'Create a promotional campaign for the Glad2glow skincare line, highlighting its benefits and unique features. Include engaging visuals and testimonials from users who have experienced positive results. Focus on building a community around skincare enthusiasts who value quality and effectiveness.','Create a promotional campaign for the Glad2glow skincare line, highlighting its benefits and unique features. Include engaging visuals and testimonials from users who have experienced positive results. Focus on building a community around skincare enthusiasts who value quality and effectiveness.','[\"/uploads/promotions/source/source-1763188589472-840565922.png\",\"/uploads/promotions/source/source-1763188594284-186157250.webp\"]','5cc37cc5-617a-4ae6-8faa-0a7ad831edea','processing',NULL,'2025-11-15 06:37:42','2025-11-15 06:37:42'),(2,1,'A woman in the image is holding a Glad2Glow product.','A woman in the image is holding a Glad2Glow product.','[\"/uploads/promotions/source/source-1763188780694-103841698.webp\",\"/uploads/promotions/source/source-1763188785426-373759775.png\"]','3759dad8-01a6-49ee-be14-c212d650db2f','processing',NULL,'2025-11-15 06:40:08','2025-11-15 06:40:08'),(3,1,'Create a realistic and natural product shoot featuring a woman holding this product.','Create a realistic and natural product shoot featuring a woman holding this product.','[\"/uploads/promotions/source/source-1763190384513-421211671.webp\",\"/uploads/promotions/source/source-1763190389876-448377981.png\"]','068ac68d-a17e-4be2-ac86-4ee6f0e9691b','processing',NULL,'2025-11-15 07:06:58','2025-11-15 07:06:58'),(4,1,'A woman holding the Glad2Glow product, showcasing its features and benefits in a lifestyle setting.','A woman holding the Glad2Glow product, showcasing its features and benefits in a lifestyle setting.','[\"/uploads/promotions/source/source-1763197627370-196304139.webp\",\"/uploads/promotions/source/source-1763197632950-617935427.png\"]','6952bda3-d01e-4d8d-80b0-e11d0bdadc35','completed','/uploads/promotions/promo_6952bda3-d01e-4d8d-80b0-e11d0bdadc35_1763197690871.png','2025-11-15 09:07:37','2025-11-15 09:08:10');
/*!40000 ALTER TABLE `product_promotions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product_shots`
--

DROP TABLE IF EXISTS `product_shots`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_shots` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `scene_description` text NOT NULL,
  `optimized_description` text,
  `product_image_url` varchar(500) NOT NULL,
  `ref_image_url` varchar(500) DEFAULT NULL,
  `request_id` varchar(255) NOT NULL,
  `status` enum('processing','completed','failed') DEFAULT 'processing',
  `result_image_url` varchar(500) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_created` (`user_id`,`created_at` DESC),
  KEY `idx_request_id` (`request_id`),
  CONSTRAINT `product_shots_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_shots`
--

LOCK TABLES `product_shots` WRITE;
/*!40000 ALTER TABLE `product_shots` DISABLE KEYS */;
INSERT INTO `product_shots` VALUES (1,1,'Capture a serene beach scene with your product placed on the sand near the water\'s edge. The sunlight should be gently reflecting off the waves, creating a natural and inviting atmosphere. Ensure the product is in focus, highlighting its features while the soft, sandy texture and the glistening water enhance the overall composition.','Capture a serene beach scene with your product placed on the sand near the water\'s edge. The sunlight should be gently reflecting off the waves, creating a natural and inviting atmosphere. Ensure the product is in focus, highlighting its features while the soft, sandy texture and the glistening water enhance the overall composition.','/uploads/product-shots/source/product-1763200221707-945575518.webp','/uploads/product-shots/source/ref-1763200221707-191947471.webp','854e7ff9-4c31-4c2f-9179-e275ca5deff2','completed','/uploads/product-shots/shot_854e7ff9-4c31-4c2f-9179-e275ca5deff2_1763200281621.png','2025-11-15 09:51:05','2025-11-15 09:51:21'),(2,1,'Create a professional product photo shoot featuring an elegant and luxurious background, simulating a beauty clinic environment. The setting should include soft, warm lighting, with high-end furniture and decor that conveys sophistication. Showcase the product prominently, ensuring it blends seamlessly with the upscale atmosphere. Use a clean and minimalist design to highlight the product\'s features while maintaining an overall sense of tranquility and beauty. Aim for a high-resolution image suitable for marketing materials.','Create a professional product photo shoot featuring an elegant and luxurious background, simulating a beauty clinic environment. The setting should include soft, warm lighting, with high-end furniture and decor that conveys sophistication. Showcase the product prominently, ensuring it blends seamlessly with the upscale atmosphere. Use a clean and minimalist design to highlight the product\'s features while maintaining an overall sense of tranquility and beauty. Aim for a high-resolution image suitable for marketing materials.','/uploads/product-shots/source/product-1763217975188-762212665.webp',NULL,'0aba2df1-c16b-4cc5-b462-81420099b4cd','completed','/uploads/product-shots/shot_0aba2df1-c16b-4cc5-b462-81420099b4cd_1763218099151.png','2025-11-15 14:46:56','2025-11-15 14:48:19');
/*!40000 ALTER TABLE `product_shots` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `remove_backgrounds`
--

DROP TABLE IF EXISTS `remove_backgrounds`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `remove_backgrounds` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `original_image_url` varchar(500) NOT NULL COMMENT 'URL gambar original dari IMGBB',
  `local_image_path` varchar(500) DEFAULT NULL COMMENT 'Path lokal gambar original',
  `task_id` varchar(255) DEFAULT NULL COMMENT 'Task ID dari API kie.ai',
  `status` enum('pending','generating','completed','failed') DEFAULT 'pending',
  `result_image_url` varchar(500) DEFAULT NULL COMMENT 'URL hasil dari IMGBB',
  `local_result_path` varchar(500) DEFAULT NULL COMMENT 'Path lokal hasil remove bg',
  `error_message` text,
  `cost_time` int DEFAULT NULL COMMENT 'Waktu pemrosesan dalam detik',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `expires_at` timestamp NOT NULL COMMENT 'Waktu kadaluarsa (24 jam dari created_at)',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_created` (`user_id`,`created_at` DESC),
  KEY `idx_task_id` (`task_id`),
  KEY `idx_status` (`status`),
  KEY `idx_expires` (`expires_at`),
  KEY `idx_user_status` (`user_id`,`status`),
  KEY `idx_user_status_created` (`user_id`,`status`,`created_at` DESC),
  CONSTRAINT `remove_backgrounds_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `remove_backgrounds`
--

LOCK TABLES `remove_backgrounds` WRITE;
/*!40000 ALTER TABLE `remove_backgrounds` DISABLE KEYS */;
INSERT INTO `remove_backgrounds` VALUES (1,1,'https://i.ibb.co/SDkwK8bw/original-1766912800211-jpeg.jpg','/uploads/remove-background/1/original_1766912800211.jpeg','8def228cee5c9bdc5ffa3bba7443b4f7','completed','https://i.ibb.co/XrV4S8bM/sijagoai-nobg-1766913170936-png.webp','/uploads/remove-background/1/sijagoai_nobg_1766913170936.png',NULL,8,'2025-12-28 09:06:40','2025-12-29 09:06:40','2025-12-28 09:12:54');
/*!40000 ALTER TABLE `remove_backgrounds` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `trending_video_cache`
--

DROP TABLE IF EXISTS `trending_video_cache`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `trending_video_cache` (
  `id` int NOT NULL AUTO_INCREMENT,
  `query` varchar(255) NOT NULL,
  `query_hash` char(64) NOT NULL,
  `video_data` json NOT NULL,
  `total_videos` int DEFAULT '0',
  `search_count` int DEFAULT '1',
  `last_searched_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `expires_at` timestamp NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_query_hash` (`query_hash`),
  KEY `idx_expires` (`expires_at`),
  KEY `idx_query` (`query`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `trending_video_cache`
--

LOCK TABLES `trending_video_cache` WRITE;
/*!40000 ALTER TABLE `trending_video_cache` DISABLE KEYS */;
/*!40000 ALTER TABLE `trending_video_cache` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `trending_video_ideas`
--

DROP TABLE IF EXISTS `trending_video_ideas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `trending_video_ideas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `video_id` varchar(255) NOT NULL,
  `video_url` text NOT NULL,
  `transcript_id` varchar(255) DEFAULT NULL,
  `transcript_text` text,
  `generated_idea` text,
  `status` enum('transcribing','generating','completed','failed') DEFAULT 'transcribing',
  `error_message` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `expires_at` timestamp NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_user_video` (`user_id`,`video_id`),
  KEY `idx_expires` (`expires_at`),
  CONSTRAINT `trending_video_ideas_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `trending_video_ideas`
--

LOCK TABLES `trending_video_ideas` WRITE;
/*!40000 ALTER TABLE `trending_video_ideas` DISABLE KEYS */;
/*!40000 ALTER TABLE `trending_video_ideas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `trending_video_searches`
--

DROP TABLE IF EXISTS `trending_video_searches`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `trending_video_searches` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `query` varchar(255) NOT NULL,
  `result_count` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_created` (`user_id`,`created_at` DESC),
  CONSTRAINT `trending_video_searches_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `trending_video_searches`
--

LOCK TABLES `trending_video_searches` WRITE;
/*!40000 ALTER TABLE `trending_video_searches` DISABLE KEYS */;
INSERT INTO `trending_video_searches` VALUES (1,1,'Good Time',20,'2025-12-26 10:30:46'),(2,1,'Good time',20,'2025-12-26 10:35:17'),(3,1,'Good Time',20,'2025-12-26 10:35:46'),(4,1,'Good time',20,'2025-12-26 10:38:23'),(5,1,'Good Time',20,'2025-12-26 12:28:47'),(6,1,'Good Time',20,'2025-12-26 12:29:33'),(7,1,'Good Time',20,'2025-12-26 13:53:00'),(8,1,'Iphone17',20,'2025-12-26 13:53:14'),(9,1,'Iphone17',20,'2025-12-26 14:02:53'),(10,1,'Iphone17',20,'2025-12-26 14:03:51'),(11,1,'Iphone17',20,'2025-12-26 14:05:51'),(12,1,'Iphone17',20,'2025-12-26 14:09:35'),(13,1,'Iphone17',20,'2025-12-26 16:10:47'),(14,1,'Iphone17',20,'2025-12-27 04:59:34'),(15,1,'Good Time',20,'2025-12-27 04:59:36');
/*!40000 ALTER TABLE `trending_video_searches` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('admin','user') DEFAULT 'user',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'admin','admin@example.com','$2a$10$NwRRBxaFPO.eIzkI9a6O4.P3399x4.lJGb03eSwzpUMyIyjb.GtU.','admin','2025-10-03 09:14:17','2025-10-03 09:23:22'),(2,'usertest','usertest@gmail.com','$2a$10$NeRvHCm20XEtSrokyrSDd.IYLyWEQAW6EIygG7MHBQriJty45a3iG','user','2025-10-03 10:03:03','2025-10-03 10:03:03');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `video_ai`
--

DROP TABLE IF EXISTS `video_ai`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `video_ai` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `prompt` text NOT NULL,
  `optimized_prompt` text,
  `image_url` varchar(500) NOT NULL,
  `request_id` varchar(255) NOT NULL,
  `status` enum('processing','completed','failed') DEFAULT 'processing',
  `video_url` varchar(500) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_created` (`user_id`,`created_at` DESC),
  KEY `idx_request_id` (`request_id`),
  CONSTRAINT `video_ai_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `video_ai`
--

LOCK TABLES `video_ai` WRITE;
/*!40000 ALTER TABLE `video_ai` DISABLE KEYS */;
INSERT INTO `video_ai` VALUES (1,1,'A woman in the image is reviewing a product in her hand by applying it to her skin. As she applies it, she says: \"With glad2glow, my skin feels smoother and looks brighter. Don’t forget to check it out!\" Transition the camera to focus on her hand applying the product, then zoom in on her glowing skin for a realistic and natural effect.','A woman in the image is reviewing a product in her hand by applying it to her skin. As she applies it, she says: \"With glad2glow, my skin feels smoother and looks brighter. Don’t forget to check it out!\" Transition the camera to focus on her hand applying the product, then zoom in on her glowing skin for a realistic and natural effect.','/uploads/videos/source/source-1763199306841-525717547.png','1bbae909-8d54-4540-b220-1578b0c2fa96','processing',NULL,'2025-11-15 09:36:45','2025-11-15 09:36:45'),(2,1,'\"Transition shot to a close-up of a woman with a natural and beautiful expression, smiling warmly and playfully. She looks directly at the camera and says in Bahasa, \'Halo Sayang.. lagi apa?\'\"','\"Transition shot to a close-up of a woman with a natural and beautiful expression, smiling warmly and playfully. She looks directly at the camera and says in Bahasa, \'Halo Sayang.. lagi apa?\'\"','/uploads/videos/source/source-1763216921079-398232114.png','8c32a709-20bc-477d-9b95-a60abefdf3e1','processing',NULL,'2025-11-15 14:29:27','2025-11-15 14:29:27'),(3,1,'\"Transition to a close-up shot of the woman as she smiles warmly at the camera, her eyes sparkling with enthusiasm. She begins speaking in Bahasa, her voice clear and inviting: \'Halo. Apa kabar? Aku disini menunggumu.\' Capture the naturalness of her expression and the sincerity in her tone, creating an engaging and realistic atmosphere.\"','\"Transition to a close-up shot of the woman as she smiles warmly at the camera, her eyes sparkling with enthusiasm. She begins speaking in Bahasa, her voice clear and inviting: \'Halo. Apa kabar? Aku disini menunggumu.\' Capture the naturalness of her expression and the sincerity in her tone, creating an engaging and realistic atmosphere.\"','/uploads/videos/source/source-1763217017554-40977511.png','0e33a7e9-8d89-4bfb-b54b-cfd407e35a5a','completed','/uploads/videos/video_0e33a7e9-8d89-4bfb-b54b-cfd407e35a5a_1763217511173.mp4','2025-11-15 14:30:56','2025-11-15 14:38:31');
/*!40000 ALTER TABLE `video_ai` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `video_custom_generations`
--

DROP TABLE IF EXISTS `video_custom_generations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `video_custom_generations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `title` varchar(255) NOT NULL,
  `image_url` varchar(500) NOT NULL COMMENT 'URL gambar dari IMGBB',
  `local_image_path` varchar(500) DEFAULT NULL,
  `video_prompt` text NOT NULL,
  `narration_text` text NOT NULL,
  `voice_id` varchar(100) NOT NULL,
  `voice_name` varchar(50) NOT NULL,
  `video_task_id` varchar(255) DEFAULT NULL COMMENT 'Task ID dari kie.ai',
  `sync_task_id` varchar(255) DEFAULT NULL COMMENT 'Task ID dari sync.so',
  `video_url` varchar(500) DEFAULT NULL COMMENT 'URL video dari kie.ai',
  `audio_url` varchar(500) DEFAULT NULL COMMENT 'URL audio dari elevenlabs',
  `final_video_url` varchar(500) DEFAULT NULL COMMENT 'URL final dari sync.so',
  `local_final_path` varchar(500) DEFAULT NULL,
  `status` enum('pending','generating_video','generating_audio','syncing','completed','failed') DEFAULT 'pending',
  `video_status` enum('pending','processing','completed','failed') DEFAULT 'pending',
  `audio_status` enum('pending','processing','completed','failed') DEFAULT 'pending',
  `sync_status` enum('pending','processing','completed','failed') DEFAULT 'pending',
  `error_message` text,
  `process_log` text COMMENT 'Process log untuk tracking',
  `cost_time` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `expires_at` timestamp NOT NULL COMMENT 'Waktu kadaluarsa (24 jam dari created_at)',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_created` (`user_id`,`created_at` DESC),
  KEY `idx_video_task` (`video_task_id`),
  KEY `idx_sync_task` (`sync_task_id`),
  KEY `idx_status` (`status`),
  KEY `idx_expires` (`expires_at`),
  KEY `idx_user_status` (`user_id`,`status`),
  CONSTRAINT `video_custom_generations_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `video_custom_generations`
--

LOCK TABLES `video_custom_generations` WRITE;
/*!40000 ALTER TABLE `video_custom_generations` DISABLE KEYS */;
INSERT INTO `video_custom_generations` VALUES (1,1,'Test','https://i.ibb.co/SDkwK8bw/original-1766912800211-jpeg.jpg','uploads\\video-custom\\1766927191116-WhatsApp Image 2025-12-24 at 12.18.32.jpeg','Karakter menjelaskan percarya diri, senang dan antusias dan berbicara \"Buruan beli shampo ini, lagi ada diskon di link keranjang kuning ku ya!\" Pastikan dialog diucapkan dalam bahasa indonesia tanpa teks, tanpa subtitel, dan tanpa translate. Saya tidak mau ada musik atau backsound apapun.','Buruan beli shampo ini, lagi ada diskon di link keranjang kuning ku ya!','WQ4h6sgS9p2XXvLsESBT','Selina',NULL,NULL,NULL,NULL,NULL,NULL,'failed','pending','failed','pending','Request failed with status code 400',NULL,NULL,'2025-12-28 13:06:31','2025-12-29 13:06:31','2025-12-28 13:06:31'),(2,1,'TT','https://i.ibb.co/SDkwK8bw/original-1766912800211-jpeg.jpg','uploads\\video-custom\\1766927511419-WhatsApp Image 2025-12-24 at 12.18.32.jpeg','Karakter menjelaskan percarya diri, senang dan antusias dan berbicara \"Laborie Derma Bond Shampoo bantu rawat rambut dari akarnya! sehingga buat rambut lebih sehat dan kuat\" Pastikan dialog diucapkan dalam bahasa indonesia tanpa teks, tanpa subtitel, dan tanpa translate. Saya tidak mau ada musik atau backsound apapun. hanya kelihatan foto produk dan tangannya','Laborie Derma Bond Shampoo bantu rawat rambut dari akarnya! sehingga buat rambut lebih sehat dan kuat','WQ4h6sgS9p2XXvLsESBT','Selina',NULL,NULL,NULL,NULL,NULL,NULL,'failed','pending','failed','pending','Request failed with status code 400',NULL,NULL,'2025-12-28 13:11:51','2025-12-29 13:11:51','2025-12-28 13:11:52'),(3,1,'test','https://i.ibb.co/SDkwK8bw/original-1766912800211-jpeg.jpg','uploads\\video-custom\\1766928119905-WhatsApp Image 2025-12-24 at 12.18.32.jpeg','Karakter menjelaskan percarya diri, senang dan antusias dan berbicara \"Buruan beli shampo ini, lagi ada diskon di link keranjang kuning ku ya!\" Pastikan dialog diucapkan dalam bahasa indonesia tanpa teks, tanpa subtitel, dan tanpa translate. Saya tidak mau ada musik atau backsound apapun.','Buruan beli shampo ini, lagi ada diskon di link keranjang kuning ku ya!','WQ4h6sgS9p2XXvLsESBT','Selina','7eb825256ea6cc8f60d047a0a01f9ebc',NULL,NULL,NULL,NULL,NULL,'failed','processing','failed','pending','Request failed with status code 400',NULL,NULL,'2025-12-28 13:21:59','2025-12-29 13:22:00','2025-12-28 13:22:04'),(4,1,'ttt','https://i.ibb.co/SDkwK8bw/original-1766912800211-jpeg.jpg','uploads\\video-custom\\1766928948948-WhatsApp Image 2025-12-24 at 12.18.32.jpeg','Karakter menjelaskan percarya diri, senang dan antusias dan berbicara \"Buruan beli shampo ini, lagi ada diskon di link keranjang kuning ku ya!\" Pastikan dialog diucapkan dalam bahasa indonesia tanpa teks, tanpa subtitel, dan tanpa translate. Saya tidak mau ada musik atau backsound apapun.','Buruan beli shampo ini, lagi ada diskon di link keranjang kuning ku ya!','WQ4h6sgS9p2XXvLsESBT','Selina','0a6486602ddb114a31fd16725778536e',NULL,'https://tempfile.aiquickdraw.com/h/0a6486602ddb114a31fd16725778536e_1766929047.mp4',NULL,NULL,NULL,'failed','completed','failed','pending','this.service.uploadAudioToImgbb is not a function',NULL,NULL,'2025-12-28 13:35:48','2025-12-29 13:35:49','2025-12-28 13:37:29'),(5,1,'Sukses','https://6b90b7e031df.ngrok-free.app/uploads/video-custom/images/image_5_1766929388132','uploads\\video-custom\\images\\image_5_1766929388132','Karakter menjelaskan percarya diri, senang dan antusias dan berbicara \"Buruan beli shampo ini, lagi ada diskon di link keranjang kuning ku ya!\" Pastikan dialog diucapkan dalam bahasa indonesia tanpa teks, tanpa subtitel, dan tanpa translate. Saya tidak mau ada musik atau backsound apapun.','Buruan beli shampo ini, lagi ada diskon di link keranjang kuning ku ya!','WQ4h6sgS9p2XXvLsESBT','Selina','e1403120c238fc54438e62529c163022','398b64c8-6c78-4574-ad7e-b2cba40f84d1','https://tempfile.aiquickdraw.com/h/e1403120c238fc54438e62529c163022_1766929436.mp4','https://6b90b7e031df.ngrok-free.app/uploads/video-custom/audio/audio_5_1766929390143.mp3','https://api.sync.so/v2/generations/398b64c8-6c78-4574-ad7e-b2cba40f84d1/result?token=5a3e30b8-2ffe-4a23-84c3-778c0bb2563c','uploads\\video-custom\\sijagoai_video_5_1766929493705.mp4','completed','completed','completed','completed',NULL,NULL,119,'2025-12-28 13:43:08','2025-12-29 13:43:08','2025-12-28 13:45:07'),(6,1,'Moncus','https://7548caa727b0.ngrok-free.app/uploads/video-custom/images/image_6_1766931577730','uploads\\video-custom\\images\\image_6_1766931577730','Karakter menjelaskan percarya diri, senang dan antusias dan berbicara \"Buruan beli shampo ini, lagi ada diskon di link keranjang kuning ku ya!\" Pastikan dialog diucapkan dalam bahasa indonesia tanpa teks, tanpa subtitel, dan tanpa translate. Saya tidak mau ada musik atau backsound apapun.','Buruan beli shampo ini, lagi ada diskon di link keranjang kuning ku ya!','IfTf4aIKP5HWjtR9yPZ2','Moncus',NULL,NULL,NULL,NULL,NULL,NULL,'failed','pending','failed','pending','Request failed with status code 404','[2025-12-28 14:19:37] Generation created\n[2025-12-28 14:19:37] Image uploaded: https://7548caa727b0.ngrok-free.app/uploads/video-custom/images/image_6_1766931577730\n[2025-12-28 14:19:37] 🚀 Starting video and audio generation...\n[2025-12-28 14:19:38] ❌ Audio generation failed: Request failed with status code 404',NULL,'2025-12-28 14:19:37','2025-12-29 14:19:38','2025-12-28 14:19:38'),(7,1,'Moncus Project AI','https://7548caa727b0.ngrok-free.app/uploads/video-custom/images/image_7_1766931903303','uploads\\video-custom\\images\\image_7_1766931903303','Karakter menjelaskan percarya diri, senang dan antusias dan berbicara \"Buruan beli shampo ini, lagi ada diskon di link keranjang kuning ku ya!\" Pastikan dialog diucapkan dalam bahasa indonesia tanpa teks, tanpa subtitel, dan tanpa translate. Saya tidak mau ada musik atau backsound apapun.','Buruan beli shampo ini, lagi ada diskon di link keranjang kuning ku ya!','IfTf4aIKP5HWjtR9yPZ2','Moncus','48b333fbbfbf46c173c5ebd50fb3bf6e','4c3c5634-12f0-4835-925e-54f665c334e2','https://tempfile.aiquickdraw.com/h/48b333fbbfbf46c173c5ebd50fb3bf6e_1766931967.mp4','https://7548caa727b0.ngrok-free.app/uploads/video-custom/audio/audio_7_1766931906260.mp3','https://api.sync.so/v2/generations/4c3c5634-12f0-4835-925e-54f665c334e2/result?token=108a76b3-8ef6-4f01-b46d-a36b0dde33fc','uploads\\video-custom\\sijagoai_video_7_1766932017057.mp4','completed','completed','completed','completed',NULL,'[2025-12-28 14:25:03] Generation created\n[2025-12-28 14:25:03] Image uploaded: https://7548caa727b0.ngrok-free.app/uploads/video-custom/images/image_7_1766931903303\n[2025-12-28 14:25:03] 🚀 Starting video and audio generation...\n[2025-12-28 14:25:06] Video generation started with task ID: 48b333fbbfbf46c173c5ebd50fb3bf6e\n[2025-12-28 14:25:06] ✅ Audio generation completed\n[2025-12-28 14:26:08] ✅ Video generation completed\n[2025-12-28 14:26:11] 🔄 Sync started with task ID: 4c3c5634-12f0-4835-925e-54f665c334e2\n[2025-12-28 14:27:05] ✅ Sync completed! Total time: 122 seconds',122,'2025-12-28 14:25:03','2025-12-29 14:25:03','2025-12-28 14:27:05');
/*!40000 ALTER TABLE `video_custom_generations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `video_generations`
--

DROP TABLE IF EXISTS `video_generations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `video_generations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `title` varchar(255) NOT NULL,
  `status` enum('processing','completed','partial','failed') DEFAULT 'processing',
  `total_scenes` int NOT NULL DEFAULT '0',
  `completed_scenes` int NOT NULL DEFAULT '0',
  `failed_scenes` int NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `expires_at` timestamp NOT NULL,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_created` (`user_id`,`created_at` DESC),
  KEY `idx_expires` (`expires_at`),
  KEY `idx_generation_status` (`status`),
  CONSTRAINT `video_generations_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `video_generations`
--

LOCK TABLES `video_generations` WRITE;
/*!40000 ALTER TABLE `video_generations` DISABLE KEYS */;
INSERT INTO `video_generations` VALUES (2,1,'Test 1','completed',1,1,0,'2025-12-27 05:00:31','2025-12-28 05:00:32','2025-12-27 05:07:28');
/*!40000 ALTER TABLE `video_generations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `video_promptings`
--

DROP TABLE IF EXISTS `video_promptings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `video_promptings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `ide_konten` text NOT NULL,
  `highlight_points` text NOT NULL,
  `url_products` varchar(500) DEFAULT NULL,
  `hook` text NOT NULL,
  `value` text NOT NULL,
  `cta` text NOT NULL,
  `generated_prompt` longtext,
  `status` enum('processing','completed','failed') DEFAULT 'processing',
  `error_message` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_created` (`user_id`,`created_at` DESC),
  CONSTRAINT `video_promptings_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `video_promptings`
--

LOCK TABLES `video_promptings` WRITE;
/*!40000 ALTER TABLE `video_promptings` DISABLE KEYS */;
INSERT INTO `video_promptings` VALUES (1,1,'\"Bertransformasi menjadi seorang Gamer Menakjubkan dengan Iqoo 15 - Ponsel Gaming dengan Performa Terkuat!\"','[\"\\\"Iqoo 15, ponsel flagship dengan performa gaming terbaik.\\\"\",\"\\\"Ditenagai oleh Chipset Snapdragon 8 Gen Elite.\\\"\",\"\\\"Persembahan kamera persicope kualitas premium.\\\"\",\"\\\"Lebih cepat, lebih kuat, dan lebih menakjubkan.\\\"\",\"\\\"Permainan tanpa gangguan, memaksimalkan pengalaman gaming Anda.\\\"\"]','','\"Jadilah raja game dengan Iqoo 15, ponsel gaming terhebat yang dirancang khusus untuk Anda!\"','\"Mainkan game sepuasnya dengan chipset Snapdragon 8 Gen Elite dari Iqoo 15. Dengan kinerja luar biasa cepat dan kuat, bebas lag dan gangguan! Kamera persicope-nya akan ubah cara Anda mengabadikan momen. Lebih dari sekedar ponsel, Iqoo 15 adalah teman gaming Anda yang tak tergantikan. Dapatkan keunggulan dalam setiap pertempuran dan jadilah pemain terbaik!\"','\"Tunggu apa lagi? Tingkatkan permainan Anda bersama Iqoo 15! Kunjungi https://www.iqoo.com/id/products/iqoo-15 dan rasakan performa gaming yang tak tertandingi. Jadilah bagian dari revolusi gaming hari ini!\"','📌 CHARACTER CONSISTENCY DESCRIPTION:\nKarakter berjenis kelamin laki-laki, berusia 20-30 tahun, berpenampilan modern dengan casual attire berwarna hitam. Karakter memiliki rambut pendek hitam, dan berbicara dengan gaya yang energetik dan percaya diri.\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nSCENE 1 (0-5s) - HOOK\n═══════════════════════════════════════════════════════════════════\n🎥 VEO PROMPT (English):\nThe character stands confidently in a modern, minimalist setting with a neutral background. His hands are moving expressively as he speaks, matching the energy of his narration.\n\n🗣️ INDONESIAN NARRATION (Exact Lip-Sync Text):\n\"Jadilah raja game dengan Iqoo 15, ponsel gaming terhebat yang dirancang khusus untuk Anda!\"\n\n📹 CAMERA MOVEMENT:\nStatic shot with character centered in frame.\n\n😊 FACIAL EXPRESSION & GESTURE:\nConfident and enthusiastic, with expressive hand gestures.\n\n🔄 TRANSITION TO NEXT SCENE:\nSmooth cut to Scene 2 as character finishes his sentence.\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nSCENE 2 (5-10s) - PROBLEM/CONTEXT\n═══════════════════════════════════════════════════════════════════\n🎥 VEO PROMPT (English):\nThe character continues talking, now holding a generic gaming phone. He seems slightly frustrated, showing the problem context.\n\n🗣️ INDONESIAN NARRATION (Exact Lip-Sync Text):\n\"Apakah Anda merasa frustrasi dengan performa ponsel gaming Anda saat ini?\"\n\n📹 CAMERA MOVEMENT:\nSlow push-in to emphasize the problem.\n\n😊 FACIAL EXPRESSION & GESTURE:\nFrustrated, emphasizing the gaming phone in his hand.\n\n🔄 TRANSITION TO NEXT SCENE:\nCut to Scene 3 as the character lowers the generic phone.\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nSCENE 3 (10-15s) - SOLUTION INTRO\n═══════════════════════════════════════════════════════════════════\n🎥 VEO PROMPT (English):\nThe character now holds up an Iqoo 15, his expression changing to excitement as he introduces the solution.\n\n🗣️ INDONESIAN NARRATION (Exact Lip-Sync Text):\n\"Mainkan game sepuasnya dengan chipset Snapdragon 8 Gen Elite dari Iqoo 15.\"\n\n📹 CAMERA MOVEMENT:\nSlow push-in to focus on Iqoo 15 in character\'s hand.\n\n😊 FACIAL EXPRESSION & GESTURE:\nExcited and enthusiastic, showing off the Iqoo 15.\n\n🔄 TRANSITION TO NEXT SCENE:\nCut to Scene 4 as the character continues to speak about the Iqoo 15.\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nSCENE 4 (15-20s) - VALUE PROOF\n═══════════════════════════════════════════════════════════════════\n🎥 VEO PROMPT (English):\nThe character continues to speak, now showing the back of the Iqoo 15 with its camera, emphasizing its value.\n\n🗣️ INDONESIAN NARRATION (Exact Lip-Sync Text):\n\"Dengan kinerja luar biasa cepat dan kuat, bebas lag dan gangguan! Kamera persicope-nya akan ubah cara Anda mengabadikan momen.\"\n\n📹 CAMERA MOVEMENT:\nSlow orbit around character to focus on the Iqoo 15\'s camera.\n\n😊 FACIAL EXPRESSION & GESTURE:\nImpressed and amazed, focusing on the Iqoo 15\'s camera.\n\n🔄 TRANSITION TO NEXT SCENE:\nCut to Scene 5 as the character finishes his sentence.\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nSCENE 5 (20-25s) - BENEFIT HIGHLIGHT\n═══════════════════════════════════════════════════════════════════\n🎥 VEO PROMPT (English):\nThe character continues speaking, now pointing towards the Iqoo 15, emphasizing its benefits.\n\n🗣️ INDONESIAN NARRATION (Exact Lip-Sync Text):\n\"Lebih dari sekedar ponsel, Iqoo 15 adalah teman gaming Anda yang tak tergantikan.\"\n\n📹 CAMERA MOVEMENT:\nStatic shot with character centered in frame.\n\n😊 FACIAL EXPRESSION & GESTURE:\nConfident and assertive, pointing towards the Iqoo 15.\n\n🔄 TRANSITION TO NEXT SCENE:\nCut to Scene 6 as the character finishes his sentence.\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nSCENE 6 (25-30s) - SOFT CTA\n═══════════════════════════════════════════════════════════════════\n🎥 VEO PROMPT (English):\nThe character recites the final call to action, pointing or gesturing to a visual overlay of the URL.\n\n🗣️ INDONESIAN NARRATION (Exact Lip-Sync Text):\n\"Tunggu apa lagi? Tingkatkan permainan Anda bersama Iqoo 15! Kunjungi https://www.iqoo.com/id/products/iqoo-15 dan rasakan performa gaming yang tak tertandingi. Jadilah bagian dari revolusi gaming hari ini!\"\n\n📹 CAMERA MOVEMENT:\nSlow pull back to end the video.\n\n😊 FACIAL EXPRESSION & GESTURE:\nInviting and encouraging, gesturing towards the URL.\n\n🔄 TRANSITION TO NEXT SCENE:\nFade out as the character finishes his sentence.\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n📌 POST-PRODUCTION TIPS:\nEnsure smooth transitions between each scene, allowing the character\'s movement and speech to flow naturally. The lighting should remain consistent throughout, maintaining the same intensity and direction. The character\'s outfit should not change between scenes, and the background should remain the same.\n\n📌 NARRATION TIMING GUIDE:\nApproximately 10-15 words per scene, timed to match the character\'s lip movements.','completed',NULL,'2025-12-26 16:39:38','2025-12-26 16:40:40'),(2,1,'Bertransformasi menjadi seorang Gamer Menakjubkan dengan Iqoo 15 - Ponsel Gaming dengan Performa Terkuat!','[\"Iqoo 15, ponsel flagship dengan performa gaming terbaik.\",\"Ditenagai oleh Chipset Snapdragon 8 Gen Elite.\",\"Persembahan kamera persicope kualitas premium.\",\"Lebih cepat, lebih kuat, dan lebih menakjubkan.\",\"Permainan tanpa gangguan, memaksimalkan pengalaman gaming Anda.\"]','','Jadilah raja game dengan Iqoo 15, ponsel gaming terhebat yang dirancang khusus untuk Anda!','Mainkan game sepuasnya dengan chipset Snapdragon 8 Gen Elite dari Iqoo 15. Dengan kinerja luar biasa cepat dan kuat, bebas lag dan gangguan! Kamera persicope-nya akan ubah cara Anda mengabadikan momen. Lebih dari sekedar ponsel, Iqoo 15 adalah teman gaming Anda yang tak tergantikan. Dapatkan keunggulan dalam setiap pertempuran dan jadilah pemain terbaik!','Tunggu apa lagi? Tingkatkan permainan Anda bersama Iqoo 15! Kunjungi https:// dan rasakan performa gaming yang tak tertandingi. Jadilah bagian dari revolusi gaming hari ini!','SCENE 1 (0-5s) - HOOK\n═══════════════════════════════════════════════════════════════════\nThe character from the image, maintaining the exact appearance, outfit, and hairstyle, is standing confidently in the same setting as in the image. The character is looking directly into the camera with a wide smile, speaking in Indonesian saying: \"Jadilah raja game dengan Iqoo 15, ponsel gaming terhebat yang dirancang khusus untuk Anda!\" The camera is slowly zooming in on the character\'s face to capture the excitement in their eyes. The lighting style is consistent with the image, highlighting the character in a flattering way. The scene is set to last for 5 seconds, ensuring the focus is on the character and their words. As the character finishes speaking, they raise their hand, pointing to the right, cueing the transition to the next scene.\n═══════════════════════════════════════════════════════════════════\n\nSCENE 2 (5-10s) - PROBLEM/CONTEXT\n═══════════════════════════════════════════════════════════════════\nThe same character from the image appears on the right side of the screen, maintaining the same appearance, outfit, and hairstyle. The character assumes a thoughtful pose and speaks in Indonesian, saying: \"Apakah Anda merasa terganggu dengan performa gaming ponsel Anda saat ini?\" The camera pans from the character to a representation of a frustrating gaming experience on a phone screen. The lighting remains consistent with the image, creating a natural and engaging atmosphere. The scene ends with the character looking up, signaling a transition to the solution.\n═══════════════════════════════════════════════════════════════════\n\nSCENE 3 (10-15s) - SOLUTION INTRO\n═══════════════════════════════════════════════════════════════════\nThe same character from the image is shown, holding an Iqoo 15 phone with a triumphant smile. The character speaks in Indonesian, saying: \"Mainkan game sepuasnya dengan chipset Snapdragon 8 Gen Elite dari Iqoo 15.\" The camera slowly zooms in on the phone as the character holds it up, focusing on its sleek design. The lighting is consistent with the image, casting a warm glow on the scene. After finishing the sentence, the character starts pointing towards the phone, indicating the transition to the next scene.\n═══════════════════════════════════════════════════════════════════\n\nSCENE 4 (15-20s) - VALUE PROOF\n═══════════════════════════════════════════════════════════════════\nThe same character from the image appears again, maintaining the outfit and hairstyle, pointing at the Iqoo 15. The character speaks in Indonesian, saying: \"Dengan kinerja luar biasa cepat dan kuat, bebas lag dan gangguan!\" The camera pans from the character to a representation of an impressive gaming experience on the phone screen. The lighting remains consistent with the image, highlighting the phone\'s features. The character wraps up the scene by confidently asserting, \"Iqoo 15 adalah teman gaming Anda yang tak tergantikan,\" setting up the transition to the next scene.\n═══════════════════════════════════════════════════════════════════\n\nSCENE 5 (20-25s) - BENEFIT HIGHLIGHT\n═══════════════════════════════════════════════════════════════════\nThe same character from the image is seen, maintaining the outfit and hairstyle. The character speaks in Indonesian, saying: \"Kamera persicope-nya akan ubah cara Anda mengabadikan momen.\" The camera pans from the character to a representation of amazing photo quality taken by the phone. The lighting remains consistent with the image. The character ends the scene by looking at the camera, confidently saying, \"Dapatkan keunggulan dalam setiap pertempuran dan jadilah pemain terbaik!\" indicating the transition to the final scene.\n═══════════════════════════════════════════════════════════════════\n\nSCENE 6 (25-30s) - SOFT CTA\n═══════════════════════════════════════════════════════════════════\nThe same character from the image appears one final time, maintaining the outfit and hairstyle. The character speaks in Indonesian, saying: \"Tunggu apa lagi? Tingkatkan permainan Anda bersama Iqoo 15! Kunjungi https:// dan rasakan performa gaming yang tak tertandingi. Jadilah bagian dari revolusi gaming hari ini!\" The camera pulls back, readying for the end of the video, as the character holds the Iqoo 15 phone up high. The lighting remains consistent with the image, creating a triumphant end to the video.\n═══════════════════════════════════════════════════════════════════','completed',NULL,'2025-12-26 16:59:36','2025-12-26 17:01:19');
/*!40000 ALTER TABLE `video_promptings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `video_scenes`
--

DROP TABLE IF EXISTS `video_scenes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `video_scenes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `generation_id` int NOT NULL,
  `scene_number` int NOT NULL,
  `prompt` text NOT NULL,
  `image1_url` varchar(500) NOT NULL,
  `image2_url` varchar(500) DEFAULT NULL,
  `task_id` varchar(255) DEFAULT NULL,
  `status` enum('pending','processing','completed','failed') DEFAULT 'pending',
  `video_url` varchar(500) DEFAULT NULL,
  `original_url` varchar(500) DEFAULT NULL,
  `resolution` varchar(50) DEFAULT NULL,
  `fallback_flag` tinyint(1) DEFAULT '0',
  `error_message` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_generation_scene` (`generation_id`,`scene_number`),
  KEY `idx_task_id` (`task_id`),
  KEY `idx_status` (`status`),
  CONSTRAINT `video_scenes_ibfk_1` FOREIGN KEY (`generation_id`) REFERENCES `video_generations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `video_scenes`
--

LOCK TABLES `video_scenes` WRITE;
/*!40000 ALTER TABLE `video_scenes` DISABLE KEYS */;
INSERT INTO `video_scenes` VALUES (2,2,1,'Karakter menjelaskan percarya diri, senang dan antusias dan berbicara \"Laborie Derma Bond Shampoo bantu rawat rambut dari akarnya! sehingga buat rambut lebih sehat dan kuat\" Pastikan dialog diucapkan dalam bahasa indonesia tanpa teks, tanpa subtitel, dan tanpa translate. Saya tidak mau ada musik atau backsound apapun. hanya kelihatan foto produk dan tangannya','https://i.ibb.co/5g8RjDLd/1766811627282-Whats-App-Image-2025-12-24-at-12-18-03-jpeg.jpg','https://i.ibb.co/4RmtLczb/1766811630768-Whats-App-Image-2025-12-24-at-12-18-32-jpeg.jpg','84bc359f71c51d9ec4a13d3b2da47b73','completed','/uploads/videos/2/sijagoai_2_scene1.mp4','https://tempfile.aiquickdraw.com/v/84bc359f71c51d9ec4a13d3b2da47b73_1766811735.mp4','1080p',0,NULL,'2025-12-27 05:00:31','2025-12-27 05:07:28');
/*!40000 ALTER TABLE `video_scenes` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-12-28 22:51:00
