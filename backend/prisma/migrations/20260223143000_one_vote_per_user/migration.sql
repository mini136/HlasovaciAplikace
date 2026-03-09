CREATE TABLE `PollBallot`
(
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `voterKey` VARCHAR
(191) NOT NULL,
    `optionId` INTEGER NOT NULL,
    `createdAt` DATETIME
(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
(3),

    UNIQUE INDEX `PollBallot_voterKey_key`
(`voterKey`),
    INDEX `PollBallot_optionId_idx`
(`optionId`),
    PRIMARY KEY
(`id`)
) DEFAULT CHARACTER
SET utf8mb4
COLLATE utf8mb4_unicode_ci;

ALTER TABLE `PollBallot`
ADD CONSTRAINT `PollBallot_optionId_fkey`
    FOREIGN KEY
(`optionId`) REFERENCES `PollOption`
(`id`)
    ON
DELETE CASCADE ON
UPDATE CASCADE;
