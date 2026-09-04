import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import {
  canSeeItem,
  getProjectAccess,
} from "@/lib/permissions";
import { serializeItem, serializeProject, toPerson } from "@/lib/serialize";
import { OplWorkspace } from "@/components/opl-workspace";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const access = await getProjectAccess(user, id);
  if (!access) notFound();

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      members: { include: { user: true } },
      items: {
        include: {
          ownerInternal: true,
          ownerCustomer: true,
          createdBy: true,
          comments: { include: { user: true }, orderBy: { createdAt: "asc" } },
          attachments: { include: { uploadedBy: true }, orderBy: { createdAt: "asc" } },
        },
        orderBy: { number: "asc" },
      },
    },
  });
  if (!project) notFound();

  const caps = access.caps;
  const items = project.items.filter((i) => canSeeItem(i, caps)).map((i) => serializeItem(i, caps));

  return (
    <OplWorkspace
      payload={{
        user,
        project: serializeProject(project),
        items,
        members: project.members.map((m) => toPerson(m.user)),
        caps,
      }}
    />
  );
}
