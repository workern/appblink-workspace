const Handlebars = require('handlebars');
export class TranslatedMessage {
  public template: string;

  constructor(message: string) {
    this.template = message;
  }

  value(params: any) {
    return Handlebars.compile(this.template)(params);
  }
}
