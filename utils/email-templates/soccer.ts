import { EmailTemplate } from './index';

export const soccerTemplates: EmailTemplate[] = [
  {
    id: 'soc_free_intro',
    name: 'Standard Club / HS Intro',
    isPremium: false,
    subject: '{{GRAD_YEAR}} {{POSITION}} Recruit: {{FIRST_NAME}} {{LAST_NAME}}',
    body: `Coach,\n\nMy name is {{FIRST_NAME}} {{LAST_NAME}}. I am a class of {{GRAD_YEAR}} {{POSITION}} playing at {{HIGH_SCHOOL}} and at the club level. I am reaching out because playing for {{COLLEGE_NAME}} is a major goal of mine.\n\n{{WHY_THIS_SCHOOL}}\n\nAs a {{POSITION}}, I pride myself on technical ability, vision, and work rate. I am also dedicated in the classroom, holding a {{GPA}} GPA with plans to study {{MAJOR}}.\n\nYou can view my most recent match highlights here:\nHighlights: {{HIGHLIGHT_VIDEO_LINK}}\n\nHere are my most recent stats/metrics:\n{{SELECTED_PRS}}\n\n{{UPCOMING_MEET}}\n\nI would greatly appreciate any feedback on my film and would love to learn more about your program.\n\nBest regards,\n\n{{FIRST_NAME}} {{LAST_NAME}}\n{{HIGH_SCHOOL}} | Class of {{GRAD_YEAR}}\nProfile: {{PROFILE_LINK}}`
  },
  {
    id: 'soc_pro_showcase',
    name: 'Showcase / Event Schedule',
    isPremium: true,
    subject: 'Upcoming Showcase Schedule: {{FIRST_NAME}} {{LAST_NAME}} ({{GRAD_YEAR}} {{POSITION}})',
    body: `Coach,\n\nI am {{FIRST_NAME}} {{LAST_NAME}}, a {{GRAD_YEAR}} {{POSITION}} from {{HIGH_SCHOOL}}. I am reaching out to share my upcoming club showcase schedule in hopes that your staff might be able to evaluate me in person.\n\n{{UPCOMING_MEET}}\n\n{{WHY_THIS_SCHOOL}}\n\nTo give you a preview of how I play, please see my latest highlight reel:\nFilm: {{HIGHLIGHT_VIDEO_LINK}}\n\nI have a {{GPA}} GPA and am highly interested in your {{MAJOR}} department. I would be honored to have you or an assistant coach on the sideline for one of my matches.\n\nThank you for your time.\n\n{{FIRST_NAME}} {{LAST_NAME}}\nProfile: {{PROFILE_LINK}}`
  },
  {
    id: 'soc_pro_id_camp',
    name: 'ID Camp Registration',
    isPremium: true,
    subject: 'Registered for ID Camp - {{FIRST_NAME}} {{LAST_NAME}} ({{GRAD_YEAR}})',
    body: `Coach,\n\nI am thrilled to let you know that I have officially registered for your upcoming ID Camp at {{COLLEGE_NAME}}. \n\n{{WHY_THIS_SCHOOL}}\n\nBefore I get to campus, I wanted to provide my latest film so you have a baseline of my playing style as a {{POSITION}}:\nFilm: {{HIGHLIGHT_VIDEO_LINK}}\n\nMy current stats/metrics are:\n{{SELECTED_PRS}}\n\nI am a {{GPA}} GPA student, and I am coming to camp ready to work and prove I can compete at your level. See you on the pitch.\n\nBest,\n\n{{FIRST_NAME}} {{LAST_NAME}}\nProfile: {{PROFILE_LINK}}`
  },
  {
    id: 'soc_pro_post_showcase',
    name: 'Post-Showcase Film Update',
    isPremium: true,
    subject: 'Recent Showcase Film: {{FIRST_NAME}} {{LAST_NAME}} ({{GRAD_YEAR}} {{POSITION}})',
    body: `Coach,\n\nWe just wrapped up a great weekend at our recent showcase, and I wanted to send over my updated highlight tape from the event.\n\nNew Film: {{HIGHLIGHT_VIDEO_LINK}}\n\n{{WHY_THIS_SCHOOL}}\n\nI feel that my distribution and defensive awareness as a {{POSITION}} have really improved this season. My current metrics/stats reflect this:\n{{SELECTED_PRS}}\n\nWith a {{GPA}} GPA, {{COLLEGE_NAME}} remains a top target for me. {{UPCOMING_MEET}}\n\nThanks for taking a look at my film.\n\n{{FIRST_NAME}} {{LAST_NAME}}\nProfile: {{PROFILE_LINK}}`
  },
  {
    id: 'soc_pro_academic',
    name: 'Academic Update',
    isPremium: true,
    subject: 'Academic Update: {{FIRST_NAME}} {{LAST_NAME}} - C/O {{GRAD_YEAR}} {{POSITION}}',
    body: `Coach,\n\nI am reaching out to provide a quick academic update. I just finished the semester and am proud to share that I have improved my GPA to a {{GPA}}. Knowing the academic reputation of {{COLLEGE_NAME}}, I want to ensure you know I am a serious student looking to major in {{MAJOR}}.\n\nOn the field, my stats are currently:\n{{SELECTED_PRS}}\n\nFilm: {{HIGHLIGHT_VIDEO_LINK}}\n\n{{UPCOMING_MEET}}\n\nI would love the opportunity to learn more about the academic support available to your student-athletes.\n\nBest regards,\n\n{{FIRST_NAME}} {{LAST_NAME}}\nProfile: {{PROFILE_LINK}}`
  },
  {
    id: 'soc_pro_visit',
    name: 'Campus Visit Inquiry',
    isPremium: true,
    subject: 'Campus Visit Request - {{FIRST_NAME}} {{LAST_NAME}} ({{GRAD_YEAR}})',
    body: `Coach,\n\nMy name is {{FIRST_NAME}} {{LAST_NAME}}, a {{GRAD_YEAR}} {{POSITION}} from {{HIGH_SCHOOL}}. I am planning a trip to the area soon and would absolutely love the opportunity to take an unofficial visit to {{COLLEGE_NAME}}.\n\n{{WHY_THIS_SCHOOL}}\n\nI carry a {{GPA}} GPA and am very interested in the {{MAJOR}} program. For a quick look at my playstyle, here is my latest film:\nFilm: {{HIGHLIGHT_VIDEO_LINK}}\n\nPlease let me know if you or an assistant might have 10 minutes to meet, or if there is a better date for me to visit campus.\n\nThank you,\n\n{{FIRST_NAME}} {{LAST_NAME}}\nProfile: {{PROFILE_LINK}}`
  },
  {
    id: 'soc_pro_assistant',
    name: 'Direct to Assistant Coach',
    isPremium: true,
    subject: '{{GRAD_YEAR}} {{POSITION}} Prospect: {{FIRST_NAME}} {{LAST_NAME}}',
    body: `Coach,\n\nI am {{FIRST_NAME}} {{LAST_NAME}}, a {{GRAD_YEAR}} {{POSITION}} playing for {{HIGH_SCHOOL}}. I am specifically reaching out to you to get on your recruiting radar as I know you handle a lot of the evaluations for my region/position.\n\n{{WHY_THIS_SCHOOL}}\n\nI am a hardworking, coachable {{POSITION}} with a {{GPA}} GPA. My latest tape is linked here:\nFilm: {{HIGHLIGHT_VIDEO_LINK}}\n\nMetrics/Stats:\n{{SELECTED_PRS}}\n\nI would love to hop on a quick call to discuss what you are looking for in the {{GRAD_YEAR}} recruiting cycle.\n\nBest,\n\n{{FIRST_NAME}} {{LAST_NAME}}\nProfile: {{PROFILE_LINK}}`
  },
  {
    id: 'soc_pro_congrats',
    name: 'Congrats on Big Match/Season',
    isPremium: true,
    subject: 'Great result this weekend! - {{FIRST_NAME}} {{LAST_NAME}} ({{GRAD_YEAR}})',
    body: `Coach,\n\nI wanted to send a quick note to congratulate the team on the massive result this past weekend. Watching the squad play with that level of intensity is exactly why {{COLLEGE_NAME}} is my dream school.\n\n{{WHY_THIS_SCHOOL}}\n\nI am working hard to play at that level. My latest film is here: {{HIGHLIGHT_VIDEO_LINK}}\n\nI hold a {{GPA}} GPA and will be following the rest of your season closely. Good luck down the stretch!\n\nBest,\n\n{{FIRST_NAME}} {{LAST_NAME}}\nProfile: {{PROFILE_LINK}}`
  },
  {
    id: 'soc_pro_walkon',
    name: 'Walk-On / Roster Spot Inquiry',
    isPremium: true,
    subject: 'Walk-On Inquiry: {{FIRST_NAME}} {{LAST_NAME}} ({{GRAD_YEAR}} {{POSITION}})',
    body: `Coach,\n\nMy name is {{FIRST_NAME}} {{LAST_NAME}}, a {{GRAD_YEAR}} {{POSITION}} out of {{HIGH_SCHOOL}}. {{COLLEGE_NAME}} is my absolute top choice for academics (I am pursuing a degree in {{MAJOR}} with a {{GPA}} GPA).\n\n{{WHY_THIS_SCHOOL}}\n\nI am reaching out to express my intense interest in earning a walk-on spot on your roster. I am a gritty, team-first player who will push the starters every day in training.\n\nFilm: {{HIGHLIGHT_VIDEO_LINK}}\n\nI would love to learn more about your walk-on tryout process or what you need to see from me to earn an invite to pre-season.\n\nThank you,\n\n{{FIRST_NAME}} {{LAST_NAME}}\nProfile: {{PROFILE_LINK}}`
  },
  {
    id: 'soc_pro_followup',
    name: 'Gentle Follow-Up',
    isPremium: true,
    subject: 'Following Up - {{FIRST_NAME}} {{LAST_NAME}} ({{GRAD_YEAR}} {{POSITION}})',
    body: `Coach,\n\nI know you have a packed schedule, so I just wanted to send a brief follow-up regarding my interest in the {{COLLEGE_NAME}} men's/women's soccer program.\n\n{{WHY_THIS_SCHOOL}}\n\nMy top highlights and stats are linked below:\nFilm: {{HIGHLIGHT_VIDEO_LINK}}\n{{SELECTED_PRS}}\n\n{{UPCOMING_MEET}}\n\nI have a {{GPA}} GPA and am very serious about finding the right fit. I would appreciate the opportunity to connect with you soon.\n\nBest,\n\n{{FIRST_NAME}} {{LAST_NAME}}\nProfile: {{PROFILE_LINK}}`
  }
];