# syntax=docker/dockerfile:1

# Build Python base image
FROM python:3.8-bullseye as python

# OCI labels
LABEL "org.opencontainers.image.title"="project_name"
LABEL "org.opencontainers.image.url"="https://ctid.mitre-engenuity.org/"

RUN mkdir /app && \
    python -m venv /app/.venv && \
    /app/.venv/bin/python -m pip install -U pip wheel setuptools

ENV LC_ALL=C.UTF-8 LANG=C.UTF-8 \
    PATH=/app/.venv/bin:${PATH}

WORKDIR /app

# common python base stage, specific app stage
FROM python as app-build

COPY requirements.txt ./
COPY requirements ./requirements
COPY setup.cfg setup.py ./
COPY . ./
RUN --mount=type=cache,target=/root/.cache \
    python -m pip install -r requirements.txt -r requirements/dev.txt && \
    python -m pip install --no-deps -e .

# CMD /app/.venv/bin/python
