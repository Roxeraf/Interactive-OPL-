"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { getProjectAccess, isAdmin } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import {
  defaultProjectRole,
  isProjectRole,
  PROJECT_ROLE_LABEL,
  rolesForUserKind,
  type ProjectRole,
} from "@/lib/roles";

function revalidateAdmin(projectId?: string) {
  revalidatePath("/admin/users");
  revalidatePath("/admin/customers");
  revalidatePath("/dashboard");
  revalidatePath("/projects");
  if (projectId) {
    revalidatePath(`/projects/${projectId}`);
    revalidatePath(`/projects/${projectId}/settings`);
    revalidatePath(`/projects/${projectId}/audit`);
    revalidatePath(`/admin/users`);
  }
}

async function requireAdmin() {
  const user = await requireUser();
  if (!isAdmin(user)) throw new Error("Nur die Administration darf Benutzer und Kunden steuern.");
  return user;
}

async function requireMemberManager(projectId: string) {
  const user = await requireUser();
  if (isAdmin(user)) return user;
  const access = await getProjectAccess(user, projectId);
  if (!access?.caps.manageProject) {
    throw new Error("Nur Projektleitung oder Administration darf Beteiligte steuern.");
  }
  return user;
}

function initialsFrom(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "X";
  const second = parts[1]?.[0] ?? parts[0]?.[1] ?? "X";
  return (first + second).toUpperCase();
}

const ACCENTS = ["#005acb", "#cf1057", "#002f69", "#289ff5", "#00a9ce", "#014dad"];

function accentFor(name: string) {
  const sum = [...name].reduce((n, ch) => n + ch.charCodeAt(0), 0);
  return ACCENTS[sum % ACCENTS.length];
}

function parseRole(value: string): "ADMIN" | "INTERNAL" | "CUSTOMER" {
  if (value === "ADMIN" || value === "INTERNAL" || value === "CUSTOMER") return value;
  throw new Error("Ungültige Benutzerrolle.");
}

function parseOrgKind(value: string): "PURELOX" | "CUSTOMER" {
  if (value === "PURELOX" || value === "CUSTOMER") return value;
  throw new Error("Ungültiger Organisationstyp.");
}

function parseProjectRole(value: string, userRole: string): ProjectRole {
  if (!isProjectRole(value)) throw new Error("Ungültige Projektrolle.");
  const allowed = rolesForUserKind(userRole);
  if (!allowed.includes(value)) {
    throw new Error("Diese Projektrolle passt nicht zur Person (PureLoX vs. Kunde).");
  }
  return value;
}

export async function createOrganization(input: { name: string; kind: string }) {
  await requireAdmin();
  const name = input.name.trim();
  if (!name) throw new Error("Name der Organisation fehlt.");
  const kind = parseOrgKind(input.kind);
  const org = await prisma.organization.create({ data: { name, kind } });
  revalidateAdmin();
  return { id: org.id };
}

export async function updateOrganization(id: string, input: { name: string; kind: string }) {
  await requireAdmin();
  const name = input.name.trim();
  if (!name) throw new Error("Name der Organisation fehlt.");
  const kind = parseOrgKind(input.kind);
  await prisma.organization.update({ where: { id }, data: { name, kind } });
  await prisma.user.updateMany({ where: { organizationId: id }, data: { organization: name } });
  await prisma.project.updateMany({
    where: { organizationId: id },
    data: { customerName: name },
  });
  revalidateAdmin();
  return { ok: true };
}

export async function createUser(input: {
  name: string;
  email: string;
  password: string;
  role: string;
  title?: string;
  organizationId?: string;
}) {
  await requireAdmin();
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  const password = input.password;
  if (!name || !email) throw new Error("Name und E-Mail sind Pflicht.");
  if (password.length < 8) throw new Error("Passwort mindestens 8 Zeichen.");
  const role = parseRole(input.role);
  const org = input.organizationId
    ? await prisma.organization.findUnique({ where: { id: input.organizationId } })
    : null;
  if (input.organizationId && !org) throw new Error("Organisation nicht gefunden.");
  if (role === "CUSTOMER" && org?.kind !== "CUSTOMER") {
    throw new Error("Kundenkonten gehören zu einem Kundenunternehmen.");
  }
  if (role !== "CUSTOMER" && org?.kind === "CUSTOMER") {
    throw new Error("PureLoX-Konten gehören nicht zu einem Kundenunternehmen.");
  }

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash: await bcrypt.hash(password, 10),
      role,
      title: input.title?.trim() || null,
      organizationId: org?.id ?? null,
      organization: org?.name ?? (role === "CUSTOMER" ? null : "PureLoX SOLUTIONS"),
      initials: initialsFrom(name),
      accent: accentFor(name),
    },
  });
  revalidateAdmin();
  return { id: user.id };
}

