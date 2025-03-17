FROM node:22-alpine
ENV NODE_ENV="production"

LABEL org.opencontainers.image.authors="Michael Nowak <michael.nowak@sammatz.de>"
LABEL org.opencontainers.image.source="https://github.com/michaelshof/grafana-to-twilio"
LABEL org.opencontainers.image.version="0.1.0"
LABEL org.opencontainers.image.vendor="Michaelshof Gem gGmbH"
LABEL org.opencontainers.image.licenses="MIT"
LABEL org.opencontainers.image.title="grafana-to-twilio"
LABEL org.opencontainers.image.description="Receives a Grafana Webhook to create a call via Twilio"

USER node:node
WORKDIR /srv/grafana-to-twilio
COPY --chown=node:node dist/src dist/src
COPY --chown=node:node package*.json .

RUN mkdir config \
    && npm install

ENV CONTACTS_FILE_PATH="config/contacts.json"
ENV CONTACT_GROUPS_FILE_PATH="config/contact_groups.json"
ENV TWIML_FILE_PATH="config/twiml.xml.ejs"
ENV HTTPD_PORT="3000"
ENV TWILIO_LOG_LEVEL="info"
VOLUME [ "/srv/grafana-to-twilio/config" ]

EXPOSE 3000/tcp

CMD ["node", "dist/src/index.js"]
