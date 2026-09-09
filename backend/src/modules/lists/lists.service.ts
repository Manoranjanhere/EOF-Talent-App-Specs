import {
  BadRequestException,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import { GroupId } from "@eof/shared";
import { resolveProfilePhotos } from "../../common/profile-photos";
import { PrismaService } from "../../database/prisma.service";
import { StorageService } from "../storage/storage.service";

type AuditData = { ip: string; updatedBy: string };

const ADMIN_GROUP_IDS = [GroupId.Admin, GroupId.TeamAdmin, GroupId.SuperAdmin];

export const LIST_TITLE_SUGGESTIONS = [
  "Content Creator",
  "Influencer",
  "Fashion Model",
  "Make Up Artist",
  "Production",
  "Sound Artist",
  "Camera Artist",
  "Script Editor",
  "Actor",
  "Dancer",
  "Stylist",
  "Good talent",
  "Colleagues",
  "Team",
  "Competitors"
];

@Injectable()
export class ListsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService
  ) {}

  suggestions() {
    return LIST_TITLE_SUGGESTIONS;
  }

  listMine(ownerUserId: string) {
    return this.prisma.peopleList.findMany({
      where: { ownerUserId, isActive: true },
      include: { _count: { select: { members: { where: { isActive: true } } } } },
      orderBy: { lastUpdateAt: "desc" }
    });
  }

  async create(ownerUserId: string, title: string, audit: AuditData) {
    const trimmed = title.trim();
    if (!trimmed) throw new BadRequestException("List name is required");
    return this.prisma.peopleList.create({
      data: {
        ownerUserId,
        title: trimmed,
        lastUpdateIp: audit.ip,
        lastUpdateBy: audit.updatedBy
      }
    });
  }

  async update(ownerUserId: string, id: string, title: string, audit: AuditData) {
    await this.requireOwned(ownerUserId, id);
    const trimmed = title.trim();
    if (trimmed.length < 2) throw new BadRequestException("List name is required");
    return this.prisma.peopleList.update({
      where: { id },
      data: {
        title: trimmed,
        lastUpdateIp: audit.ip,
        lastUpdateBy: audit.updatedBy
      }
    });
  }

  async remove(ownerUserId: string, id: string, audit: AuditData) {
    await this.requireOwned(ownerUserId, id);
    await this.prisma.peopleList.update({
      where: { id },
      data: { isActive: false, lastUpdateIp: audit.ip, lastUpdateBy: audit.updatedBy }
    });
    await this.prisma.peopleListMember.updateMany({
      where: { listId: id, isActive: true },
      data: { isActive: false, lastUpdateIp: audit.ip, lastUpdateBy: audit.updatedBy }
    });
    return { ok: true };
  }

  async getOne(
    ownerUserId: string,
    id: string,
    query: { q?: string; tagIds?: string }
  ) {
    await this.requireOwned(ownerUserId, id);
    const tagIds = query.tagIds?.split(",").map((t) => t.trim()).filter(Boolean) ?? [];
    const name = query.q?.trim();

    const members = await this.prisma.peopleListMember.findMany({
      where: {
        listId: id,
        isActive: true,
        member: {
          isActive: true,
          ...(name
            ? { fullName: { contains: name, mode: "insensitive" as const } }
            : {}),
          ...(tagIds.length
            ? {
                profileTags: {
                  some: { tagId: { in: tagIds }, isActive: true }
                }
              }
            : {})
        }
      },
      include: {
        member: {
          include: {
            roles: { where: { isActive: true } },
            profileTags: { where: { isActive: true }, include: { tag: true } }
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    const list = await this.prisma.peopleList.findUnique({ where: { id } });
    const photos = await resolveProfilePhotos(
      this.prisma,
      this.storage,
      members.map((row) => row.member.id)
    );
    return {
      ...list,
      members: members.map((row) => {
        const photo = photos.get(row.member.id);
        return {
          id: row.id,
          userId: row.member.id,
          fullName: row.member.fullName,
          city: row.member.city,
          country: row.member.country,
          ratingAverage: row.member.ratingAverage,
          tags: row.member.profileTags.map((l) => l.tag.title),
          roleIds: row.member.roles.map((r) => r.groupId),
          profilePhotoUrl: photo?.url ?? null,
          profilePhotoObjectKey: photo?.objectKey ?? null
        };
      })
    };
  }

  async addMember(ownerUserId: string, listId: string, memberUserId: string, audit: AuditData) {
    await this.requireOwned(ownerUserId, listId);
    if (memberUserId === ownerUserId) {
      throw new BadRequestException("You cannot add yourself");
    }
    const member = await this.prisma.userAccount.findFirst({
      where: {
        id: memberUserId,
        isActive: true,
        NOT: {
          roles: { some: { groupId: { in: ADMIN_GROUP_IDS }, isActive: true } }
        }
      }
    });
    if (!member) throw new NotFoundException("Member not found");

    return this.prisma.peopleListMember.upsert({
      where: { listId_memberUserId: { listId, memberUserId } },
      create: {
        listId,
        memberUserId,
        lastUpdateIp: audit.ip,
        lastUpdateBy: audit.updatedBy
      },
      update: {
        isActive: true,
        lastUpdateIp: audit.ip,
        lastUpdateBy: audit.updatedBy
      }
    });
  }

  async removeMember(
    ownerUserId: string,
    listId: string,
    memberUserId: string,
    audit: AuditData
  ) {
    await this.requireOwned(ownerUserId, listId);
    await this.prisma.peopleListMember.updateMany({
      where: { listId, memberUserId, isActive: true },
      data: { isActive: false, lastUpdateIp: audit.ip, lastUpdateBy: audit.updatedBy }
    });
    return { ok: true };
  }

  private async requireOwned(ownerUserId: string, id: string) {
    const list = await this.prisma.peopleList.findFirst({
      where: { id, ownerUserId, isActive: true }
    });
    if (!list) throw new NotFoundException("List not found");
    return list;
  }
}
