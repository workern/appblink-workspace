import { log } from 'firebase-functions/logger';
import { authenticateOnRequest } from './auth';
import { express } from './global';
import { getTaskData } from './enums/tasks/task-type';
import { FILE_TYPE_CSV } from './constants';
import { Task } from './models/tasks/task';
import { TaskLibrary } from './enums/tasks/task-library';
var cors = require('cors');
const csvparse = require('papaparse');

const downloadSampleFileRouter = express.Router();
export const main = express();

main.use(cors({ origin: true }));
main.use(authenticateOnRequest);
downloadSampleFileRouter.post('/', (req, res) => {
  log('Successfully authenticated');
  let { task, fileType } = req.body;
  const { uid } = req.user;

  if (!uid || !task || !fileType) {
    res.status(400).send('Missing required parameters');
    return;
  }

  task = new Task(task);
  const meta = task.meta;
  if (!meta.variables || !meta.variables.length) {
    res.status(404).send('Dynamic data not found in the project');
    return;
  }
  let response;
  if (
    task.type.library == TaskLibrary.SURVEY_JS ||
    (task.type.library == TaskLibrary.LABEL_STUDIO &&
      fileType == FILE_TYPE_CSV &&
      meta.hasOnlyScalarVariables)
  ) {
    const variables = meta.variables.map((variable) => ({
      name: variable.name,
      id: variable.name,
    }));
    const tasksToSend = [];

    for (let i = 0; i < 1; i++) {
      // Creating two rows of sample data
      const task = {};
      variables.forEach((header) => {
        // Ensuring the variable is enclosed in quotes by using double quotes inside the template string
        task[header.name] = `Sample <${header.name}>`;
      });
      tasksToSend.push(task);
    }
    response = tasksToSend;

    response = csvparse.unparse(
      {
        fields: variables.map((v) => v.name),
        data: tasksToSend,
      },
      {
        headers: true,
      }
    );
  } else if (task.type.library == TaskLibrary.LABEL_STUDIO) {
    const sample = getTaskData(task.type.value, task.type.template).sample_task
      ?.data;
    if (sample) {
      response = JSON.stringify([sample], null, 2);
    } else {
      res.status(404).send('Sample task not found');
      return;
    }
  } else {
    res.status(404).send('Invalid task type');
    return;
  }

  res.setHeader(
    'Content-Type',
    fileType == FILE_TYPE_CSV ? 'text/csv' : 'application/json'
  );
  res.setHeader('Content-Disposition', 'attachment; filename="sample.csv"');
  res.send(response);
});

main.use('/', downloadSampleFileRouter);
