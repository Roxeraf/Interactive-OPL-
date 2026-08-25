import type { OpenItem, Project } from "@prisma/client";
import type { SessionUser } from "./auth";

export type Capabilities = {
  create: boolean;
  edit: boolean;
  comment: boolean;
  changeStatus: boolean;
  seeAudit: boolean;
  export: boolean;
  seeInternal: boolean;
  seeInternalOwners: boolean;
  manageProject: boolean;
  manageUsers: boolean;
  internalComment: boolean;
};

export function isInternal(user: { role: string }) {
  return user.role === "ADMIN" || user.role === "INTERNAL";
}

export function isAdmin(user: { role: string }) {
  return user.role === "ADMIN";
}

export function isCustomer(user: { role: string }) {
  return user.role === "CUSTOMER";
}

export function capabilitiesFor(
  user: SessionUser,
  project: Project,
): Capabilities {
  if (isInternal(user)) {
    return {
      create: true,
      edit: true,
      comment: true,
      changeStatus: true,
      seeAudit: true,
      export: true,
      seeInternal: true,
      seeInternalOwners: true,
      manageProject: true,
      manageUsers: isAdmin(user),
      internalComment: true,
    };
  }

  return {
    create: project.customerCanCreate,
    edit: project.customerCanEdit,
    comment: project.customerCanComment,
    changeStatus: project.customerCanChangeStatus,
    seeAudit: project.customerCanSeeAudit,
    export: project.customerCanExport,
    seeInternal: false,
    seeInternalOwners: project.customerCanSeeInternalOwners,
    manageProject: false,
    manageUsers: false,
    internalComment: false,
  };
}

export function canSeeItem(
  user: SessionUser,
  item: Pick<OpenItem, "visibility">,
) {
  if (isInternal(user)) return true;
  return item.visibility === "SHARED";
}

export async function assertProjectAccess(
  user: SessionUser,
  projectId: string,
) {
  if (isAdmin(user)) return true;
  const { prisma } = await import("./db");
  const member = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId: user.id } },
  });
  return Boolean(member);
}
