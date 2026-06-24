import { EmailTemplate } from './index';

export const basketballTemplates: EmailTemplate[] = [
  {
    id: 'mbb_free_intro',
    name: 'Standard Intro & Film',
    isPremium: false,
    subject: '{{GRAD_YEAR}} {{POSITION}} Prospect - {{FIRST_NAME}} {{LAST_NAME}}',
    body: `Coach,\n\nMy name is {{FIRST_NAME}} {{LAST_NAME}}, a class of {{GRAD_YEAR}} {{POSITION}} playing for {{HIGH_SCHOOL}}. I have immense respect for the culture you are building at {{COLLEGE_NAME}} and am very interested in your program.\n\n{{WHY_THIS_SCHOOL}}\n\nI pride myself on being a versatile {{POSITION}} and a high-IQ player on both ends of the floor. Off the court, I maintain a {{GPA}} GPA and intend to major in {{MAJOR}}.\n\nI have linked my full season highlight tape below for your evaluation:\nHighlights: {{HIGHLIGHT_VIDEO_LINK}}\n\nMy current measurables/stats:\n{{SELECTED_PRS}}\n\n{{UPCOMING_MEET}}\n\nI would love the opportunity to connect and see if I might be a fit for your system. \n\nBest,\n\n{{FIRST_NAME}} {{LAST_NAME}}\n{{HIGH_SCHOOL}} | Class of {{GRAD_YEAR}}\nProfile: {{PROFILE_LINK}}`
  },
  {
    id: 'mbb_pro_live_period',
    name: 'Live Period / AAU Schedule',
    isPremium: true,
    subject: 'Live Period Schedule: {{FIRST_NAME}} {{LAST_NAME}} ({{GRAD_YEAR}} {{POSITION}})',
    body: `Coach,\n\nI hope you are having a great week. I am {{FIRST_NAME}} {{LAST_NAME}}, a {{GRAD_YEAR}} {{POSITION}} from {{HIGH_SCHOOL}}. As we head into the upcoming live evaluation periods, I wanted to make sure I was on your staff's radar.\n\n{{UPCOMING_MEET}}\n\n{{WHY_THIS_SCHOOL}}\n\nFor a quick look at my playstyle, here is a link to my most recent highlights:\nTape: {{HIGHLIGHT_VIDEO_LINK}}\n\nI carry a {{GPA}} GPA and am very serious about my academics (intended major: {{MAJOR}}). I would be honored if you or an assistant could catch one of my games this summer.\n\nThank you, Coach.\n\n{{FIRST_NAME}} {{LAST_NAME}}\nProfile: {{PROFILE_LINK}}`
  },
  {
    id: 'mbb_pro_elite_camp',
    name: 'Elite Camp Registration',
    isPremium: true,
    subject: 'Registered for Elite Camp - {{FIRST_NAME}} {{LAST_NAME}} ({{GRAD_YEAR}})',
    body: `Coach,\n\nI am extremely excited to let you know that I have officially registered for your upcoming Elite Camp at {{COLLEGE_NAME}}.\n\n{{WHY_THIS_SCHOOL}}\n\nBefore I get in the gym, I wanted to provide my latest film so you have a baseline of my playing style as a {{POSITION}}:\nFilm: {{HIGHLIGHT_VIDEO_LINK}}\n\nMy current stats/measurables are:\n{{SELECTED_PRS}}\n\nI am a {{GPA}} GPA student, and I am coming to camp ready to compete hard and show I belong at your level. See you on the court.\n\nBest,\n\n{{FIRST_NAME}} {{LAST_NAME}}\nProfile: {{PROFILE_LINK}}`
  },
  {
    id: 'mbb_pro_film_update',
    name: 'Post-Tournament Film Update',
    isPremium: true,
    subject: 'New Tournament Highlights: {{FIRST_NAME}} {{LAST_NAME}} ({{GRAD_YEAR}} {{POSITION}})',
    body: `Coach,\n\nWe just wrapped up a highly competitive tournament weekend, and I wanted to send over my updated highlight tape from the event.\n\nNew Film: {{HIGHLIGHT_VIDEO_LINK}}\n\n{{WHY_THIS_SCHOOL}}\n\nI feel that my shooting consistency and defensive communication as a {{POSITION}} have really improved this season. My current metrics/stats reflect this:\n{{SELECTED_PRS}}\n\nWith a {{GPA}} GPA, {{COLLEGE_NAME}} remains my top target. {{UPCOMING_MEET}}\n\nThanks for taking a look at my film.\n\n{{FIRST_NAME}} {{LAST_NAME}}\nProfile: {{PROFILE_LINK}}`
  },
  {
    id: 'mbb_pro_academic',
    name: 'Academic Update',
    isPremium: true,
    subject: 'Academic/Athletic Update: {{FIRST_NAME}} {{LAST_NAME}} - C/O {{GRAD_YEAR}}',
    body: `Coach,\n\nI am reaching out to provide a quick academic update. I just finished the semester and am proud to share that I have improved my GPA to a {{GPA}}. Knowing the academic reputation of {{COLLEGE_NAME}}, I want to ensure you know I am a serious student looking to major in {{MAJOR}}.\n\nOn the court, my stats are currently:\n{{SELECTED_PRS}}\n\nFilm: {{HIGHLIGHT_VIDEO_LINK}}\n\n{{UPCOMING_MEET}}\n\nI would love the opportunity to learn more about the academic support available to your student-athletes.\n\nBest regards,\n\n{{FIRST_NAME}} {{LAST_NAME}}\nProfile: {{PROFILE_LINK}}`
  },
  {
    id: 'mbb_pro_visit',
    name: 'Campus Visit Inquiry',
    isPremium: true,
    subject: 'Campus Visit Request - {{FIRST_NAME}} {{LAST_NAME}} ({{GRAD_YEAR}})',
    body: `Coach,\n\nMy name is {{FIRST_NAME}} {{LAST_NAME}}, a {{GRAD_YEAR}} {{POSITION}} from {{HIGH_SCHOOL}}. I am planning a trip to the area soon and would absolutely love the opportunity to take an unofficial visit to {{COLLEGE_NAME}}.\n\n{{WHY_THIS_SCHOOL}}\n\nI carry a {{GPA}} GPA and am very interested in the {{MAJOR}} program. For a quick look at my playstyle, here is my latest film:\nFilm: {{HIGHLIGHT_VIDEO_LINK}}\n\nPlease let me know if you or an assistant might have 10 minutes to meet, or if there is a better date for me to visit campus.\n\nThank you,\n\n{{FIRST_NAME}} {{LAST_NAME}}\nProfile: {{PROFILE_LINK}}`
  },
  {
    id: 'mbb_pro_assistant',
    name: 'Direct to Assistant Coach',
    isPremium: true,
    subject: '{{GRAD_YEAR}} {{POSITION}} Prospect: {{FIRST_NAME}} {{LAST_NAME}}',
    body: `Coach,\n\nI am {{FIRST_NAME}} {{LAST_NAME}}, a {{GRAD_YEAR}} {{POSITION}} playing for {{HIGH_SCHOOL}}. I am specifically reaching out to you to get on your recruiting radar as I know you handle a lot of the evaluations for my region/position.\n\n{{WHY_THIS_SCHOOL}}\n\nI am a hardworking, coachable {{POSITION}} with a {{GPA}} GPA. My latest tape is linked here:\nFilm: {{HIGHLIGHT_VIDEO_LINK}}\n\nMetrics/Stats:\n{{SELECTED_PRS}}\n\nI would love to hop on a quick call to discuss what you are looking for in the {{GRAD_YEAR}} recruiting cycle.\n\nBest,\n\n{{FIRST_NAME}} {{LAST_NAME}}\nProfile: {{PROFILE_LINK}}`
  },
  {
    id: 'mbb_pro_congrats',
    name: 'Congrats on Big Win',
    isPremium: true,
    subject: 'Great win this weekend! - {{FIRST_NAME}} {{LAST_NAME}} ({{GRAD_YEAR}})',
    body: `Coach,\n\nI wanted to send a quick note to congratulate the team on the massive win this past weekend. Watching the squad play with that level of intensity and execution is exactly why {{COLLEGE_NAME}} is my dream school.\n\n{{WHY_THIS_SCHOOL}}\n\nI am working hard in the gym to play at that level. My latest film is here: {{HIGHLIGHT_VIDEO_LINK}}\n\nI hold a {{GPA}} GPA and will be following the rest of your season closely. Good luck down the stretch!\n\nBest,\n\n{{FIRST_NAME}} {{LAST_NAME}}\nProfile: {{PROFILE_LINK}}`
  },
  {
    id: 'mbb_pro_walkon',
    name: 'Walk-On / Roster Spot Inquiry',
    isPremium: true,
    subject: 'Walk-On Inquiry: {{FIRST_NAME}} {{LAST_NAME}} ({{GRAD_YEAR}} {{POSITION}})',
    body: `Coach,\n\nMy name is {{FIRST_NAME}} {{LAST_NAME}}, a {{GRAD_YEAR}} {{POSITION}} out of {{HIGH_SCHOOL}}. {{COLLEGE_NAME}} is my absolute top choice for academics (I am pursuing a degree in {{MAJOR}} with a {{GPA}} GPA).\n\n{{WHY_THIS_SCHOOL}}\n\nI am reaching out to express my intense interest in earning a walk-on spot on your roster. I am a gritty, team-first player who will push the scholarship guys every day in practice and be a great locker room presence.\n\nFilm: {{HIGHLIGHT_VIDEO_LINK}}\n\nI would love to learn more about your walk-on tryout process.\n\nThank you,\n\n{{FIRST_NAME}} {{LAST_NAME}}\nProfile: {{PROFILE_LINK}}`
  },
  {
    id: 'mbb_pro_followup',
    name: 'Gentle Follow-Up',
    isPremium: true,
    subject: 'Following Up - {{FIRST_NAME}} {{LAST_NAME}} ({{GRAD_YEAR}} {{POSITION}})',
    body: `Coach,\n\nI know you have a packed schedule, so I just wanted to send a brief follow-up regarding my interest in the {{COLLEGE_NAME}} basketball program.\n\n{{WHY_THIS_SCHOOL}}\n\nMy top highlights and stats are linked below:\nFilm: {{HIGHLIGHT_VIDEO_LINK}}\n{{SELECTED_PRS}}\n\n{{UPCOMING_MEET}}\n\nI have a {{GPA}} GPA and am very serious about finding the right fit. I would appreciate the opportunity to connect with you soon.\n\nBest,\n\n{{FIRST_NAME}} {{LAST_NAME}}\nProfile: {{PROFILE_LINK}}`
  }
];