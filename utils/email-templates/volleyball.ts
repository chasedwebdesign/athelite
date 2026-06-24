import { EmailTemplate } from './index';

export const volleyballTemplates: EmailTemplate[] = [
  {
    id: 'vb_free_intro',
    name: 'Standard Intro',
    isPremium: false,
    subject: '{{GRAD_YEAR}} {{POSITION}} Recruit - {{FIRST_NAME}} {{LAST_NAME}}',
    body: `Coach,\n\nMy name is {{FIRST_NAME}} {{LAST_NAME}}, a class of {{GRAD_YEAR}} {{POSITION}} from {{HIGH_SCHOOL}}. I am extremely interested in the {{COLLEGE_NAME}} volleyball program and wanted to formally introduce myself.\n\n{{WHY_THIS_SCHOOL}}\n\nI currently maintain a {{GPA}} GPA and plan to major in {{MAJOR}}. I am looking for a high-level academic and athletic environment.\n\nPlease find my most recent highlight tape and full match footage linked below:\nFilm: {{HIGHLIGHT_VIDEO_LINK}}\n\nMy current measurables/stats:\n{{SELECTED_PRS}}\n\n{{UPCOMING_MEET}}\n\nI would love the opportunity to speak with you about the {{GRAD_YEAR}} recruiting class and see if I might be a fit for your roster.\n\nThank you,\n\n{{FIRST_NAME}} {{LAST_NAME}}\n{{HIGH_SCHOOL}} | Class of {{GRAD_YEAR}}\nProfile: {{PROFILE_LINK}}`
  },
  {
    id: 'vb_pro_tournament',
    name: 'Club Tournament Schedule',
    isPremium: true,
    subject: 'Tournament Schedule: {{FIRST_NAME}} {{LAST_NAME}} ({{GRAD_YEAR}} {{POSITION}})',
    body: `Coach,\n\nI hope your season is going great. I am {{FIRST_NAME}} {{LAST_NAME}}, a {{GRAD_YEAR}} {{POSITION}} playing for {{HIGH_SCHOOL}} and my club team. I wanted to share my upcoming club tournament schedule in case your staff will be recruiting at any of my events.\n\n{{UPCOMING_MEET}}\n\n{{WHY_THIS_SCHOOL}}\n\nBefore the tournament, you can view my latest highlights and metrics here:\nFilm: {{HIGHLIGHT_VIDEO_LINK}}\n\nI am very focused on academics as well, carrying a {{GPA}} GPA with an interest in {{MAJOR}}. I would be thrilled to have you watch me play live.\n\nBest,\n\n{{FIRST_NAME}} {{LAST_NAME}}\nProfile: {{PROFILE_LINK}}`
  },
  {
    id: 'vb_pro_full_match',
    name: 'Full Match Footage Update',
    isPremium: true,
    subject: 'Unedited Match Footage: {{FIRST_NAME}} {{LAST_NAME}} ({{GRAD_YEAR}} {{POSITION}})',
    body: `Coach,\n\nI am {{FIRST_NAME}} {{LAST_NAME}}, a {{GRAD_YEAR}} {{POSITION}} from {{HIGH_SCHOOL}}. I know that as a college coach, you often prefer to see unedited film rather than just highlights. I recently uploaded full sets from my last tournament.\n\nFull Match Link: {{HIGHLIGHT_VIDEO_LINK}}\n\n{{WHY_THIS_SCHOOL}}\n\nMy current jumping metrics and stats are:\n{{SELECTED_PRS}}\n\nI carry a {{GPA}} GPA and plan to study {{MAJOR}}. {{UPCOMING_MEET}}\n\nI would love to get your feedback on my court movement and decision-making.\n\nBest regards,\n\n{{FIRST_NAME}} {{LAST_NAME}}\nProfile: {{PROFILE_LINK}}`
  },
  {
    id: 'vb_pro_camp',
    name: 'Camp Registration',
    isPremium: true,
    subject: 'Registered for Camp! - {{FIRST_NAME}} {{LAST_NAME}} ({{GRAD_YEAR}})',
    body: `Coach,\n\nI am thrilled to let you know that I have officially registered for your upcoming prospect camp at {{COLLEGE_NAME}}. \n\n{{WHY_THIS_SCHOOL}}\n\nBefore I get on campus, I wanted to provide my latest film so you have a baseline of my playing style as a {{POSITION}}:\nFilm: {{HIGHLIGHT_VIDEO_LINK}}\n\nMy current stats/measurables are:\n{{SELECTED_PRS}}\n\nI am a {{GPA}} GPA student, and I am coming to camp ready to work and prove I can compete at your level. See you on the court.\n\nBest,\n\n{{FIRST_NAME}} {{LAST_NAME}}\nProfile: {{PROFILE_LINK}}`
  },
  {
    id: 'vb_pro_academic',
    name: 'Academic Update',
    isPremium: true,
    subject: 'Academic Update: {{FIRST_NAME}} {{LAST_NAME}} - C/O {{GRAD_YEAR}}',
    body: `Coach,\n\nI am reaching out to provide a quick academic update. I just finished the semester and am proud to share that I have improved my GPA to a {{GPA}}. Knowing the academic reputation of {{COLLEGE_NAME}}, I want to ensure you know I am a serious student looking to major in {{MAJOR}}.\n\nOn the court, my stats are currently:\n{{SELECTED_PRS}}\n\nFilm: {{HIGHLIGHT_VIDEO_LINK}}\n\n{{UPCOMING_MEET}}\n\nI would love the opportunity to learn more about the academic support available to your student-athletes.\n\nBest regards,\n\n{{FIRST_NAME}} {{LAST_NAME}}\nProfile: {{PROFILE_LINK}}`
  },
  {
    id: 'vb_pro_visit',
    name: 'Unofficial Visit Request',
    isPremium: true,
    subject: 'Campus Visit Request - {{FIRST_NAME}} {{LAST_NAME}} ({{GRAD_YEAR}})',
    body: `Coach,\n\nMy name is {{FIRST_NAME}} {{LAST_NAME}}, a {{GRAD_YEAR}} {{POSITION}} from {{HIGH_SCHOOL}}. I am planning a trip to the area soon and would absolutely love the opportunity to take an unofficial visit to {{COLLEGE_NAME}}.\n\n{{WHY_THIS_SCHOOL}}\n\nI carry a {{GPA}} GPA and am very interested in the {{MAJOR}} program. For a quick look at my playstyle, here is my latest film:\nFilm: {{HIGHLIGHT_VIDEO_LINK}}\n\nPlease let me know if you or an assistant might have 10 minutes to meet, or if there is a better date for me to visit campus.\n\nThank you,\n\n{{FIRST_NAME}} {{LAST_NAME}}\nProfile: {{PROFILE_LINK}}`
  },
  {
    id: 'vb_pro_assistant',
    name: 'Direct to Assistant Coach',
    isPremium: true,
    subject: '{{GRAD_YEAR}} {{POSITION}} Prospect: {{FIRST_NAME}} {{LAST_NAME}}',
    body: `Coach,\n\nI am {{FIRST_NAME}} {{LAST_NAME}}, a {{GRAD_YEAR}} {{POSITION}} playing for {{HIGH_SCHOOL}}. I am specifically reaching out to you to get on your recruiting radar as I know you handle a lot of the evaluations for my position.\n\n{{WHY_THIS_SCHOOL}}\n\nI am a hardworking, highly coachable {{POSITION}} with a {{GPA}} GPA. My latest tape is linked here:\nFilm: {{HIGHLIGHT_VIDEO_LINK}}\n\nMetrics/Stats:\n{{SELECTED_PRS}}\n\nI would love to hop on a quick call to discuss what you are looking for in the {{GRAD_YEAR}} recruiting cycle.\n\nBest,\n\n{{FIRST_NAME}} {{LAST_NAME}}\nProfile: {{PROFILE_LINK}}`
  },
  {
    id: 'vb_pro_congrats',
    name: 'Congrats on Big Match',
    isPremium: true,
    subject: 'Great win this weekend! - {{FIRST_NAME}} {{LAST_NAME}} ({{GRAD_YEAR}})',
    body: `Coach,\n\nI wanted to send a quick note to congratulate the team on the massive win this past weekend. Watching the squad play with that level of intensity and defensive execution is exactly why {{COLLEGE_NAME}} is my dream school.\n\n{{WHY_THIS_SCHOOL}}\n\nI am working hard in the gym to play at that level. My latest film is here: {{HIGHLIGHT_VIDEO_LINK}}\n\nI hold a {{GPA}} GPA and will be following the rest of your season closely. Good luck down the stretch!\n\nBest,\n\n{{FIRST_NAME}} {{LAST_NAME}}\nProfile: {{PROFILE_LINK}}`
  },
  {
    id: 'vb_pro_walkon',
    name: 'Walk-On / DS Spot Inquiry',
    isPremium: true,
    subject: 'Walk-On Inquiry: {{FIRST_NAME}} {{LAST_NAME}} ({{GRAD_YEAR}} {{POSITION}})',
    body: `Coach,\n\nMy name is {{FIRST_NAME}} {{LAST_NAME}}, a {{GRAD_YEAR}} {{POSITION}} out of {{HIGH_SCHOOL}}. {{COLLEGE_NAME}} is my absolute top choice for academics (I am pursuing a degree in {{MAJOR}} with a {{GPA}} GPA).\n\n{{WHY_THIS_SCHOOL}}\n\nI am reaching out to express my intense interest in earning a walk-on spot on your roster. I am a gritty, team-first player who will push the starters every day in practice.\n\nFilm: {{HIGHLIGHT_VIDEO_LINK}}\n\nI would love to learn more about your walk-on tryout process or what you need to see from me to earn an invite.\n\nThank you,\n\n{{FIRST_NAME}} {{LAST_NAME}}\nProfile: {{PROFILE_LINK}}`
  },
  {
    id: 'vb_pro_followup',
    name: 'Gentle Follow-Up',
    isPremium: true,
    subject: 'Following Up - {{FIRST_NAME}} {{LAST_NAME}} ({{GRAD_YEAR}} {{POSITION}})',
    body: `Coach,\n\nI know you have a packed schedule, so I just wanted to send a brief follow-up regarding my interest in the {{COLLEGE_NAME}} volleyball program.\n\n{{WHY_THIS_SCHOOL}}\n\nMy top highlights and stats are linked below:\nFilm: {{HIGHLIGHT_VIDEO_LINK}}\n{{SELECTED_PRS}}\n\n{{UPCOMING_MEET}}\n\nI have a {{GPA}} GPA and am very serious about finding the right fit. I would appreciate the opportunity to connect with you soon.\n\nBest,\n\n{{FIRST_NAME}} {{LAST_NAME}}\nProfile: {{PROFILE_LINK}}`
  }
];