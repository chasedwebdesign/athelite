import { EmailTemplate } from './index';

export const softballTemplates: EmailTemplate[] = [
  {
    id: 'sb_free_intro',
    name: 'Standard Intro',
    isPremium: false,
    subject: '{{GRAD_YEAR}} {{POSITION}} Recruit - {{FIRST_NAME}} {{LAST_NAME}}',
    body: `Coach,\n\nMy name is {{FIRST_NAME}} {{LAST_NAME}}, a class of {{GRAD_YEAR}} {{POSITION}} playing for {{HIGH_SCHOOL}} and my travel organization. I am very interested in the academic and athletic opportunities at {{COLLEGE_NAME}}.\n\n{{WHY_THIS_SCHOOL}}\n\nOn the field, I am a dynamic {{POSITION}} who always competes hard. In the classroom, I maintain a {{GPA}} GPA and want to pursue a degree in {{MAJOR}}.\n\nHere is a link to my skills and game-play video:\nVideo: {{HIGHLIGHT_VIDEO_LINK}}\n\nMy latest metrics:\n{{SELECTED_PRS}}\n\n{{UPCOMING_MEET}}\n\nI would love to learn more about your program and see if I might be a fit for your future roster.\n\nThank you for your time,\n\n{{FIRST_NAME}} {{LAST_NAME}}\n{{HIGH_SCHOOL}} | Class of {{GRAD_YEAR}}\nProfile: {{PROFILE_LINK}}`
  },
  {
    id: 'sb_pro_travel_schedule',
    name: 'Travel Schedule / Camp Query',
    isPremium: true,
    subject: 'Travel Schedule: {{FIRST_NAME}} {{LAST_NAME}} ({{GRAD_YEAR}} {{POSITION}})',
    body: `Coach,\n\nI am {{FIRST_NAME}} {{LAST_NAME}}, a {{GRAD_YEAR}} {{POSITION}} from {{HIGH_SCHOOL}}. I am reaching out because {{COLLEGE_NAME}} is a top choice for me, and I wanted to share my upcoming tournament schedule.\n\n{{UPCOMING_MEET}}\n\n{{WHY_THIS_SCHOOL}}\n\nIf you have a moment, please take a look at my most recent highlight and skills video:\nVideo: {{HIGHLIGHT_VIDEO_LINK}}\n\nI carry a {{GPA}} GPA and am very serious about my studies (intended major: {{MAJOR}}). Please let me know if your staff will be attending any of my upcoming events or when you are hosting your next prospect camp.\n\nThanks,\n\n{{FIRST_NAME}} {{LAST_NAME}}\nProfile: {{PROFILE_LINK}}`
  },
  {
    id: 'sb_pro_skills_video',
    name: 'New Skills Video Update',
    isPremium: true,
    subject: 'New Skills Video: {{FIRST_NAME}} {{LAST_NAME}} ({{GRAD_YEAR}} {{POSITION}})',
    body: `Coach,\n\nI hope your season is going well. I have been putting in a lot of work outside of team practices on my mechanics and wanted to share my brand new skills video with you.\n\nSkills Video: {{HIGHLIGHT_VIDEO_LINK}}\n\nMy updated metrics:\n{{SELECTED_PRS}}\n\n{{WHY_THIS_SCHOOL}}\n\nI hold a {{GPA}} GPA at {{HIGH_SCHOOL}}. {{UPCOMING_MEET}}\n\nI would greatly appreciate any feedback you have on my swing/fielding mechanics.\n\nBest regards,\n\n{{FIRST_NAME}} {{LAST_NAME}}\nProfile: {{PROFILE_LINK}}`
  },
  {
    id: 'sb_pro_camp',
    name: 'Camp Registration',
    isPremium: true,
    subject: 'Attending Upcoming Camp! - {{FIRST_NAME}} {{LAST_NAME}} ({{GRAD_YEAR}})',
    body: `Coach,\n\nI am thrilled to let you know that I have officially registered for your upcoming softball camp at {{COLLEGE_NAME}}.\n\n{{WHY_THIS_SCHOOL}}\n\nBefore I get to campus, I wanted to provide my latest film so you have an idea of my playing style as a {{POSITION}}:\nFilm: {{HIGHLIGHT_VIDEO_LINK}}\n\nMy current stats/measurables are:\n{{SELECTED_PRS}}\n\nI am a {{GPA}} GPA student, and I am coming to camp ready to work hard and learn from your staff. See you on the dirt.\n\nBest,\n\n{{FIRST_NAME}} {{LAST_NAME}}\nProfile: {{PROFILE_LINK}}`
  },
  {
    id: 'sb_pro_academic',
    name: 'Academic Update',
    isPremium: true,
    subject: 'Academic Update: {{FIRST_NAME}} {{LAST_NAME}} - C/O {{GRAD_YEAR}} {{POSITION}}',
    body: `Coach,\n\nI am reaching out to provide a quick academic update. I just finished the grading period and am proud to share that my GPA is now a {{GPA}}. Knowing the academic reputation of {{COLLEGE_NAME}}, I want to ensure you know I am a serious student looking to major in {{MAJOR}}.\n\nOn the field, my stats are currently:\n{{SELECTED_PRS}}\n\nFilm: {{HIGHLIGHT_VIDEO_LINK}}\n\n{{UPCOMING_MEET}}\n\nI would love the opportunity to learn more about the academic support available to your players.\n\nBest regards,\n\n{{FIRST_NAME}} {{LAST_NAME}}\nProfile: {{PROFILE_LINK}}`
  },
  {
    id: 'sb_pro_visit',
    name: 'Unofficial Visit Request',
    isPremium: true,
    subject: 'Campus Visit Request - {{FIRST_NAME}} {{LAST_NAME}} ({{GRAD_YEAR}})',
    body: `Coach,\n\nMy name is {{FIRST_NAME}} {{LAST_NAME}}, a {{GRAD_YEAR}} {{POSITION}} from {{HIGH_SCHOOL}}. I am planning a trip to the area soon and would absolutely love the opportunity to take an unofficial visit to {{COLLEGE_NAME}}.\n\n{{WHY_THIS_SCHOOL}}\n\nI carry a {{GPA}} GPA and am very interested in the {{MAJOR}} program. For a quick look at my playstyle, here is my latest film:\nFilm: {{HIGHLIGHT_VIDEO_LINK}}\n\nPlease let me know if you might have a few minutes to meet, or if there is a better date for me to visit campus.\n\nThank you,\n\n{{FIRST_NAME}} {{LAST_NAME}}\nProfile: {{PROFILE_LINK}}`
  },
  {
    id: 'sb_pro_assistant',
    name: 'Direct to Assistant Coach',
    isPremium: true,
    subject: '{{GRAD_YEAR}} {{POSITION}} Prospect: {{FIRST_NAME}} {{LAST_NAME}}',
    body: `Coach,\n\nI am {{FIRST_NAME}} {{LAST_NAME}}, a {{GRAD_YEAR}} {{POSITION}} playing for {{HIGH_SCHOOL}}. I am specifically reaching out to you to get on your recruiting radar as I know you handle evaluations for my position/region.\n\n{{WHY_THIS_SCHOOL}}\n\nI am a hardworking, coachable {{POSITION}} with a {{GPA}} GPA. My latest tape is linked here:\nFilm: {{HIGHLIGHT_VIDEO_LINK}}\n\nMetrics/Stats:\n{{SELECTED_PRS}}\n\nI would love to hop on a quick call to discuss what you are looking for in the {{GRAD_YEAR}} recruiting cycle.\n\nBest,\n\n{{FIRST_NAME}} {{LAST_NAME}}\nProfile: {{PROFILE_LINK}}`
  },
  {
    id: 'sb_pro_congrats',
    name: 'Congrats on Big Series/Season',
    isPremium: true,
    subject: 'Great series win this weekend! - {{FIRST_NAME}} {{LAST_NAME}} ({{GRAD_YEAR}})',
    body: `Coach,\n\nI wanted to send a quick note to congratulate the team on the massive weekend. Watching the squad play with that level of intensity and execution is exactly why {{COLLEGE_NAME}} is my dream school.\n\n{{WHY_THIS_SCHOOL}}\n\nI am working hard to play at that level. My latest film is here: {{HIGHLIGHT_VIDEO_LINK}}\n\nI hold a {{GPA}} GPA and will be following the rest of your season closely. Good luck down the stretch!\n\nBest,\n\n{{FIRST_NAME}} {{LAST_NAME}}\nProfile: {{PROFILE_LINK}}`
  },
  {
    id: 'sb_pro_walkon',
    name: 'Walk-On / Roster Spot Inquiry',
    isPremium: true,
    subject: 'Walk-On Inquiry: {{FIRST_NAME}} {{LAST_NAME}} ({{GRAD_YEAR}} {{POSITION}})',
    body: `Coach,\n\nMy name is {{FIRST_NAME}} {{LAST_NAME}}, a {{GRAD_YEAR}} {{POSITION}} out of {{HIGH_SCHOOL}}. {{COLLEGE_NAME}} is my absolute top choice for academics (I am pursuing a degree in {{MAJOR}} with a {{GPA}} GPA).\n\n{{WHY_THIS_SCHOOL}}\n\nI am reaching out to express my intense interest in earning a walk-on spot on your roster. I am a gritty, team-first player who will push everyone in practice and be a great teammate.\n\nFilm: {{HIGHLIGHT_VIDEO_LINK}}\n\nI would love to learn more about your walk-on tryout process.\n\nThank you,\n\n{{FIRST_NAME}} {{LAST_NAME}}\nProfile: {{PROFILE_LINK}}`
  },
  {
    id: 'sb_pro_followup',
    name: 'Gentle Follow-Up',
    isPremium: true,
    subject: 'Following Up - {{FIRST_NAME}} {{LAST_NAME}} ({{GRAD_YEAR}} {{POSITION}})',
    body: `Coach,\n\nI know you have a packed schedule, so I just wanted to send a brief follow-up regarding my interest in the {{COLLEGE_NAME}} softball program.\n\n{{WHY_THIS_SCHOOL}}\n\nMy top highlights and stats are linked below:\nFilm: {{HIGHLIGHT_VIDEO_LINK}}\n{{SELECTED_PRS}}\n\n{{UPCOMING_MEET}}\n\nI have a {{GPA}} GPA and am very serious about finding the right fit. I would appreciate the opportunity to connect with you soon.\n\nBest,\n\n{{FIRST_NAME}} {{LAST_NAME}}\nProfile: {{PROFILE_LINK}}`
  }
];