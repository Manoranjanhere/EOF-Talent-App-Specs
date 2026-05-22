import { ForbiddenException } from "@nestjs/common";
import { JobsService } from "../src/modules/jobs/jobs.service";

describe("JobsService", () => {
  const prismaMock: any = {
    userRoleLink: { findFirst: jest.fn() },
    userSubscription: { findFirst: jest.fn() },
    tagMaster: { count: jest.fn() },
    jobPosting: { create: jest.fn() }
  };
  const service = new JobsService(prismaMock);
  const audit = { ip: "127.0.0.1", updatedBy: "test" };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("requires employer role", async () => {
    prismaMock.userRoleLink.findFirst.mockResolvedValue(null);
    await expect(
      service.createJob(
        "user-1",
        {
          title: "Model for OTT shoot",
          miniDescription: "Need female model for 2 days",
          primaryTagIds: [],
          secondaryTagIds: []
        } as any,
        audit
      )
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
