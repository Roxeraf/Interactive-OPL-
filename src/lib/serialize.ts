import type { Attachment, Comment, OpenItem, Project, User } from "@prisma/client";
import type { SessionUser } from "./auth";
import type { Capabilities } from "./permissions";
import { previewKind, type PreviewKind } from "./file-meta";

export type Person = {
  id: string;
  name: string;
  initials: string;
  accent: string;
  role: string;
  title: string | null;
  organization: string | null;
  email: string;
};

export type ClientComment = {
  id: string;
  body: string;
  isInternal: boolean;
  createdAt: string;
  user: Person;
};

export type ClientAttachment = {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  createdAt: string;
  preview: PreviewKind;
  uploadedBy: Person;
};

export type ClientItem = {
  id: string;
  projectId: string;
  number: number;
  title: string;
  description: string;
  measure: string;
  resolution: string;
  category: string;
  priority: string;
  status: string;
  visibility: string;
  source: string;
  capturedAt: string;
  dueDate: string | null;
  resolvedAt: string | null;
  ownerInternal: Person | null;
  ownerCustomer: Person | null;
  createdBy: Person;
  updatedAt: string;
  comments: ClientComment[];
  attachments: ClientAttachment[];
};

export type ClientProject = {
  id: string;
  code: string;
  name: string;
  customerName: string;
  description: string | null;
  status: string;
  site: string | null;
  createdAt: string;
  customerCanCreate: boolean;
  customerCanEdit: boolean;
  customerCanComment: boolean;
  customerCanChangeStatus: boolean;
  customerCanSeeAudit: boolean;
  customerCanExport: boolean;
  customerCanSeeInternalOwners: boolean;
};

export type ClientAudit = {
  id: string;
  action: string;
  field: string | null;
  oldValue: string | null;
  newValue: string | null;
  summary: string;
  createdAt: string;
  itemNumber: number | null;
  itemTitle: string | null;
  user: Person;
};

export function toPerson(user: Pick<User, "id" | "name" | "initials" | "accent" | "role" | "title" | "organization" | "email">): Person {
  return {
    id: user.id,
    name: user.name,
    initials: user.initials,
    accent: user.accent,
    role: user.role,
    title: user.title,
    organization: user.organization,
    email: user.email,
  };
}

export function serializeItem(
  item: OpenItem & {
    ownerInternal: User | null;
    ownerCustomer: User | null;
    createdBy: User;
    comments: (Comment & { user: User })[];
    attachments: (Attachment & { uploadedBy: User })[];
  },
  caps: Capabilities,
): ClientItem {
  const comments = item.comments
    .filter((c) => caps.internalComment || !c.isInternal)
    .map((c) => ({
      id: c.id,
      body: c.body,
      isInternal: c.isInternal,
      createdAt: c.createdAt.toISOString(),
      user: toPerson(c.user),
    }));

  const attachments = item.attachments.map((file) => ({
    id: file.id,
    filename: file.filename,
    mimeType: file.mimeType,
    size: file.size,
    createdAt: file.createdAt.toISOString(),
    preview: previewKind(file.mimeType, file.filename),
    uploadedBy: toPerson(file.uploadedBy),
  }));

  return {
    id: item.id,
    projectId: item.projectId,
    number: item.number,
    title: item.title,
    description: item.description,
    measure: item.measure,
    resolution: item.resolution,
    category: item.category,
    priority: item.priority,
    status: item.status,
    visibility: item.visibility,
    source: item.source,
    capturedAt: item.capturedAt.toISOString(),
    dueDate: item.dueDate?.toISOString() ?? null,
    resolvedAt: item.resolvedAt?.toISOString() ?? null,
    ownerInternal: caps.seeInternalOwners && item.ownerInternal
      ? toPerson(item.ownerInternal)
      : caps.seeInternalOwners
        ? null
        : item.ownerInternal
          ? { ...toPerson(item.ownerInternal), name: "Internes Team", email: "", title: null }
          : null,
    ownerCustomer: item.ownerCustomer ? toPerson(item.ownerCustomer) : null,
    createdBy: toPerson(item.createdBy),
    updatedAt: item.updatedAt.toISOString(),
    comments,
    attachments,
  };
}

export function serializeProject(project: Project): ClientProject {
  return {
    id: project.id,
    code: project.code,
    name: project.name,
    customerName: project.customerName,
    description: project.description,
    status: project.status,
    site: project.site,
    createdAt: project.createdAt.toISOString(),
    customerCanCreate: project.customerCanCreate,
    customerCanEdit: project.customerCanEdit,
    customerCanComment: project.customerCanComment,
    customerCanChangeStatus: project.customerCanChangeStatus,
    customerCanSeeAudit: project.customerCanSeeAudit,
    customerCanExport: project.customerCanExport,
    customerCanSeeInternalOwners: project.customerCanSeeInternalOwners,
  };
}

export type WorkspacePayload = {
  user: SessionUser;
  project: ClientProject;
  items: ClientItem[];
  members: Person[];
  caps: Capabilities;
};
