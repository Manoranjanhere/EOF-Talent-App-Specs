import { PrismaClient, PurchaseType } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.groupMaster.upsert({
    where: { id: 1 },
    update: { title: "Talent", code: "TALENT" },
    create: { id: 1, title: "Talent", code: "TALENT" }
  });
  await prisma.groupMaster.upsert({
    where: { id: 2 },
    update: { title: "Talent Employer / Agency", code: "EMPLOYER_AGENCY" },
    create: { id: 2, title: "Talent Employer / Agency", code: "EMPLOYER_AGENCY" }
  });
  await prisma.groupMaster.upsert({
    where: { id: 5 },
    update: { title: "Admin", code: "ADMIN" },
    create: { id: 5, title: "Admin", code: "ADMIN" }
  });
  await prisma.groupMaster.upsert({
    where: { id: 7 },
    update: { title: "Team Admin", code: "TEAM_ADMIN" },
    create: { id: 7, title: "Team Admin", code: "TEAM_ADMIN" }
  });
  await prisma.groupMaster.upsert({
    where: { id: 10 },
    update: { title: "Super Admin", code: "SUPER_ADMIN" },
    create: { id: 10, title: "Super Admin", code: "SUPER_ADMIN" }
  });

  const orgTypes = [
    "Talent Employer",
    "Talent Finder Agency",
    "Venue Owner",
    "Production House"
  ];
  for (const orgType of orgTypes) {
    await prisma.orgTypeMaster.upsert({
      where: { name: orgType },
      update: {},
      create: { name: orgType }
    });
  }

  const tags = [
    "model",
    "actor",
    "singer",
    "makeup-artist",
    "camera-professional",
    "musician",
    "song-writer",
    "script-writer",
    "music-composer"
  ];
  for (const slug of tags) {
    await prisma.tagMaster.upsert({
      where: { slug },
      update: {},
      create: {
        slug,
        title: slug.replace(/-/g, " ")
      }
    });
  }

  await prisma.subscriptionPlanMaster.upsert({
    where: { code: "MSG_MEMBER_100" },
    update: {
      monthlyPriceInr: 100,
      validityDays: 30,
      targetGroupId: 1
    },
    create: {
      code: "MSG_MEMBER_100",
      title: "Messaging - Talent",
      description: "Messaging access for talent members",
      monthlyPriceInr: 100,
      validityDays: 30,
      targetGroupId: 1
    }
  });

  await prisma.subscriptionPlanMaster.upsert({
    where: { code: "MSG_EMPLOYER_300" },
    update: {
      monthlyPriceInr: 300,
      validityDays: 30,
      targetGroupId: 2
    },
    create: {
      code: "MSG_EMPLOYER_300",
      title: "Messaging - Employer/Agency",
      description: "Messaging access for employers and agencies",
      monthlyPriceInr: 300,
      validityDays: 30,
      targetGroupId: 2
    }
  });

  await prisma.subscriptionPlanMaster.upsert({
    where: { code: "JOB_POST_300_90" },
    update: {
      monthlyPriceInr: 300,
      validityDays: 90,
      targetGroupId: 2,
      isJobPostingPlan: true
    },
    create: {
      code: "JOB_POST_300_90",
      title: "Job Posting",
      description: "Single job posting with 90-day validity",
      monthlyPriceInr: 300,
      validityDays: 90,
      targetGroupId: 2,
      isJobPostingPlan: true
    }
  });

  const systemUser = await prisma.userAccount.upsert({
    where: { email: "system-admin@eof.local" },
    update: {},
    create: {
      email: "system-admin@eof.local",
      fullName: "System Admin",
      loginEnabled: true
    }
  });

  await prisma.userRoleLink.upsert({
    where: {
      userId_groupId: {
        userId: systemUser.id,
        groupId: 10
      }
    },
    update: {
      isPrimary: true
    },
    create: {
      userId: systemUser.id,
      groupId: 10,
      isPrimary: true
    }
  });

  const messagingEmployerPlan = await prisma.subscriptionPlanMaster.findUniqueOrThrow({
    where: { code: "MSG_EMPLOYER_300" }
  });

  const existingSubscription = await prisma.userSubscription.findFirst({
    where: {
      userId: systemUser.id,
      planId: messagingEmployerPlan.id,
      purchaseType: PurchaseType.FREE
    }
  });

  if (!existingSubscription) {
    await prisma.userSubscription.create({
      data: {
        userId: systemUser.id,
        planId: messagingEmployerPlan.id,
        purchaseType: PurchaseType.FREE,
        originalExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        lastExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
