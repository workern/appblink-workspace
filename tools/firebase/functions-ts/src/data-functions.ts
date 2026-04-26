import { onRequest } from 'firebase-functions/v2/https';
import { deployOptions } from './global';
import { countries as countriesList } from './data/countries';

export const countries = onRequest(deployOptions, (req, res) => {
  res.send(countriesList);
});
