interface Contact {
  phone_number: string
  timeout?: number
}
type Contacts = Record<string, Contact>

type ContactGroup = Array<string>
type ContactGroups = Record<string, ContactGroup>

interface FilePaths {
  contacts: string
  contact_groups: string
  twiml_ejs: string
}

interface HttpdConfig {
  bearer_token: string
  port: number
  rate_window_call: number
  rate_limit_call: number
}

interface TwilioCredentials {
  account_sid: string
  auth_token: string
  phone_number: string
}

interface TwilioConfig extends TwilioCredentials {
  log_level: string
  timeout: number
}

export { Contact, Contacts, ContactGroups, ContactGroup, FilePaths, HttpdConfig, TwilioCredentials, TwilioConfig }
