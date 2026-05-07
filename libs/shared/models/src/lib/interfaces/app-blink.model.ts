import { Base } from './base.model';

// ─── Actors & Machines ────────────────────────────────────────────────────────

export interface TaskActor {
  uid: string;
  email?: string;
  displayName?: string;
  mobile?: string;
}

export interface TaskMachine {
  id: string;
  name: string;
}

export interface TaskActorWithMachine {
  user?: TaskActor;
  machine?: TaskMachine;
  /** Client that created/ran the task, e.g. 'VS Code', 'Flutter', 'Web'. */
  source?: string;
}

// ─── Task ─────────────────────────────────────────────────────────────────────

export type TaskStatus =
  | 'created'
  | 'working'
  | 'workCompleted'
  | 'merged'
  | 'failed';
export type VibeCheckStatus = 'not-checked-yet' | 'passed' | 'failed';

export interface TaskBranch {
  name: string;
}

export interface ContextFile {
  path: string;
}

/** Whether to run a task on the same branch the machine has checked out, or
 *  stash/commit current changes and switch to a dedicated task branch. */
export type TaskBranchMode = 'same' | 'separate';

/**
 * Which branch the task will execute on:
 * - 'execution'  – the branch the machine already has checked out when it runs the task
 * - 'current'    – the branch that was active when the task was created
 * - 'new-serial' – a new auto-generated branch (e.g. appid-task-42)
 */
export type TaskBranchChoice = 'execution' | 'current' | 'new-serial';

export interface AppBlinkTask extends Base<string> {
  description: string;
  branch: TaskBranch;
  originBranch?: string;
  status: TaskStatus;
  contextFiles: ContextFile[];
  images?: string[];
  vibeCheckStatus?: VibeCheckStatus;
  archived?: boolean;
  startedRunningTaskAt?: string;
  stoppedRunningTaskAt?: string;
  completedRunningTaskAt?: string;
  markCompletedAt?: string;
  vibeCheckPassedAt?: string;
  vibeCheckFailedAt?: string;
  mergedAt?: string;
  /** Firebase project ID — identifies which repo/workspace owns this task. */
  workspaceId?: string;
  /** ID of the machine this task should run on. */
  machineId?: string;
  /** Branch strategy: run on current machine branch or switch to task-specific branch. */
  branchMode?: TaskBranchMode;
  /** Which branch the task will execute on. Supersedes branchMode when present. */
  branchChoice?: string;
  /** Branch name captured at task-creation time (used when branchChoice = 'current'). */
  creationBranch?: string;
  /**
   * When true, contextFiles was set by the user via the preset selector.
   * An empty contextFiles + this flag = "no context" (user chose nothing).
   * Absent or false = legacy task, fall back to app.contextPaths.
   */
  contextFilesExplicitlySet?: boolean;
  /** Workspace member this task belongs to (owner, reviewer, gets notified). */
  assignedTo?: TaskActor;
  /** Who created this task and on which machine. */
  createdBy?: TaskActorWithMachine;
  /** Who started running this task and on which machine. */
  startedBy?: TaskActorWithMachine;
  /**
   * The `updatedAt` value at the time this task was last pulled from Firestore.
   * Used by the extension to detect remote deletions and local edits since last sync.
   */
  syncedWithFirestoreAt?: string;
  /**
   * When true, the vibe check must pass before the task can be marked as complete.
   * The extension will automatically run vibe checks after the agent finishes and
   * only call commitAndComplete once the agent signals `passed`.
   */
  requireVibeCheckBeforeComplete?: boolean;
}

// ─── VibeCheck ────────────────────────────────────────────────────────────────

export type FileExtensionTarget =
  | 'all'
  | 'ts'
  | 'html'
  | 'css'
  | 'scss'
  | 'js'
  | 'dart'
  | 'json'
  | 'yaml'
  | 'yml'
  | 'md'
  | 'custom';

export type CheckLevel =
  | 'global'
  | 'app'
  | 'framework'
  | 'framework-global'
  | 'regex';

export interface CheckScope {
  level: CheckLevel;
  appId?: string;
  framework?: 'angular' | 'flutter' | 'vscode-extension';
  appPath?: string;
  pathPattern?: string;
}