export async function updateUser(
  id: string,
  input: {
    name: string;
    email: string;
    role: string;
    title?: string;
    organizationId?: string | null;
    password?: string;
  },
) {
  await requireAdmin();
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  if (!name || !email) throw new Error("Name und E-Mail sind Pflicht.");
  const role = parseRole(input.role);
  const org = input.organizationId
    ? await prisma.organization.findUnique({ where: { id: input.organizationId } })
    : null;
  if (input.organizationId && !org) throw new Error("Organisation nicht gefunden.");
  if (role === "CUSTOMER" && org?.kind !== "CUSTOMER") {
    throw new Error("Kundenkonten gehören zu einem Kundenunternehmen.");
  }
  if (role !== "CUSTOMER" && org?.kind === "CUSTOMER") {
    throw new Error("PureLoX-Konten gehören nicht zu einem Kundenunternehmen.");
  }

  const data: Record<string, unknown> = {
    name,
    email,
    role,
    title: input.title?.trim() || null,
    organizationId: org?.id ?? null,
    organization: org?.name ?? (role === "CUSTOMER" ? null : "PureLoX SOLUTIONS"),
    initials: initialsFrom(name),
  };
  if (input.password?.trim()) {
    if (input.password.length < 8) throw new Error("Passwort mindestens 8 Zeichen.");
    data.passwordHash = await bcrypt.hash(input.password, 10);
  }

  await prisma.user.update({ where: { id }, data });

  const allowedRoles = rolesForUserKind(role);
  const stale = await prisma.projectMember.findMany({
    where: { userId: id, role: { notIn: allowedRoles } },
  });
  if (stale.length > 0) {
    const fallback = defaultProjectRole(role);
    await prisma.projectMember.updateMany({
      where: { userId: id, role: { notIn: allowedRoles } },
      data: { role: fallback },
    });
  }
  revalidateAdmin();
  return { ok: true };
}

export async function assignUserToProject(input: {
  userId: string;
  projectId: string;
  role: string;
}) {
  const actor = await requireMemberManager(input.projectId);
  const user = await prisma.user.findUniqueOrThrow({ where: { id: input.userId } });
  const project = await prisma.project.findUniqueOrThrow({ where: { id: input.projectId } });
  if (user.role === "CUSTOMER" && project.organizationId && user.organizationId !== project.organizationId) {
    throw new Error("Dieser Kundenuser gehört nicht zum Kundenunternehmen des Projekts.");
  }
  const role = parseProjectRole(input.role, user.role);
  await prisma.projectMember.upsert({
    where: { projectId_userId: { projectId: input.projectId, userId: input.userId } },
    create: { projectId: input.projectId, userId: input.userId, role },
    update: { role },
  });
  await logAudit({
    projectId: input.projectId,
    userId: actor.id,
    action: "PERMISSION",
    summary: `${user.name} zugeordnet als ${PROJECT_ROLE_LABEL[role]}`,
  });
  revalidateAdmin(input.projectId);
  revalidatePath(`/admin/users/${input.userId}`);
  return { ok: true };
}

export async function updateMemberRole(input: {
  projectId: string;
  userId: string;
  role: string;
}) {
  const actor = await requireMemberManager(input.projectId);
  const user = await prisma.user.findUniqueOrThrow({ where: { id: input.userId } });
  const role = parseProjectRole(input.role, user.role);
  await prisma.projectMember.update({
    where: { projectId_userId: { projectId: input.projectId, userId: input.userId } },
    data: { role },
  });
  await logAudit({
    projectId: input.projectId,
    userId: actor.id,
    action: "PERMISSION",
    summary: `Rolle von ${user.name}: ${PROJECT_ROLE_LABEL[role]}`,
  });
  revalidateAdmin(input.projectId);
  revalidatePath(`/admin/users/${input.userId}`);
  return { ok: true };
}

export async function removeUserFromProject(input: { projectId: string; userId: string }) {
  const actor = await requireMemberManager(input.projectId);
  const user = await prisma.user.findUnique({ where: { id: input.userId } });
  await prisma.projectMember.delete({
    where: { projectId_userId: { projectId: input.projectId, userId: input.userId } },
  });
  if (user) {
    await logAudit({
      projectId: input.projectId,
      userId: actor.id,
      action: "PERMISSION",
      summary: `${user.name} aus dem Projekt entfernt`,
    });
  }
  revalidateAdmin(input.projectId);
  if (input.userId) revalidatePath(`/admin/users/${input.userId}`);
  return { ok: true };
}

export async function updateProjectCustomer(projectId: string, organizationId: string) {
  const actor = await requireAdmin();
  const org = await prisma.organization.findUniqueOrThrow({ where: { id: organizationId } });
  if (org.kind !== "CUSTOMER") throw new Error("Ein Projekt gehört zu einem Kundenunternehmen.");
  await prisma.project.update({
    where: { id: projectId },
    data: { organizationId: org.id, customerName: org.name },
  });
  await logAudit({
    projectId,
    userId: actor.id,
    action: "PERMISSION",
    summary: `Kunde des Projekts: ${org.name}`,
  });
  revalidateAdmin(projectId);
  return { ok: true };
}
