/*
  Warnings:

  - You are about to drop the column `content` on the `ai_conversation` table. All the data in the column will be lost.
  - You are about to drop the column `label` on the `ai_conversation` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `ai_conversation` DROP COLUMN `content`,
    DROP COLUMN `label`;
