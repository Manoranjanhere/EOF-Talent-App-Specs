import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { CreateTagDto } from "./dto/create-tag.dto";

type AuditData = {
  ip: string;
  updatedBy: string;
};

@Injectable()
export class TagsService {
  constructor(private readonly prisma: PrismaService) {}

  listPublished() {
    return this.prisma.tagMaster.findMany({
      where: { published: true, isActive: true },
      orderBy: { title: "asc" }
    });
  }

  listAll() {
    return this.prisma.tagMaster.findMany({
      orderBy: [{ published: "desc" }, { title: "asc" }]
    });
  }

  create(dto: CreateTagDto, audit: AuditData) {
    return this.prisma.tagMaster.create({
      data: {
        slug: dto.slug,
        title: dto.title,
        published: true,
        isActive: true,
        lastUpdateIp: audit.ip,
        lastUpdateBy: audit.updatedBy
      }
    });
  }
}
