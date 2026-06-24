import { EmailTemplate } from './index';

export const baseballTemplates: EmailTemplate[] = [
  {
    id: 'bsb_free_intro',
    name: 'Standard Intro & Video',
    isPremium: false,
    subject: '{{GRAD_YEAR}} {{POSITION}} - {{FIRST_NAME}} {{LAST_NAME}} Video/Metrics',
    body: `Coach,\n\nMy name is {{FIRST_NAME}} {{LAST_NAME}} and I am a class of {{GRAD_YEAR}} {{POSITION}} at {{HIGH_SCHOOL}}. Playing for {{COLLEGE_NAME}} has been a long-time goal of mine, and I wanted to put myself on your recruiting radar.\n\n{{WHY_THIS_SCHOOL}}\n\nI take pride in my mechanics, work ethic, and ability to execute at the {{POSITION}} spot. I also excel in the classroom with a {{GPA}} GPA, looking to major in {{MAJOR}}.\n\nBelow is a link to my most recent video showcasing my mechanics and in-game reps:\nVideo: {{HIGHLIGHT_VIDEO_LINK}}\n\nMy current measurables:\n{{SELECTED_PRS}}\n\n{{UPCOMING_MEET}}\n\nI would love to receive some feedback and learn more about your recruiting needs for the {{GRAD_YEAR}} class.\n\nThanks,\n\n{{FIRST_NAME}} {{LAST_NAME}}\n{{HIGH_SCHOOL}} | Class of {{GRAD_YEAR}}\nProfile: {{PROFILE_LINK}}`
  },
  {
    id: 'bsb_pro_summer_schedule',
    name: 'Summer / Showcase Schedule',
    isPremium: true,
    subject: 'Summer Travel Schedule: {{FIRST_NAME}} {{LAST_NAME}} ({{GRAD_YEAR}} {{POSITION}})',
    body: `Coach,\n\nI am {{FIRST_NAME}} {{LAST_NAME}}, a {{GRAD_YEAR}} {{POSITION}} from {{HIGH_SCHOOL}}. As we head into the summer showcase and tournament circuit, I wanted to share my upcoming schedule in case you or your staff will be in attendance.\n\n{{UPCOMING_MEET}}\n\n{{WHY_THIS_SCHOOL}}\n\nTo give you a baseline of my skills, here is my latest highlight and metrics video:\nVideo: {{HIGHLIGHT_VIDEO_LINK}}\n\nI carry a {{GPA}} GPA and am very focused on finding a high-academic baseball program. Please let me know if your staff will be at any of my events.\n\nBest,\n\n{{FIRST_NAME}} {{LAST_NAME}}\nProfile: {{PROFILE_LINK}}`
  },
  {
    id: 'bsb_pro_metrics_update',
    name: 'New PR / Metrics Update',
    isPremium: true,
    subject: 'Updated Metrics/Velo: {{FIRST_NAME}} {{LAST_NAME}} ({{GRAD_YEAR}} {{POSITION}})',
    body: `Coach,\n\nI hope you are having a great week. I am reaching out to provide an update on my recent measurables. I have been working extremely hard in the weight room and in my development program, and it is translating to the field.\n\nMy updated verified metrics are:\n{{SELECTED_PRS}}\n\n{{WHY_THIS_SCHOOL}}\n\nMy latest mechanics/gameplay video is linked here: {{HIGHLIGHT_VIDEO_LINK}}\n\nWith a {{GPA}} GPA, I am looking for a program that develops players and competes at a high level. {{UPCOMING_MEET}}\n\nThanks for your time, Coach.\n\n{{FIRST_NAME}} {{LAST_NAME}}\nProfile: {{PROFILE_LINK}}`
  },
  {
    id: 'bsb_pro_camp',
    name: 'Camp / Prospect Day Registration',
    isPremium: true,
    subject: 'Attending Prospect Camp - {{FIRST_NAME}} {{LAST_NAME}} ({{GRAD_YEAR}})',
    body: `Coach,\n\nI am very excited to let you know that I have officially registered for your upcoming prospect camp at {{COLLEGE_NAME}}.\n\n{{WHY_THIS_SCHOOL}}\n\nBefore I arrive on campus, I wanted to provide my latest film so you have a baseline of my playing style as a {{POSITION}}:\nFilm: {{HIGHLIGHT_VIDEO_LINK}}\n\nCurrent Metrics:\n{{SELECTED_PRS}}\n\nI am a {{GPA}} GPA student, and I am coming to camp ready to work and prove my abilities to your staff. See you on the diamond.\n\nBest,\n\n{{FIRST_NAME}} {{LAST_NAME}}\nProfile: {{PROFILE_LINK}}`
  },
  {
    id: 'bsb_pro_academic',
    name: 'Academic Update',
    isPremium: true,
    subject: 'Academic/Athletic Update: {{FIRST_NAME}} {{LAST_NAME}} - C/O {{GRAD_YEAR}}',
    body: `Coach,\n\nI am reaching out to provide a quick academic update. I just finished the semester and am proud to share that I have improved my GPA to a {{GPA}}. Knowing the academic reputation of {{COLLEGE_NAME}}, I want to ensure you know I am a serious student looking to major in {{MAJOR}}.\n\nOn the field, my metrics currently sit at:\n{{SELECTED_PRS}}\n\nFilm: {{HIGHLIGHT_VIDEO_LINK}}\n\n{{UPCOMING_MEET}}\n\nI would love the opportunity to learn more about the academic support available to your student-athletes.\n\nBest regards,\n\n{{FIRST_NAME}} {{LAST_NAME}}\nProfile: {{PROFILE_LINK}}`
  },
  {
    id: 'bsb_pro_visit',
    name: 'Campus Visit Inquiry',
    isPremium: true,
    subject: 'Campus Visit Request - {{FIRST_NAME}} {{LAST_NAME}} ({{GRAD_YEAR}})',
    body: `Coach,\n\nMy name is {{FIRST_NAME}} {{LAST_NAME}}, a {{GRAD_YEAR}} {{POSITION}} from {{HIGH_SCHOOL}}. I am planning a trip to the area soon and would absolutely love the opportunity to take an unofficial visit to {{COLLEGE_NAME}}.\n\n{{WHY_THIS_SCHOOL}}\n\nI carry a {{GPA}} GPA and am very interested in the {{MAJOR}} program. For a quick look at my mechanics, here is my latest film:\nFilm: {{HIGHLIGHT_VIDEO_LINK}}\n\nPlease let me know if you or your recruiting coordinator might have 10 minutes to meet, or if there is a better date for me to visit campus.\n\nThank you,\n\n{{FIRST_NAME}} {{LAST_NAME}}\nProfile: {{PROFILE_LINK}}`
  },
  {
    id: 'bsb_pro_recruiting_coordinator',
    name: 'Direct to Recruiting Coordinator',
    isPremium: true,
    subject: '{{GRAD_YEAR}} {{POSITION}} Prospect: {{FIRST_NAME}} {{LAST_NAME}}',
    body: `Coach,\n\nI am {{FIRST_NAME}} {{LAST_NAME}}, a {{GRAD_YEAR}} {{POSITION}} playing for {{HIGH_SCHOOL}}. I am specifically reaching out to you to get on your recruiting radar as I know you coordinate the recruiting efforts and evaluations for the program.\n\n{{WHY_THIS_SCHOOL}}\n\nI am a hardworking, coachable {{POSITION}} with a {{GPA}} GPA. My latest tape is linked here:\nFilm: {{HIGHLIGHT_VIDEO_LINK}}\n\nMetrics:\n{{SELECTED_PRS}}\n\nI would love to hop on a quick call to discuss what you are looking for in the {{GRAD_YEAR}} recruiting cycle.\n\nBest,\n\n{{FIRST_NAME}} {{LAST_NAME}}\nProfile: {{PROFILE_LINK}}`
  },
  {
    id: 'bsb_pro_congrats',
    name: 'Congrats on Big Series Win',
    isPremium: true,
    subject: 'Great series win this weekend! - {{FIRST_NAME}} {{LAST_NAME}} ({{GRAD_YEAR}})',
    body: `Coach,\n\nI wanted to send a quick note to congratulate the team on the massive series win this past weekend. Watching the squad play with that level of intensity is exactly why {{COLLEGE_NAME}} is my dream school.\n\n{{WHY_THIS_SCHOOL}}\n\nI am working hard to play at that level. My latest film is here: {{HIGHLIGHT_VIDEO_LINK}}\n\nI hold a {{GPA}} GPA and will be following the rest of your season closely. Good luck down the stretch!\n\nBest,\n\n{{FIRST_NAME}} {{LAST_NAME}}\nProfile: {{PROFILE_LINK}}`
  },
  {
    id: 'bsb_pro_walkon',
    name: 'Walk-On / Roster Spot Inquiry',
    isPremium: true,
    subject: 'Walk-On Inquiry: {{FIRST_NAME}} {{LAST_NAME}} ({{GRAD_YEAR}} {{POSITION}})',
    body: `Coach,\n\nMy name is {{FIRST_NAME}} {{LAST_NAME}}, a {{GRAD_YEAR}} {{POSITION}} out of {{HIGH_SCHOOL}}. {{COLLEGE_NAME}} is my absolute top choice for academics (I am pursuing a degree in {{MAJOR}} with a {{GPA}} GPA).\n\n{{WHY_THIS_SCHOOL}}\n\nI am reaching out to express my intense interest in earning a walk-on spot on your roster. I am a gritty, team-first player who will push the scholarship guys every day and bring energy to the dugout.\n\nFilm: {{HIGHLIGHT_VIDEO_LINK}}\nMetrics: \n{{SELECTED_PRS}}\n\nI would love to learn more about your walk-on evaluation process.\n\nThank you,\n\n{{FIRST_NAME}} {{LAST_NAME}}\nProfile: {{PROFILE_LINK}}`
  },
  {
    id: 'bsb_pro_followup',
    name: 'Gentle Follow-Up',
    isPremium: true,
    subject: 'Following Up - {{FIRST_NAME}} {{LAST_NAME}} ({{GRAD_YEAR}} {{POSITION}})',
    body: `Coach,\n\nI know you have a packed schedule with the season/recruiting, so I just wanted to send a brief follow-up regarding my interest in the {{COLLEGE_NAME}} baseball program.\n\n{{WHY_THIS_SCHOOL}}\n\nMy top highlights and metrics are linked below:\nFilm: {{HIGHLIGHT_VIDEO_LINK}}\n{{SELECTED_PRS}}\n\n{{UPCOMING_MEET}}\n\nI have a {{GPA}} GPA and am very serious about finding the right fit. I would appreciate the opportunity to connect with you soon.\n\nBest,\n\n{{FIRST_NAME}} {{LAST_NAME}}\nProfile: {{PROFILE_LINK}}`
  }
];