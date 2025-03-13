interface Contact {
  phone_number: string
}
type Contacts = { [id: string]: Contact }

type ContactGroup = Array<string>
type ContactGroups = { [id: string]: ContactGroup }

export { Contacts, ContactGroups }
