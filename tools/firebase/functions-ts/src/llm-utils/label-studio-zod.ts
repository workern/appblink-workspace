import { z } from 'zod';

// Annotation schema
const AnnotationSchema = z.object({
  id: z.number(), // Annotation ID
  result: z.array(
    z.object({
      id: z.number(), // Result ID
      type: z.string(), // Type of annotation (e.g., "choices", "rectangle", "polygon")
      from_name: z.string(), // Name of the source label
      to_name: z.string(), // Name of the target
      value: z.record(z.string(), z.any()) // The actual annotation data (e.g., coordinates, labels, etc.)
    })
  ),
  created_at: z.string(), // Annotation creation timestamp
  updated_at: z.string(), // Annotation updated timestamp
  was_cancelled: z.boolean().optional(), // Whether the annotation was canceled
  lead_time: z.number().optional(), // Time taken for annotation
  completed_by: z
    .object({
      id: z.number(), // User ID
      username: z.string() // User's username
    })
    .optional() // User who completed the annotation
});

// Task schema
const TaskSchema = z
  .object({
    id: z.number(), // Task ID
    data: z.any(), // Data related to the task (e.g., text, images)
    annotations: z.array(AnnotationSchema).optional(), // List of annotations related to the task
    predictions: z.array(AnnotationSchema).optional(), // List of predictions
    created_at: z.string(), // Task creation timestamp
    updated_at: z.string() // Task updated timestamp
  })
  .describe('Sample task data for the project that can be annotated');

// Labeling config schema
export const LabelingConfigSchema = z.string(); // Labeling config is typically stored as a string of XML-like HTML

// Settings schema for the project
const ProjectSettingsSchema = z.object({
  label_config: LabelingConfigSchema.describe('Label Configuration in XML'), // Label configuration
  instruction: z.string().optional().describe('Instruction text for annotators') //
});

// Project schema
export const ProjectSchema = z.object({
  id: z.number(), // Project ID
  title: z.string(), // Project title
  description: z.string().optional(), // Project description
  created_at: z.string(), // Project creation date
  updated_at: z.string(), // Project last updated date
  tasks: z.array(TaskSchema).optional(), // List of tasks
  settings: ProjectSettingsSchema // Project settings
});

export const customLabelStudioConfig = z.object({
  project: ProjectSettingsSchema,
  task: TaskSchema
});
