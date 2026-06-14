export class Fee {
  public userFee: number = 0;
  public platformFee: number = 0;
  public totalFee: number = 0;
  transactionPurpose: string;
  constructor(transactionPurpose: string, userFee?: number) {
    this.transactionPurpose = transactionPurpose;
    this.userFee = userFee | 0.0;
    this.platformFee = 0.0;
    this.totalFee = userFee | 0.0;
  }
}
