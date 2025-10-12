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
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `idea_chats`
--

LOCK TABLES `idea_chats` WRITE;
/*!40000 ALTER TABLE `idea_chats` DISABLE KEYS */;
INSERT INTO `idea_chats` VALUES (2,1,'Jualan sepatu anak','2025-10-03 16:50:59','2025-10-03 17:03:11'),(3,1,'Ide Konten TikTok untuk Bisnis','2025-10-03 17:07:28','2025-10-03 17:08:01');
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
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `idea_messages`
--

LOCK TABLES `idea_messages` WRITE;
/*!40000 ALTER TABLE `idea_messages` DISABLE KEYS */;
INSERT INTO `idea_messages` VALUES (3,2,'user','Jualan sepatu anak','2025-10-03 16:50:59'),(4,2,'assistant','1. **Ide Konten TikTok**: \n   - Hook edukatif: \"Tahukah kamu bahwa 60% orang tua bingung memilih sepatu anak yang tepat?\"\n   - Isi berbasis data: \"Berdasarkan riset, sepatu yang baik untuk anak adalah yang mendukung pertumbuhan kaki secara optimal. Yuk, cari tahu 3 tips memilih sepatu anak yang tepat sesuai rekomendasi ahli!\"\n   - Penutup: \"Dengan sepatu yang tepat, pertumbuhan kaki anak bisa lebih baik!\"\n   - CTA: \"Klik link di bio untuk melihat koleksi sepatu anak terbaik kami!\"\n\n2. **Caption Profesional**: \n   \"Memilih sepatu anak ternyata tidak bisa sembarangan! Temukan tips memilih sepatu yang tepat untuk kesehatan dan pertumbuhan kaki si kecil. 👟 #SepatuAnak #EdukasiOrangTua #TipsBelanja\"\n\n3. **Storyboard Video Lengkap (Detik-Detik)**:\n   - **Hook (0-5 detik)**: \n     - Visual: Cuplikan video anak-anak yang sedang mencoba berbagai sepatu.\n     - Narasi: \"Tahukah kamu bahwa 60% orang tua bingung memilih sepatu anak yang tepat?\"\n\n   - **Isi Part 1 (6-10 detik)**:\n     - Visual: Teks \"Riset menunjukkan: Sepatu yang mendukung pertumbuhan optimal\".\n     - Narasi: \"Berdasarkan riset, sepatu yang tepat mendukung pertumbuhan kaki anak.\"\n\n   - **Isi Part 2 (11-15 detik)**:\n     - Visual: Gambar infografis dengan 3 tips memilih sepatu anak.\n     - Narasi: \"1. Pilih ukuran yang pas, 2. Perhatikan bahan dan fleksibilitas, 3. Cek sol sepatu.\"\n\n   - **Isi Part 3 (16-20 detik)**:\n     - Visual: Anak-anak bermain sambil menggunakan sepatu yang tepat.\n     - Narasi: \"Sepatu yang pas akan membuat anak lebih nyaman dan mendukung aktivitasnya.\"\n\n   - **Closing (21-25 detik)**:\n     - Visual: Logo merek sepatu anak dengan tagline.\n     - Narasi: \"Dengan sepatu yang tepat, pertumbuhan kaki anak bisa lebih baik!\"\n\n   - **CTA (26-30 detik)**:\n     - Visual: Teks \"Klik link di bio untuk koleksi terbaik!\"\n     - Narasi: \"Klik link di bio untuk melihat koleksi sepatu anak terbaik kami!\"','2025-10-03 16:51:10'),(5,2,'user','buatkan ide lainnya','2025-10-03 17:03:00'),(6,2,'assistant','1. **Ide Konten TikTok**: \n   - Hook edukatif: \"Riset terbaru membuktikan, 70% anak mengalami masalah kaki karena pemilihan sepatu yang salah!\"\n   - Isi berbasis data: \"Fakta menunjukkan, sepatu yang tidak sesuai dapat menghambat perkembangan kaki anak. Inilah 3 cara memastikan sepatu anak yang kamu pilih benar-benar tepat.\"\n   - Penutup: \"Pastikan setiap langkah anak aman dan nyaman!\"\n   - CTA: \"Lihat koleksi sepatu anak yang telah teruji keamanannya di link bio kami!\"\n\n2. **Caption Profesional**: \n   \"Jangan remehkan pentingnya memilih sepatu yang tepat untuk anak. Pastikan mereka melangkah dengan nyaman dan aman! 🌟 #EdukasiOrangTua #SepatuAnak #KesehatanAnak\"\n\n3. **Storyboard Video Lengkap (Detik-Detik)**:\n   - **Hook (0-5 detik)**: \n     - Visual: Anak yang terlihat tidak nyaman dengan sepatu yang terlalu ketat.\n     - Narasi: \"Riset terbaru, 70% anak alami masalah kaki karena sepatu salah!\"\n\n   - **Isi Part 1 (6-10 detik)**:\n     - Visual: Teks \"Fakta: Sepatu yang salah dapat menghambat perkembangan.\"\n     - Narasi: \"Fakta menunjukkan, sepatu yang tidak sesuai dapat merugikan.\"\n\n   - **Isi Part 2 (11-15 detik)**:\n     - Visual: Display sepatu dengan fitur yang tepat.\n     - Narasi: \"1. Ukuran harus ada ruang untuk jari, 2. Pilih bahan yang breathable, 3. Sol yang empuk dan fleksibel.\"\n\n   - **Isi Part 3 (16-20 detik)**:\n     - Visual: Anak-anak berlari dan bermain dengan sepatu yang tepat.\n     - Narasi: \"Sepatu yang tepat mendukung aktivitas dan pertumbuhan optimal.\"\n\n   - **Closing (21-25 detik)**:\n     - Visual: Logo merek sepatu anak dengan tagline.\n     - Narasi: \"Pastikan setiap langkah anak aman dan nyaman!\"\n\n   - **CTA (26-30 detik)**:\n     - Visual: Teks \"Lihat koleksi aman di link bio!\"\n     - Narasi: \"Lihat koleksi sepatu anak yang telah teruji keamanannya di link bio kami!\"','2025-10-03 17:03:11'),(7,3,'user','Sempak','2025-10-03 17:07:28'),(8,3,'assistant','Saya minta maaf, tetapi saya tidak dapat membantu dengan permintaan itu. Jika kamu memiliki ide konten lain untuk TikTok yang ingin dieksplorasi, seperti topik bisnis, edukasi, atau lainnya, silakan beri tahu saya!','2025-10-03 17:07:30'),(9,3,'user','Jualan sempak anak','2025-10-03 17:07:48'),(10,3,'assistant','Berikut adalah ide konten TikTok untuk mempromosikan produk sempak anak dengan pendekatan edukatif:\n\n1. Ide Konten TikTok: \n   Hook edukatif: \"Tahukah kamu bahwa 70% orang tua bingung memilih bahan yang tepat untuk pakaian dalam anak?\"\n   Isi berbasis data: \"Berdasarkan riset, bahan katun adalah pilihan terbaik karena nyaman dan menyerap keringat.\"\n   Penutup: \"Pilihlah sempak anak yang memberikan kenyamanan dan kesehatan.\"\n   CTA: \"Cek koleksi lengkap kami di [Nama Toko] dan berikan yang terbaik untuk si kecil!\"\n\n2. Caption Profesional: \n   \"Pilih yang terbaik untuk si kecil! 🌟 #SempakAnak #TipsOrangtua #EdukasiOrangtua #FashionAnak\"\n\n3. Storyboard Video Lengkap (Detik-Detik):\n   - Hook (0-5 detik): \"Tahukah kamu bahwa 70% orang tua bingung memilih bahan yang tepat untuk pakaian dalam anak?\"\n     Narasi: \"Banyak orang tua merasa bingung dalam memilih bahan sempak anak yang terbaik.\"\n   - Isi Part 1 (6-10 detik): \"Berdasarkan riset, bahan katun adalah pilihan terbaik karena nyaman dan menyerap keringat.\"\n     Narasi: \"Fakta menunjukkan, bahan katun menyerap keringat dan nyaman dipakai.\"\n   - Isi Part 2 (11-15 detik): \"Sempak anak dari katun membantu menjaga kesehatan kulit si kecil.\"\n     Narasi: \"Katun juga membantu mencegah iritasi pada kulit sensitif anak.\"\n   - Isi Part 3 (16-20 detik): \"Pilihlah sempak anak yang memberikan kenyamanan dan kesehatan.\"\n     Narasi: \"Jangan kompromi, pilihlah yang terbaik untuk si kecil.\"\n   - Closing (21-25 detik): \"Koleksi kami tersedia dalam berbagai warna dan desain menarik.\"\n     Narasi: \"Dapatkan pilihan warna dan desain yang si kecil pasti suka.\"\n   - CTA (26-30 detik): \"Cek koleksi lengkap kami di [Nama Toko] dan berikan yang terbaik untuk si kecil!\"\n     Narasi: \"Ayo, kunjungi toko kami sekarang dan temukan koleksi terbaik untuk anakmu!\"\n\nSemoga konten ini dapat membantu meningkatkan penjualan dengan pendekatan edukatif dan menarik perhatian audiens di TikTok!','2025-10-03 17:08:01');
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
INSERT INTO `media` VALUES (3,1,1,'1759489800004-43572752.MOV','IMG_2082.MOV','public\\uploads\\1759489800004-43572752.MOV',5806407,'video/quicktime','http://localhost:3000/uploads/1759489800004-43572752.MOV','2025-10-03 11:10:00'),(4,1,1,'1759489816227-949474190.MOV','IMG_2052.MOV','public\\uploads\\1759489816227-949474190.MOV',5546699,'video/quicktime','http://localhost:3000/uploads/1759489816227-949474190.MOV','2025-10-03 11:10:16'),(5,1,1,'1759489816339-30098676.MOV','IMG_3131.MOV','public\\uploads\\1759489816339-30098676.MOV',29319654,'video/quicktime','http://localhost:3000/uploads/1759489816339-30098676.MOV','2025-10-03 11:10:16'),(6,1,NULL,'1759493704802-290493103.MOV','IMG_3119.MOV','public\\uploads\\1759493704802-290493103.MOV',16553982,'video/quicktime','http://localhost:3000/uploads/1759493704802-290493103.MOV','2025-10-03 12:15:08'),(7,1,NULL,'1759493706834-562131170.MOV','IMG_3178.MOV','public\\uploads\\1759493706834-562131170.MOV',16456598,'video/quicktime','http://localhost:3000/uploads/1759493706834-562131170.MOV','2025-10-03 12:15:08'),(8,1,NULL,'1759493707425-890935317.MOV','IMG_3244.MOV','public\\uploads\\1759493707425-890935317.MOV',16451521,'video/quicktime','http://localhost:3000/uploads/1759493707425-890935317.MOV','2025-10-03 12:15:08'),(9,1,NULL,'1759493708036-707999452.MOV','IMG_3242.MOV','public\\uploads\\1759493708036-707999452.MOV',16268542,'video/quicktime','http://localhost:3000/uploads/1759493708036-707999452.MOV','2025-10-03 12:15:08'),(10,1,NULL,'1759493708510-539193613.MOV','IMG_2045.MOV','public\\uploads\\1759493708510-539193613.MOV',4232258,'video/quicktime','http://localhost:3000/uploads/1759493708510-539193613.MOV','2025-10-03 12:15:08');
/*!40000 ALTER TABLE `media` ENABLE KEYS */;
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
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-10-13  0:58:02
