/*
  Warnings:

  - You are about to drop the column `personality_charm` on the `game_archive` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `game_archive` DROP COLUMN `personality_charm`,
    ADD COLUMN `personality_trend` INTEGER NOT NULL DEFAULT 0;