export interface AppBlinkVibeCheck extends Base {
  title: string;
  description?: string;
  fileExtensions: FileExtensionTarget[] | 'all';
  scope: CheckScope;
  enabled: boolean;
}

// ─── Machine ──────────────────────────────────────────────────────────────────

export type MachineStatus = 'AVAILABLE' | 'BUSY' | 'OFFLINE';

export interface AppMachine {
  /** Unique identifier — typically the machine hostname. */
  id: string;
  /** Human-readable display name (defaults to hostname). */
  name: string;
  status: MachineStatus;
  /** OS platform: 'darwin' | 'linux' | 'win32' */
  platform: string;
  hostname: string;
  /** ISO-8601 timestamp of the last heartbeat. */
  lastHeartbeatAt: string;
  /** ID of the task currently running on this machine (when BUSY). */
  activeTaskId?: string;
  /** Branch the machine currently has checked out. */
  activeBranch?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Workspace ────────────────────────────────────────────────────────────────

/** A workspace membership record stored under users/{uid}/mySpaces/app-blink/memberships. */
export interface AppBlinkWorkspaceMembership {
  workspaceId: string;
  workspaceDocId: string;
  name: string;
  role: 'owner' | 'admin' | 'member';
  functionalRoles?: string[];
  capabilities?: string[];
  spaces?: string[] | null;
}

/** A space (app) within a workspace. */
export interface AppBlinkWorkspaceSpace {
  spaceId: string;
  name: string;
  updatedAt?: string;
}

// ─── Commands ─────────────────────────────────────────────────────────────────

/**
 * All registered appblink.* VS Code command IDs.
 * Angular uses these to build the VSCODE_COMMAND payload.
 * Extension security guard allows only these prefixed commands.
 */
export const APP_BLINK_VSCODE_COMMANDS = {
  // Tasks
  REFRESH_TODOS: 'appblink.tasks.refreshTodos',
  // Apps
  CREATE_APP: 'appblink.createApp',
  DELETE_APP: 'appblink.deleteApp',
  REFRESH_APPS: 'appblink.refreshApps',
  // Tests
  GENERATE_TEST: 'appblink.generateTest',
  RUN_TESTS: 'appblink.runTests',
  CONFIGURE_TESTS: 'appblink.configureTests',
  // Firebase
  START_EMULATORS: 'appblink.startEmulators',
  STOP_EMULATORS: 'appblink.stopEmulators',
  FIRESTORE_RULES_EDIT: 'appblink.firestoreRulesEdit',
  STORAGE_RULES_FETCH: 'appblink.storageRulesFetch',
  STORAGE_RULES_EDIT: 'appblink.storageRulesEdit',
  STORAGE_RULES_DEPLOY: 'appblink.storageRulesDeploy',
  // Docs
  DOCS_SETUP_PUBLISH: 'appblink.docs.setupPublish',
  DOCS_EMBED_IN_APP: 'appblink.docs.embedInApp',
  // Links
  OPEN_IMPORTANT_LINKS: 'appblink.openImportantLinks',
  ADD_IMPORTANT_LINK: 'appblink.addImportantLink',
  // Misc
  DOCTOR: 'appblink.doctor',
  SETUP_WORKSPACE: 'appblink.setupWorkspace',
  ADD_MCP_SERVER: 'appblink.addMcpServer'
} as const;

export type AppBlinkVscodeCommandId =
  (typeof APP_BLINK_VSCODE_COMMANDS)[keyof typeof APP_BLINK_VSCODE_COMMANDS];

export type AppBlinkCommandType =
  | 'RUN_TASK'
  | 'RUN_VIBE_CHECK'
  | 'DEPLOY'
  | 'OPEN_FILE'
  | 'VSCODE_COMMAND';
export type AppBlinkCommandStatus =
  | 'PENDING'
  | 'RUNNING'
  | 'SUCCESS'
  | 'FAILED'
  | 'CANCELLED';

/** A command sent to a machine via Firestore. */
export interface AppBlinkCommand {
  id: string;
  workspaceId: string;
  type: AppBlinkCommandType;
  status: AppBlinkCommandStatus;
  machineId: string | null;
  payload: Record<string, unknown>;
  requestedBy?: { uid: string };
  createdAt: string;
  updatedAt: string;
  result: string | null;
  error: string | null;
}
