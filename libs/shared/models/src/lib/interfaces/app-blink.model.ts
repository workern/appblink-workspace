import { Base } from './base.model';

// ─── Task ─────────────────────────────────────────────────────────────────────

export type TaskStatus = 'created' | 'working' | 'workCompleted' | 'merged';
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

export interface AppBlinkTask extends Base {
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
  /** ID of the machine this task should run on. */
  machineId?: string;
  /** Branch strategy: run on current machine branch or switch to task-specific branch. */
  branchMode?: TaskBranchMode;
  /** UID of the workspace member this task is assigned to. */
  assignedToUid?: string;
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
  createdAt: string;
  updatedAt: string;
}
