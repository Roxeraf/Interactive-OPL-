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

export const PROJECT_ROLES = [
  "PLX_LEAD",
  "PLX_MEMBER",
  "PLX_VIEWER",
  "CUSTOMER_LEAD",
  "CUSTOMER_EDITOR",
  "CUSTOMER_COMMENTER",
  "CUSTOMER_VIEWER",
] as const;

export type ProjectRole = (typeof PROJECT_ROLES)[number];

export const ORG_KINDS = ["PURELOX", "CUSTOMER"] as const;
export type OrgKind = (typeof ORG_KINDS)[number];

export const PROJECT_ROLE_META: Record<
  ProjectRole,
  {
    label: string;
    short: string;
    group: "plx" | "customer";
    help: string;
    caps: Omit<Capabilities, "manageUsers">;
  }
> = {
  PLX_LEAD: {
    label: "Projektleitung (PureLoX)",
    short: "Leitung",
    group: "plx",
    help: "Voller Zugriff inkl. interner Punkte, Protokoll und Mitgliederverwaltung.",
    caps: {
      create: true,
      edit: true,
      comment: true,
      changeStatus: true,
      seeAudit: true,
      export: true,
      seeInternal: true,
      seeInternalOwners: true,
      manageProject: true,
      internalComment: true,
    },
  },
  PLX_MEMBER: {
    label: "Projektteam (PureLoX)",
    short: "Team",
    group: "plx",
    help: "Arbeitet in der OPL inkl. interner Notizen, ohne Mitglieder zu steuern.",
    caps: {
      create: true,
      edit: true,
      comment: true,
      changeStatus: true,
      seeAudit: true,
      export: true,
      seeInternal: true,
      seeInternalOwners: true,
      manageProject: false,
      internalComment: true,
    },
  },
  PLX_VIEWER: {
    label: "Einsicht (PureLoX)",
    short: "Einsicht",
    group: "plx",
    help: "Sieht das Projekt inkl. interner Punkte, darf aber nichts ändern.",
    caps: {
      create: false,
      edit: false,
      comment: false,
      changeStatus: false,
      seeAudit: true,
      export: true,
      seeInternal: true,
      seeInternalOwners: true,
      manageProject: false,
      internalComment: false,
    },
  },
  CUSTOMER_LEAD: {
    label: "Kunden-Projektleitung",
    short: "Leitung",
    group: "customer",
    help: "Maximale Kundenrechte in diesem Projekt — begrenzt durch die Kunden-Höchstgrenzen.",
    caps: {
      create: true,
      edit: true,
      comment: true,
      changeStatus: true,
      seeAudit: true,
      export: true,
      seeInternal: false,
      seeInternalOwners: true,
      manageProject: false,
      internalComment: false,
    },
  },
  CUSTOMER_EDITOR: {
    label: "Kunde bearbeiten",
    short: "Bearbeiten",
    group: "customer",
    help: "Darf geteilte Punkte anlegen und bearbeiten, sofern das Projekt das zulässt.",
    caps: {
      create: true,
      edit: true,
      comment: true,
      changeStatus: true,
      seeAudit: false,
      export: false,
      seeInternal: false,
      seeInternalOwners: true,
      manageProject: false,
      internalComment: false,
    },
  },
  CUSTOMER_COMMENTER: {
    label: "Kunde kommentieren",
    short: "Kommentieren",
    group: "customer",
    help: "Sieht geteilte Punkte und darf den Verlauf ergänzen.",
    caps: {
      create: false,
      edit: false,
      comment: true,
      changeStatus: false,
      seeAudit: false,
      export: false,
      seeInternal: false,
      seeInternalOwners: true,
      manageProject: false,
      internalComment: false,
    },
  },
  CUSTOMER_VIEWER: {
    label: "Kunde lesen",
    short: "Lesen",
    group: "customer",
    help: "Nur Einsicht in geteilte Punkte, ohne Kommentare oder Änderungen.",
    caps: {
      create: false,
      edit: false,
      comment: false,
      changeStatus: false,
      seeAudit: false,
      export: false,
      seeInternal: false,
      seeInternalOwners: true,
      manageProject: false,
      internalComment: false,
    },
  },
};

export const PROJECT_ROLE_LABEL: Record<ProjectRole, string> = Object.fromEntries(
  PROJECT_ROLES.map((role) => [role, PROJECT_ROLE_META[role].label]),
) as Record<ProjectRole, string>;

export function isProjectRole(value: string): value is ProjectRole {
  return (PROJECT_ROLES as readonly string[]).includes(value);
}

export function rolesForUserKind(userRole: string): ProjectRole[] {
  return userRole === "CUSTOMER"
    ? PROJECT_ROLES.filter((role) => PROJECT_ROLE_META[role].group === "customer")
    : PROJECT_ROLES.filter((role) => PROJECT_ROLE_META[role].group === "plx");
}

export function defaultProjectRole(userRole: string): ProjectRole {
  if (userRole === "ADMIN") return "PLX_LEAD";
  if (userRole === "CUSTOMER") return "CUSTOMER_COMMENTER";
  return "PLX_MEMBER";
}

export function noneCapabilities(): Capabilities {
  return {
    create: false,
    edit: false,
    comment: false,
    changeStatus: false,
    seeAudit: false,
    export: false,
    seeInternal: false,
    seeInternalOwners: false,
    manageProject: false,
    manageUsers: false,
    internalComment: false,
  };
}
