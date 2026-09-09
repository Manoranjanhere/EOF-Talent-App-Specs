import { PrismaService } from "../database/prisma.service";
import { StorageService } from "../modules/storage/storage.service";

export type ProfilePhotoMeta = {
  url: string | null;
  objectKey: string | null;
};

export async function resolveProfilePhotos(
  prisma: PrismaService,
  storage: StorageService,
  userIds: string[]
): Promise<Map<string, ProfilePhotoMeta>> {
  const unique = [...new Set(userIds.filter(Boolean))];
  const result = new Map<string, ProfilePhotoMeta>();
  if (unique.length === 0) return result;

  const photos = await prisma.mediaAsset.findMany({
    where: {
      ownerUserId: { in: unique },
      isProfilePhoto: true,
      isActive: true
    }
  });

  const photoByUserId = new Map<string, (typeof photos)[0]>();
  for (const photo of photos) {
    if (!photoByUserId.has(photo.ownerUserId)) {
      photoByUserId.set(photo.ownerUserId, photo);
    }
  }

  await Promise.all(
    unique.map(async (id) => {
      const photo = photoByUserId.get(id);
      result.set(id, {
        url: photo ? await storage.getReadUrl(photo.objectKey) : null,
        objectKey: photo?.objectKey ?? null
      });
    })
  );

  return result;
}
