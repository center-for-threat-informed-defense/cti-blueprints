[![codecov](https://codecov.io/gh/center-for-threat-informed-defense/project-template/branch/main/graph/badge.svg?token=ygDiymg8y3)](https://codecov.io/gh/center-for-threat-informed-defense/project-template)
TODO: Replace with project-specific CodeCov badge

# project_name
Short description of project_name

- [project_name](#project_name)
  - [Questions and Feedback](#questions-and-feedback)
  - [Guidance](#guidance)
    - [Getting Started](#getting-started)
    - [Proposing Changes](#proposing-changes)
    - [Updating Dependencies](#updating-dependencies)
  - [How Do I Contribute?](#how-do-i-contribute)
  - [Notice](#notice)

## Questions and Feedback
Please submit issues for any technical questions/concerns or contact ctid@mitre-engenuity.org directly for more general inquiries.

Also see the guidance for contributors if are you interested in contributing or simply reporting issues.

## Guidance

### Getting Started

The project currently uses Python 3.8, which must be installed prior to project setup.

The following commands may be useful in getting the project setup locally. All commands should be run from the project root directory.

* Build Python virtualenv
  * `make venv`
* Install all development dependencies
  * `make install-dev`
* Activate newly created virtualenv
  * `source .venv/bin/activate`
* Update dependency resolution (after updating appropriate `*.in` file, see _Updating Dependencies_ section below)
  * Runtime dependency update
    * `make requirements.txt`
  * Development dependency update
    * `make requirements/dev.txt`
* Setup pre-commit (required one-time process per local `git clone` repository)
  * `pre-commit install`
* Manually run pre-commit hooks without performing a commit
  * `make pre-commit-run`
* Build container image
  * `make build-container`
* Run linting locally
  * `make lint`
* Run unit tests
  * `make test`




### Proposing Changes

* Please open a [Pull Request](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/about-pull-requests) (PR) against the `main` branch for any desired changes. The PR will be reviewed by the project team.
* Note that all PR checks must pass to be eligible for merge approval.

### Updating Dependencies

1. Add new dependency in either `requirements/requirements.in`, _or_ `requirements/dev.in`, depending on if the new dependency is a runtime or development time dependency, respectively.
2. Run `make requirements.txt` or `make requirements/dev.txt`, depending on the file updated in the previous step.
3. Add all modified files to the changeset (e.g. `requirements.txt`, `requirements/dev.txt`, `requirements/requirements.in`, `requirements/dev.in`).
4. Push the changes.

## How Do I Contribute?
We welcome your feedback and contributions to help advance project_name. Please see the guidance for
contributors if are you interested in [contributing or simply reporting issues.](/CONTRIBUTING.md)

Please submit [issues](https://github.com/center-for-threat-informed-defense/project_name/issues) for any
technical questions/concerns or contact ctid@mitre-engenuity.org directly for more general inquiries.

## Notice
Copyright 2021 MITRE Engenuity. Approved for public release. Document number XXXXX

Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.

This project makes use of ATT&CK®

[ATT&CK Terms of Use](https://attack.mitre.org/resources/terms-of-use/)
