/*
  Warnings:

  - You are about to drop the column `project_id` on the `ai_conversation` table. All the data in the column will be lost.
  - You are about to drop the column `user_id` on the `ai_conversation` table. All the data in the column will be lost.
  - You are about to drop the `article` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `project_file` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `project_file_chunk` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `user_article` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `user_project` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `game_archive_id` to the `ai_conversation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `npc_name` to the `ai_conversation` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `ai_conversation` DROP FOREIGN KEY `ai_conversation_user_id_fkey`;

-- DropForeignKey
ALTER TABLE `project_file` DROP FOREIGN KEY `project_file_user_project_id_fkey`;

-- DropForeignKey
ALTER TABLE `project_file_chunk` DROP FOREIGN KEY `project_file_chunk_project_file_id_fkey`;

-- DropForeignKey
ALTER TABLE `user_article` DROP FOREIGN KEY `user_article_article_id_fkey`;

-- DropForeignKey
ALTER TABLE `user_article` DROP FOREIGN KEY `user_article_user_id_fkey`;

-- DropForeignKey
ALTER TABLE `user_project` DROP FOREIGN KEY `user_project_user_id_fkey`;

-- DropIndex
DROP INDEX `user_id` ON `ai_conversation`;

-- AlterTable
ALTER TABLE `ai_conversation` DROP COLUMN `project_id`,
    DROP COLUMN `user_id`,
    ADD COLUMN `game_archive_id` INTEGER NOT NULL,
    ADD COLUMN `npc_name` VARCHAR(50) NOT NULL;

-- AlterTable
ALTER TABLE `user` ADD COLUMN `cur_game_archive_id` INTEGER NULL;

-- DropTable
DROP TABLE `article`;

-- DropTable
DROP TABLE `project_file`;

-- DropTable
DROP TABLE `project_file_chunk`;

-- DropTable
DROP TABLE `user_article`;

-- DropTable
DROP TABLE `user_project`;

-- CreateTable
CREATE TABLE `game_archive` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(50) NOT NULL,
    `role_name` VARCHAR(50) NOT NULL,
    `user_id` INTEGER NOT NULL,
    `create_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `update_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ai_npc` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(50) NOT NULL,
    `game_archive_id` INTEGER NOT NULL,
    `relationshipValue` INTEGER NOT NULL DEFAULT 0,
    `relationshipTier` VARCHAR(50) NOT NULL DEFAULT 'strange',
    `specialRelationship` JSON NULL,
    `traits` JSON NULL,
    `create_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `update_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
