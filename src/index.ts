import {
  type Extension,
  Category,
  AuthorType,
} from '@awell-health/extensions-core'
import { bigQuery } from './actions'
import { settings } from './settings'

const Waypoint: Extension = {
  key: 'waypoint',
  title: 'Waypoint',
  description: 'Private extension for the Waypoint team',
  icon_url:
    'https://res.cloudinary.com/da7x4rzl4/image/upload/v1741300613/waypoint-logo.jpg',
  category: Category.WORKFLOW,
  author: {
    authorType: AuthorType.AWELL,
  },
  settings,
  actions: {
    bigQuery,
  },
  webhooks: [],
}

export default Waypoint
