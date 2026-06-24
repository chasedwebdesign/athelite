export interface EmailTemplate {
  id: string;
  name: string;
  isPremium: boolean;
  subject: string;
  body: string;
}

import { trackAndFieldTemplates } from './track';
import { xcTemplates } from './xc'; // NEW IMPORT
import { swimTemplates } from './swim';
import { footballTemplates } from './football';
import { soccerTemplates } from './soccer';
import { lacrosseTemplates } from './lacrosse';
import { fieldHockeyTemplates } from './fieldhockey';
import { basketballTemplates } from './basketball';
import { volleyballTemplates } from './volleyball';
import { wrestlingTemplates } from './wrestling';
import { baseballTemplates } from './baseball';
import { softballTemplates } from './softball';
import { golfTemplates } from './golf';
import { tennisTemplates } from './tennis';
import { iceHockeyTemplates } from './icehockey';
import { waterPoloTemplates } from './waterpolo';
import { gymnasticsTemplates } from './gymnastics';
import { bowlingTemplates } from './bowling';
import { fencingTemplates } from './fencing';

// Fallback templates for unsupported or brand new sports
const defaultTemplates: EmailTemplate[] = [
  {
    id: 'generic_intro',
    name: 'General Introduction',
    isPremium: false,
    subject: 'Recruit Prospect: {{FIRST_NAME}} {{LAST_NAME}} - Class of {{GRAD_YEAR}}',
    body: `Coach,\n\nMy name is {{FIRST_NAME}} {{LAST_NAME}} and I am a class of {{GRAD_YEAR}} {{SPORT}} athlete at {{HIGH_SCHOOL}}. I am reaching out because {{COLLEGE_NAME}} is one of my top target schools.\n\n{{WHY_THIS_SCHOOL}}\n\nHere are my most recent metrics:\n{{SELECTED_PRS}}\n\nI am carrying a {{GPA}} GPA and plan to pursue a degree in {{MAJOR}}. I take my academics just as seriously as my athletics.\n\nI have linked my profile and highlights below for you to review.\nHighlight Tape: {{HIGHLIGHT_VIDEO_LINK}}\n\n{{UPCOMING_MEET}}\n\nI would love to learn more about your recruiting standards and see if I might be a good fit for the team.\n\nThank you for your time,\n\n{{FIRST_NAME}} {{LAST_NAME}}\n{{HIGH_SCHOOL}} | Class of {{GRAD_YEAR}}\nProfile: {{PROFILE_LINK}}`
  }
];

export const getTemplatesForSport = (sport: string): EmailTemplate[] => {
  switch (sport.toLowerCase()) {
    case 'cross country': // NOW ROUTES TO XC SPECIFIC FILE
    case 'xc':
      return xcTemplates;
    case 'track & field':
    case 'track':
      return trackAndFieldTemplates;
    case 'swimming & diving':
    case 'swimming':
    case 'swim':
      return swimTemplates;
    case 'football':
      return footballTemplates;
    case 'soccer':
      return soccerTemplates;
    case 'lacrosse':
      return lacrosseTemplates;
    case 'field hockey':
      return fieldHockeyTemplates;
    case 'basketball':
      return basketballTemplates;
    case 'volleyball':
      return volleyballTemplates;
    case 'wrestling':
      return wrestlingTemplates;
    case 'baseball':
      return baseballTemplates;
    case 'softball':
      return softballTemplates;
    case 'golf':
      return golfTemplates;
    case 'tennis':
      return tennisTemplates;
    case 'ice hockey':
      return iceHockeyTemplates;
    case 'water polo':
      return waterPoloTemplates;
    case 'gymnastics':
      return gymnasticsTemplates;
    case 'bowling':
      return bowlingTemplates;
    case 'fencing':
      return fencingTemplates;
    default:
      return defaultTemplates;
  }
};