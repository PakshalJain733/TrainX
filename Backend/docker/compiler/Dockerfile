# TrainX secure code runner image
# Provides compilers/runtimes for C, C++, Java, Python and JavaScript inside an
# isolated, non-privileged container. User code is never executed on the host.
#
# Build (run from the repository root):
#   docker build -t trainx-code-runner ./Backend/docker/compiler
FROM node:20-bookworm-slim

# Install compilers / runtimes required by the supported languages.
RUN apt-get update && apt-get install -y --no-install-recommends \
      gcc \
      g++ \
      openjdk-17-jdk-headless \
      python3 \
      python3-pip \
      ca-certificates \
      procps \
    && rm -rf /var/lib/apt/lists/*

# Create an unprivileged user that executes /opt/runner.sh inside containers.
RUN useradd --create-home --uid 10001 --shell /bin/sh codeuser

COPY runner.sh /opt/runner.sh
RUN chmod +x /opt/runner.sh && chown codeuser:codeuser /opt/runner.sh

# The workspace is bind-mounted read/write from the Node.js host.
WORKDIR /workspace

# Never run as root.
USER codeuser

ENTRYPOINT ["/opt/runner.sh"]