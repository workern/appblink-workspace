import { Timestamp } from 'firebase-admin/firestore';
import { EducationLevel } from '../enums/demographics/education-level';
import { EmploymentStatus } from '../enums/demographics/employment-status';
import { Gender } from '../enums/demographics/gender';
import { MaritalStatus } from '../enums/demographics/marital-status';
import { calculateAge } from '../ui-utils';
import { isEnumValue } from '../javascript-utils';

export class Demographics {
  public age: number;
  public birthCountry: string;
  public currentCountry: string;
  public dateOfBirth: Timestamp;
  public educationLevel: EducationLevel;
  public employmentStatus: EmploymentStatus;
  public gender: Gender;
  public industry: string;
  public maritalStatus: MaritalStatus;

  constructor(params) {
    if (params) {
      if (this.dateOfBirth) {
        if (typeof this.dateOfBirth === 'string') {
          this.dateOfBirth = Timestamp.fromDate(new Date(this.dateOfBirth));
        }
        this.age = calculateAge(this.dateOfBirth);
      }
      this.birthCountry = params.birthCountry;
      this.currentCountry = params.currentCountry;
      if (isEnumValue(params.educationLevel, EducationLevel)) {
        this.educationLevel = params.educationLevel;
      }
      if (isEnumValue(params.employmentStatus, EmploymentStatus)) {
        this.employmentStatus = params.employmentStatus;
      }
      if (isEnumValue(params.educationLevel, EducationLevel)) {
        this.educationLevel = params.educationLevel;
      }
      if (isEnumValue(params.gender, Gender)) {
        this.gender = params.gender;
      }
      if (isEnumValue(params.maritalStatus, MaritalStatus)) {
        this.maritalStatus = params.maritalStatus;
      }
      this.industry = params.industry;
    }
  }

  public forFirestore() {}
}
