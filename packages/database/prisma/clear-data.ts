import { prisma } from '../src';

async function main() {
  await prisma.$transaction([
    prisma.matchSideMember.deleteMany(),
    prisma.matchSide.deleteMany(),
    prisma.game.deleteMany(),
    prisma.bracketSlot.deleteMany(),
    prisma.groupStanding.deleteMany(),
    prisma.groupMember.deleteMany(),
    prisma.match.deleteMany(),
    prisma.stageRule.deleteMany(),
    prisma.group.deleteMany(),
    prisma.stage.deleteMany(),
    prisma.tournamentParticipant.deleteMany(),
    prisma.tournament.deleteMany(),
    prisma.loginHistory.deleteMany(),
    prisma.refreshToken.deleteMany(),
    prisma.notification.deleteMany(),
    prisma.device.deleteMany(),
    prisma.ratingHistory.deleteMany(),
    prisma.otpVerification.deleteMany(),
    prisma.admin.deleteMany(),
    prisma.user.deleteMany(),
  ]);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
