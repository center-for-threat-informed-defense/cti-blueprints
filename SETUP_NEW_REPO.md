# Setup of new repository after clone

**NOTE**: Docker has naming restrictions on project names.

Per the Docker documentation on [naming limitations](https://docs.docker.com/engine/reference/commandline/tag/):

```
Name components may contain lowercase letters, digits and separators. A separator is defined as a period, one or two underscores, or one or more dashes. A name component may not start or end with a separator.

A tag name must be valid ASCII and may contain lowercase and uppercase letters, digits, underscores, periods and dashes. A tag name may not start with a period or a dash and may contain a maximum of 128 characters.
```

## Step 1: Replace generic `project_name` with your project name

After creating a new repository from this template, make the following changes, replacing all occurrences of `project_name` with your actual project's name.

1. `Dockerfile`
   1. `line 7:LABEL "org.opencontainers.image.title"="project_name"`
2. `Makefile`
   1. `line 5:APP_NAME := project_name`
3. `tests/test_check_palindrome.py`
   1. `line 3:from project_name import check_palindrome`
4. `README.md`
   1. `line 4:# project_name`
   2. `line 5:Short description of project_name`
   3. `line 7:- [project_name](#project_name)`
   4. `line 67:We welcome your feedback and contributions to help advance project_name.`
   5. `line 70:Please submit [issues](https://github.com/center-for-threat-informed-defense/project_name/issues) for any`
5. `CONTRIBUTING.md`
   1. `line 5:Thanks for contributing to project_name!`
6. `setup.cfg`
   1. `line 2:name = project_name`
   2. `line 4:description = Short description of project_name`
   3. `line 7:url = https://github.com/center-for-threat-informed-defense/project_name`

## Step 2: Rename `src/project_name` directory

Next, rename the `src/project_name` directory, and set to the same name used above. For example, for a project named `my_new_app`, rename `src/project_name` to `src/my_new_app`.

## Step 3: Done

Done! You can now delete this file from your new project repository!
