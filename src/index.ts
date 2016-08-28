import * as bodyParser from 'body-parser';
import { Promise } from 'es6-promise';
import * as express from 'express';

import { Error, InvalidRequestError, LanguageUnsupportedError } from './errors';
import { HttpStatusCodes } from './http-status-codes';
import { Request } from './request';
import { Runner } from './runner';
import { langIsSupported } from './supported-languages';

const Port = 80;

let app = express();
let jsonParser = bodyParser.json();

// Allow CORS (Cross-Origin Resource Sharing)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization, Content-Length, X-Requested-With');
  if ('OPTIONS' === req.method) {
    res.sendStatus(HttpStatusCodes.Success);
  } else {
    next();
  }
});

/**
 * See documentation on usage here:
 * https://github.com/Tahler/capstone-api/README.md
 */
app.post('/api', jsonParser, (req, res) => {
  let request: Request = req.body;
  handleRequest(request, res);
});

/**
 * Returns the first found error. If none are found, returns null.
 * Yeah, I hate this design too.
 */
function firstError(request: Request): Error {
  if (!Request.hasRequiredProperties(request)) {
    return new InvalidRequestError(request);
  }
  if (!langIsSupported(request.lang)) {
    return new LanguageUnsupportedError(request.lang);
  }
  return null;
}

async function handleRequest(request: Request, res: express.Response): Promise<void> {
  let err = firstError(request);
  if (err) {
    console.error('err:', JSON.stringify(err));
    res.status(HttpStatusCodes.BadRequest).send(err);
  } else {
    let runner = new Runner(request.lang, request.src, request.timeout, request.tests);
    let result = await runner.run();
    res.status(HttpStatusCodes.Success).send(result);
  }
}

app.listen(Port, () => console.log(`Listening on port ${Port}`));
