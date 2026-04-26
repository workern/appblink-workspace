import { SkillAssessmentType } from '../enums/skill-assessment-type';
import { Task } from './tasks/task';

export class SkillAssessment {
  public type: SkillAssessmentType = SkillAssessmentType.NO_TEST;
  public test: Task[] = [];
}
