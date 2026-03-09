-- CreateTable
CREATE TABLE `PollOption`
(
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `code` VARCHAR
(191) NOT NULL,
  `label` VARCHAR
(191) NOT NULL,

  UNIQUE INDEX `PollOption_code_key`
(`code`),
  PRIMARY KEY
(`id`)
) DEFAULT CHARACTER
SET utf8mb4
COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PollVote`
(
  `optionId` INTEGER NOT NULL,
  `count` INTEGER NOT NULL DEFAULT 0,

  PRIMARY KEY
(`optionId`)
) DEFAULT CHARACTER
SET utf8mb4
COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `PollVote`
ADD CONSTRAINT `PollVote_optionId_fkey` FOREIGN KEY
(`optionId`) REFERENCES `PollOption`
(`id`) ON
DELETE CASCADE ON
UPDATE CASCADE;
