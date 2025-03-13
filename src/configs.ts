
const file_paths = {
  contacts: process.env.CONTACTS_FILE_PATH || './contacts.json',
  contact_groups: process.env.CONTACT_GROUPS_FILE_PATH || './contact_groups.json',
}

const httpd_config = {
  port: process.env.HTTPD_PORT ? parseInt(process.env.HTTPD_PORT) : 3000,
}

const twilio_config = {
  account_sid: process.env.TWILIO_ACCOUNT_SID || '',
  auth_token: process.env.TWILIO_AUTH_TOKEN || '',
  log_level: 'debug',
}


export default { file_paths, httpd_config, twilio_config }
export { file_paths,httpd_config, twilio_config }
