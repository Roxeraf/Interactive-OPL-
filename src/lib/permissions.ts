import type { OpenItem, Project, ProjectMember } from "@prisma/client";
import type { SessionUser } from "./auth";
import {
  defaultProjectRole,
  isProjectRole,
  noneCapabilities,
  PROJECT_ROLE_META,
  type Capabilities,
  type ProjectRole,
} from "./roles";

export type { Capabilities } from "./roles";

export type MemberLike = Pick<ProjectMember, "role"> | { role: string } | null | undefined;

export function isInternal(user: { role: string }) {
  return user.role === "ADMIN" || user.role === "INTERNAL";
}

export function isAdmin(user: { role: string }) {
  return user.role === "ADMIN";
}

export function isCustomer(user: { role: string }) {
  return user.role === "CUSTOMER";
}

function resolveRole(user: SessionUser, membership: MemberLike): ProjectRole | null {
  if (membership?.role && isProjectRole(membership.role)) return membership.role;
  if (isAdmin(user)) return "PLX_LEAD";
  if (!membership) return null;
  return defaultProjectRole(user.role);
}

export function capabilitiesFor(
  user: SessionUser,
  project: Project,
  membership?: MemberLike,
): Capabilities {
  const role = resolveRole(user, membership);
  if (!role) return noneCapabilities();
  if (PROJECT_ROLE_META[role].group === "plx" && isCustomer(user)) {
    return noneCapabilities();
  }
  if (PROJECT_ROLE_META[role].group === "customer" && isInternal(user)) {
    return noneCapabilities();
  }

  const base = { ...PROJECT_ROLE_META[role].caps, manageUsers: isAdmin(user) };

  if (PROJECT_ROLE_META[role].group === "customer") {
    return {
      ...base,
      create: base.create && project.customerCanCreate,
      edit: base.edit && project.customerCanEdit,
      comment: base.comment && project.customerCanComment,
      changeStatus: base.changeStatus && project.customerCanChangeStatus,
      seeAudit: base.seeAudit && project.customerCanSeeAudit,
      export: base.export && project.customerCanExport,
      seeInternal: false,
      seeInternalOwners: base.seeInternalOwners && project.customerCanSeeInternalOwners,
      manageProject: false,
      internalComment: false,
      manageUsers: false,
    };
  }

  return base;
}

export function canSeeItem(
  item: Pick<OpenItem, "visibility">,
  caps: Capabilities,
) {
  if (caps.seeInternal) return true;
  return item.visibility === "SHARED";
}

export async function getProjectAccess(user: SessionUser, projectId: string) {
  const { prisma } = await import("./db");
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) return null;
  const membership = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId: user.id } },
  });
  if (!membership && !isAdmin(user)) return null;
  return {
    project,
    membership,
    caps: capabilitiesFor(user, project, membership),
  };
}

export async function assertProjectAccess(user: SessionUser, projectId: string) {
  const access = await getProjectAccess(user, projectId);
  return Boolean(access);
}

export function projectWhereFor(user: SessionUser) {
  if (isAdmin(user)) return undefined;
  return { members: { some: { userId: user.id } } };
}
