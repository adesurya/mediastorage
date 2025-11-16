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
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-11-16 21:28:49
