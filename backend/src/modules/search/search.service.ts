import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { MemberSearchQuery } from "./dto/member-search.query";
import { JobSearchQuery } from "./dto/job-search.query";

@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

  async searchMembers(query: MemberSearchQuery) {
    const page = query.page ?? 1;
    const pageSize = Math.min(query.pageSize ?? 20, 100);
    const tagIds = query.tagIds?.split(",").map((tag) => tag.trim()).filter(Boolean) ?? [];

    const where = {
      isActive: true,
      city: query.city,
      country: query.country,
      gender: query.gender,
      roles: query.groupId
        ? {
            some: {
              groupId: query.groupId,
              isActive: true
            }
          }
        : undefined,
      profileTags: tagIds.length
        ? {
            some: {
              tagId: { in: tagIds },
              isActive: true
            }
          }
        : undefined
    };

    const [items, total] = await Promise.all([
      this.prisma.userAccount.findMany({
        where,
        include: {
          roles: true,
          profileTags: {
            where: { isActive: true },
            include: { tag: true }
          }
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { lastUpdateAt: "desc" }
      }),
      this.prisma.userAccount.count({ where })
    ]);

    return {
      page,
      pageSize,
      total,
      cards: items.map((item) => ({
        id: item.id,
        title: item.fullName,
        subtitle: `${item.city ?? ""} ${item.country ?? ""}`.trim(),
        rating: item.ratingAverage,
        tags: item.profileTags.map((link) => link.tag.title),
        roleIds: item.roles.map((r) => r.groupId)
      }))
    };
  }

  async searchJobs(query: JobSearchQuery) {
    const page = query.page ?? 1;
    const pageSize = Math.min(query.pageSize ?? 20, 100);
    const tagIds = query.tagIds?.split(",").map((tag) => tag.trim()).filter(Boolean) ?? [];

    const where = {
      isActive: true,
      validTill: { gte: new Date() },
      city: query.city,
      country: query.country,
      gender: query.gender,
      tags: tagIds.length
        ? {
            some: {
              tagId: { in: tagIds },
              isActive: true
            }
          }
        : undefined
    };

    const [items, total] = await Promise.all([
      this.prisma.jobPosting.findMany({
        where,
        include: {
          postedBy: true,
          tags: {
            where: { isActive: true },
            include: { tag: true }
          }
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: "desc" }
      }),
      this.prisma.jobPosting.count({ where })
    ]);

    return {
      page,
      pageSize,
      total,
      cards: items.map((item) => ({
        id: item.id,
        title: item.title,
        subtitle: item.miniDescription,
        location: `${item.city ?? ""} ${item.country ?? ""}`.trim(),
        payRange: [item.payRangeMin, item.payRangeMax],
        validTill: item.validTill,
        tags: item.tags.map((tagLink) => tagLink.tag.title),
        postedBy: item.postedBy.fullName
      }))
    };
  }
}
