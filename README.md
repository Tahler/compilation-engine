# Capstone API

This is the compilation API for NU Code, my capstone project.

Technologies:
- TypeScript / Express to define the API succinctly.
- Docker to contain user-submitted code.
- Firebase for storing data and user authentication.
- Gulp for building and automation.

## Interface

For details on how to send requests and what responses to expect, read
[here](https://github.com/Tahler/capstone-api/blob/master/doc/api.md).

## Supported Languages

A list of all the supported languages can be found
[here](https://github.com/Tahler/capstone-api/blob/master/doc/supported-languages.md).

## Firebase and Credentials

NU Code utilizes Firebase for storing data and user authentication. This API will needs access to
the Firebase instance.

Git is deliberately ignoring the credentials folder, which holds the Firebase server credentials
needed to access the Firebase instance. Running this project as is will require a Firebase server
with a legal [schema](https://github.com/Tahler/capstone-api/blob/master/doc/example-schema.json)
and the credentials to access it.

## Building

As this API is meant to run in a docker container, [Docker](https://www.docker.com/) must be
installed with the docker binary added to the system path. See Docker's official installation
instructions [here](https://docs.docker.com/engine/installation/).
As this API is meant to run in a docker container, Docker must be installed with the docker
binary added to the system path. See Docker's official installation instructions
[here](https://docs.docker.com/engine/installation/).
