import fs from 'node:fs'

import { Contacts, ContactGroups } from './types'

function ensure_file_paths_exist(file_paths: Record<string, string>) {
  for (const file_path_id in file_paths) {
    const file_path = file_paths[file_path_id]

    if (file_path.length === 0) {
      throw new Error(`${file_path_id} file path is not set`)
    }
    if (!fs.existsSync(file_path)) {
      throw new Error(`${file_path_id} file path does not exist: ${file_path}`)
    }
  }
}

function ensure_contacts_valid(contacts: Contacts) {
  if (Object.keys(contacts).length === 0) {
    throw new Error('No contacts defined')
  }
}

function ensure_contact_groups_valid(contact_groups: ContactGroups, contacts: Contacts) {
  for (const contact_group_id in contact_groups) {
    const contact_group = contact_groups[contact_group_id]
    if (contact_group.length === 0) continue

    for (const contact_id of contact_group) {
      if (contact_id in contacts) continue

      throw new Error(`Unknown contact ${contact_id} in contact group ${contact_group_id}`)
    }
  }
}

export default { ensure_file_paths_exist, ensure_contacts_valid, ensure_contact_groups_valid }
export { ensure_file_paths_exist, ensure_contacts_valid, ensure_contact_groups_valid }
