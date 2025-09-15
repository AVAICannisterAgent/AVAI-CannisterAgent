
FROM python:3.11-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    git \
    build-essential \
    unzip \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Create dfx directory
RUN mkdir -p /root/.local/share/dfx/bin

# Download and install DFX manually
ENV DFX_VERSION=0.22.0
RUN curl -fsSL https://github.com/dfinity/sdk/releases/download/${DFX_VERSION}/dfx-${DFX_VERSION}-x86_64-linux.tar.gz \
    | tar -xz -C /root/.local/share/dfx/bin \
    && chmod +x /root/.local/share/dfx/bin/dfx

# Add to PATH
ENV PATH="/root/.local/share/dfx/bin:$PATH"

WORKDIR /workspace

# Copy requirements and install dependencies
COPY requirements-simple.txt ./
RUN pip install --no-cache-dir -r requirements-simple.txt

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

EXPOSE 8080
