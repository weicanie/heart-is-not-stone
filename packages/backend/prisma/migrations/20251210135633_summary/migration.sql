-- AlterTable
ALTER TABLE `ai_conversation` ADD COLUMN `summary` TEXT NULL;

-- AlterTable
ALTER TABLE `ai_npc` ADD COLUMN `status` VARCHAR(50) NOT NULL DEFAULT 'normal';
