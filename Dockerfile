FROM n8nio/n8n:latest

COPY ./dist/nodes /data/nodes
COPY ./dist/credentials /data/credentials
ENV N8N_CUSTOM_EXTENSIONS="/data/nodes:/data/credentials"