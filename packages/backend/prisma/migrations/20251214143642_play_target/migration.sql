-- CreateTable
CREATE TABLE `play_target` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(500) NOT NULL,
    `icon` VARCHAR(500) NOT NULL,
    `done` BOOLEAN NOT NULL DEFAULT false,
    `descTxt` TEXT NOT NULL,
    `descMd` TEXT NULL,
    `game_archive_id` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
