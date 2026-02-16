import { prisma } from "@/lib/prisma";
import { slugify, uniqueSuffix } from "@/lib/slug";

type SetupWorkspaceInput = {
  userId: string;
  workspaceName: string;
  appName: string;
  iosBundleId?: string;
  androidPackageName?: string;
  appStoreId?: string;
  playStoreId?: string;
};

export async function setupWorkspaceForUser(input: SetupWorkspaceInput) {
  const existingMembership = await prisma.workspaceMember.findFirst({
    where: { userId: input.userId },
    include: {
      workspace: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (existingMembership) {
    return existingMembership.workspace;
  }

  const slugBase = slugify(input.workspaceName) || "workspace";
  const slug = `${slugBase}-${uniqueSuffix(6)}`;

  return prisma.$transaction(async (tx) => {
    const workspace = await tx.workspace.create({
      data: {
        name: input.workspaceName.trim(),
        slug,
      },
    });

    await tx.workspaceMember.create({
      data: {
        userId: input.userId,
        workspaceId: workspace.id,
        role: "OWNER",
      },
    });

    await tx.mobileApp.create({
      data: {
        workspaceId: workspace.id,
        name: input.appName.trim(),
        iosBundleId: input.iosBundleId?.trim() || null,
        androidPackageName: input.androidPackageName?.trim() || null,
        appStoreId: input.appStoreId?.trim() || null,
        playStoreId: input.playStoreId?.trim() || null,
      },
    });

    return workspace;
  });
}

