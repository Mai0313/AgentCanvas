FROM node:lts-alpine3.21 AS builder

LABEL maintainer="Wei Lee <mai@mai0313.com>" \
    org.label-schema.name="agentcanvas" \
    org.label-schema.vendor="Wei Lee" \
    org.label-schema.schema-version="1.0" \
    com.centurylinklabs.watchtower.stop-signal="SIGINT"

########################################################################################

FROM builder AS prod
WORKDIR /app
COPY . .
RUN yarn install && \
    yarn build && \
    yarn cache clean
