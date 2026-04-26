import { Reward } from '../reward';

export class SpaceMemberStats {
  submittedOfferingsCount: number = 0;
  acceptedOfferingsCount: number = 0;
  returnedOfferingsCount: number = 0;
  approvedOfferingsCount: number = 0;
  earned: Reward;
  timeSpentWorkingInMinutes: number = 0;
  timeSpentWithinInMinutes: number = 0;
  constructor(data?: any) {
    this.earned = { currency: 'INR', symbol: '₹', value: 0, type: 'fixed' };
    if (data) {
      this.submittedOfferingsCount = data.submittedOfferingsCount || 0;
      this.acceptedOfferingsCount = data.acceptedOfferingsCount || 0;
      this.returnedOfferingsCount = data.returnedOfferingsCount || 0;
      this.approvedOfferingsCount = data.approvedOfferingsCount || 0;
      this.earned = data.earned ?? this.earned;
      this.timeSpentWorkingInMinutes = data.timeSpentWorkingInMinutes || 0;
      this.timeSpentWithinInMinutes = data.timeSpentWithinInMinutes || 0;
    }
  }

  forFirestore() {
    const data: any = Object.assign({}, this);
    return data;
  }
}
