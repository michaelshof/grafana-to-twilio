module.exports = {
  apps: [{
    name: 'grafana-to-twilio',
    script: 'dist/src/index.js',
    env: {
      NODE_ENV: 'production',

      CONTACTS_FILE_PATH: 'config/contacts.json',
      CONTACT_GROUPS_FILE_PATH: 'config/contact_groups.json',
      TWIML_FILE_PATH: 'config/twiml.xml.ejs',

      HTTPD_PORT: '3000',
    }
  }],

  deploy: {
    production: {
      user: 'michaelshof',
      host: 'server.michaelshof.local',
      ref: 'origin/main',
      repo: 'https://github.com/michaelshof/grafana-to-twilio.git',
      path: '/srv/grafana-to-twilio',
      'pre-setup': '',
      'post-setup': '/srv/grafana-to-twilio/shared/post-setup.sh',
      'pre-deploy': '/srv/grafana-to-twilio/shared/pre-deploy.sh',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-deploy-local': '',
    }
  }
}
