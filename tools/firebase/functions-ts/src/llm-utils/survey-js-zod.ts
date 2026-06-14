import { z } from 'zod';

// Define the Zod schema for a single element (question)
const elementSchema = z.object({
  type: z.enum([
    'text',
    'comment',
    'checkbox',
    'radiogroup',
    'dropdown',
    'rating',
    'boolean',
    'file',
    'signaturepad',
    'ranking',
    'imagepicker',
    'multipletext',
    'matrix',
    'matrixdynamic',
    'matrixdropdown',
    'html',
    'tagbox',
    'expression',
    'paneldynamic',
  ]), // Supported question types
  name: z.string().nonempty(), // Element name must be a non-empty string
  title: z.string().optional(), // Element title (optional)
  choices: z.array(z.string()).optional(), // Optional array of choices for types like 'radiogroup'
  isRequired: z.boolean().optional(), // Optional flag to indicate if the question is required
});

// Define the schema for a single page
const pageSchema = z.object({
  name: z.string().nonempty(), // Page name must be a non-empty string
  elements: z.array(elementSchema), // Array of elements/questions
});

// Define the Zod schema for the entire SurveyJS form
export const surveyJsSchema = z.object({
  title: z.string().optional(), // Survey title (optional)
  pages: z
    .array(pageSchema)
    .min(1, 'The survey must contain at least one page'), // At least one page
});

// Example function to validate LLM output
const validateSurveyOutput = (data: any) => {
  try {
    surveyJsSchema.parse(data); // Validate against the schema
    console.log('Validation passed.');
  } catch (error) {
    console.error('Validation failed:', error); // Log validation errors
  }
};
