import { ChatOpenAI } from '@langchain/openai';
import { OPENAI_API_KEY } from '../global';
import { TaskLibrary } from '../enums/tasks/task-library';
import { ZodObject } from 'zod';
import { TaskMeta } from '../models/tasks/task-meta';
import { log } from 'firebase-functions/logger';
export async function getGeneratedTask(
  description: string,
  library: TaskLibrary,
  zodSchema: ZodObject<any>,
  meta: TaskMeta
): Promise<any> {
  const hasMeta = meta?.JSON != null;
  log('Has Meta', hasMeta);
  const model = new ChatOpenAI(
    {
      model: 'gpt-4o-mini',
      temperature: 0,
    },
    { apiKey: OPENAI_API_KEY.value() }
  );

  const template = `${hasMeta ? getPromptPartFromMeta(library, meta) : `Generate a ${library} schema based on the following description`}
        
        description: ${description}
        `;

  //const prompt =await template.format({description,library});
  const structuredLlm = model.withStructuredOutput(zodSchema, {
    name: library,
  });
  log('typeof Template:', typeof template);
  return structuredLlm.invoke(template);
}

async function getPromptPartFromMeta(library: TaskLibrary, meta: TaskMeta) {
  switch (library) {
    case TaskLibrary.SYNCFUSION_SPREADSHEET:
      return `
        ${JSON.stringify(meta.JSON)} \n \n
        Update the above JSON for Syncfusion Spreadsheet library based on the description provided.
        `;
    case TaskLibrary.SURVEY_JS:
      return `
        ${JSON.stringify(meta.JSON)} \n \n
        Update the above Form JSON for Survey JS library based on the description provided.
        `;
      break;

    case TaskLibrary.LABEL_STUDIO:
      log('Type of config:', typeof meta.JSON.label_config);
      return `
        
        ${meta.JSON.label_config} \n \n
        
        Update the Label Studio XML based on the description provided.
        `;
  }
}
