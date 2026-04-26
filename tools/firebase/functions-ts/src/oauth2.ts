import { log } from 'firebase-functions/logger';
import { admin, deployOptions, express } from './global';
import { authenticateOnRequest } from './auth';
import { onRequest } from 'firebase-functions/v2/https';
var cors = require('cors');
const request = require('request');
const url = require('url');
// Create Express instance

const oAuth2Router = express.Router();
const main = express();

main.use(cors({ origin: true }));

// Define the /login endpoint
oAuth2Router.get('/login', (req, res) => {
  const query = req.query;
  log('/login query', query);
  if (query) {
    const urlWithCode = url.format({
      pathname: 'https://offerings.workern.com/login',
      query: { ...query },
    });
    return res.status(200).redirect(urlWithCode);
  }
  return res.status(500).send('>> No response');
});

oAuth2Router.post('/auth', (req, res) => {
  const { uid, redirect_uri, state } = req.body;
  log('/auth body', req.body);
  authenticateOnRequest(req, res, (req, res) => {
    if (res.headersSent) {
      log('Response has already been sent.');
      return;
    }

    log(
      'Authenticated request, now creating custom token',
      'is res defined?',
      res != null
    );
    return admin
      .auth()
      .createCustomToken(uid)
      .then((authToken) => {
        log('Custom token', authToken);
        const urlWithCode = url.format({
          pathname: redirect_uri,
          query: { state, code: authToken },
        });
        return res.status(200).send({ url: urlWithCode });
      })
      .catch((error) => {
        console.log('Error : ', error);
        res.status(500).send({ error });
      });
  });
});
//accounts.google.com/o/oauth2/v2/auth/oauthchooseaccount?client_id=927538837578.apps.googleusercontent.com&state=cL_UN654QES252UHmc1Yy1aSJXaPgiA5fM9alq9a3sk&redirect_uri=https%3A%2F%2Fzapier.com%2Fdashboard%2Fauth%2Foauth%2Freturn%2FGoogleMailV2CLIAPI%2F&response_type=code&access_type=offline&prompt=consent&scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fgmail.compose%20https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fgmail.modify%20email&_zapier_auth_id=48239336&service=lso&o2v=2&ddm=0&flowName=GeneralOAuthFlow
https: oAuth2Router.post('/access', (req, res) => {
  const { client_id, code } = req.body;
  log('/access body', req.body);
  const options = {
    method: 'POST',
    url: `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${client_id}`,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    form: {
      token: code,
      returnSecureToken: 'true',
    },
    json: true,
  };
  return request(options, (error, response) => {
    if (error) {
      console.log('>> Error getting Access Token:', error);
      return res.status(500).send({ error });
    }
    log('Access request response', response.body);
    const access_token = response.body.idToken;
    const refresh_token = response.body.refreshToken;
    return res.status(200).send({
      access_token,
      refresh_token,
      expires_in: response.body.expiresIn,
      token_type: 'Bearer',
      id_token: access_token,
    });
  });
});

oAuth2Router.post('/refresh', (req, res) => {
  const { refresh_token, client_id } = req.body;
  log('Refresh request body', refresh_token);
  log('Client ID', client_id);
  const options = {
    method: 'POST',
    url: `https://securetoken.googleapis.com/v1/token?key=${client_id}`,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    form: {
      refresh_token: refresh_token,
      grant_type: 'refresh_token',
    },
    json: true,
  };
  return request(options, (error, response) => {
    if (error) {
      console.log('>> Error getting Access Token:', error);
      return res.status(500).send({ error });
    }
    log('Refresh request response', response.body);
    const access_token = response.body.id_token;
    const refresh_token = response.body.refresh_token;

    return res.status(200).send({
      access_token,
      refresh_token,
      expires_in: response.body.expires_in,
      token_type: 'Bearer',
      id_token: access_token,
      aud: ['theia-cloud', 'zapier'],
    });
  });
});

oAuth2Router.get('/return/:appId', (req, res) => {
  log('Return for app', req.params.appId);
  log('Return query', req.query);
});

// Use the router on the main app
main.use('/', oAuth2Router);

// Export the Cloud Function named 'oauth2'
export const oauth2 = onRequest(
  { timeoutSeconds: 240, memory: '8GiB', ...deployOptions },
  main
);
