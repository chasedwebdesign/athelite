import { EmailTemplate } from './index';

export const wrestlingTemplates: EmailTemplate[] = [
  {
    id: 'wr_free_intro',
    name: 'Standard Intro',
    isPremium: false,
    subject: '{{GRAD_YEAR}} {{POSITION}} Recruit - {{FIRST_NAME}} {{LAST_NAME}}',
    body: `Coach,\n\nMy name is {{FIRST_NAME}} {{LAST_NAME}}, a class of {{GRAD_YEAR}} wrestler at {{HIGH_SCHOOL}} competing at {{POSITION}}. I am very interested in the academic and athletic opportunities at {{COLLEGE_NAME}} and wanted to formally introduce myself.\n\n{{WHY_THIS_SCHOOL}}\n\nOn the mat, I am aggressive, coachable, and always looking for bonus points. In the classroom, I maintain a {{GPA}} GPA and want to pursue a degree in {{MAJOR}}.\n\nHere is a link to my recent bout footage and highlights:\nVideo: {{HIGHLIGHT_VIDEO_LINK}}\n\nMy current records and stats:\n{{SELECTED_PRS}}\n\n{{UPCOMING_MEET}}\n\nI would love to learn more about your program and see if I might be a fit for your wrestling room.\n\nThank you for your time,\n\n{{FIRST_NAME}} {{LAST_NAME}}\n{{HIGH_SCHOOL}} | Class of {{GRAD_YEAR}}\nProfile: {{PROFILE_LINK}}`
  },
  {
    id: 'wr_pro_tournament',
    name: 'Major Tournament Schedule',
    isPremium: true,
    subject: 'Upcoming Tournament Schedule: {{FIRST_NAME}} {{LAST_NAME}} ({{GRAD_YEAR}} {{POSITION}})',
    body: `Coach,\n\nI am {{FIRST_NAME}} {{LAST_NAME}}, a {{GRAD_YEAR}} {{POSITION}} from {{HIGH_SCHOOL}}. I am reaching out because {{COLLEGE_NAME}} is a top choice for me, and I wanted to share my upcoming off-season/post-season tournament schedule.\n\n{{UPCOMING_MEET}}\n\n{{WHY_THIS_SCHOOL}}\n\nIf you have a moment, please take a look at my most recent match film to see my style of wrestling:\nVideo: {{HIGHLIGHT_VIDEO_LINK}}\n\nI carry a {{GPA}} GPA and am very serious about my studies (intended major: {{MAJOR}}). Please let me know if your staff will be attending any of my events!\n\nThanks,\n\n{{FIRST_NAME}} {{LAST_NAME}}\nProfile: {{PROFILE_LINK}}`
  },
  {
    id: 'wr_pro_camp_invite',
    name: 'Intensive Camp Registration',
    isPremium: true,
    subject: 'Registered for Intensive Camp! - {{FIRST_NAME}} {{LAST_NAME}} ({{GRAD_YEAR}})',
    body: `Coach,\n\nI am very excited to let you know that I am officially registered for your upcoming wrestling camp at {{COLLEGE_NAME}}.\n\n{{WHY_THIS_SCHOOL}}\n\nBefore I get in the room, I wanted to provide my latest film so you have an idea of my skill set at {{POSITION}}:\nFilm: {{HIGHLIGHT_VIDEO_LINK}}\n\nStats/Metrics:\n{{SELECTED_PRS}}\n\nI am a {{GPA}} GPA student, and I am coming to camp ready to grind and learn from your coaching staff. See you soon!\n\nBest,\n\n{{FIRST_NAME}} {{LAST_NAME}}\nProfile: {{PROFILE_LINK}}`
  },
  {
    id: 'wr_pro_post_tournament',
    name: 'Post-Tournament Film Update',
    isPremium: true,
    subject: 'Recent Tournament Film: {{FIRST_NAME}} {{LAST_NAME}} ({{GRAD_YEAR}} {{POSITION}})',
    body: `Coach,\n\nWe recently finished a great weekend of competition at a major tournament, and I wanted to send over my updated film showcasing my toughest bouts.\n\nNew Video: {{HIGHLIGHT_VIDEO_LINK}}\n\n{{WHY_THIS_SCHOOL}}\n\nI have been working heavily on my bottom game and hand-fighting. My current stats are:\n{{SELECTED_PRS}}\n\nI hold a {{GPA}} GPA at {{HIGH_SCHOOL}}. {{UPCOMING_MEET}}\n\nI would greatly appreciate any feedback you have on my tape.\n\nBest regards,\n\n{{FIRST_NAME}} {{LAST_NAME}}\nProfile: {{PROFILE_LINK}}`
  },
  {
    id: 'wr_pro_academic',
    name: 'Academic Update',
    isPremium: true,
    subject: 'Academic/Athletic Update: {{FIRST_NAME}} {{LAST_NAME}} (C/O {{GRAD_YEAR}})',
    body: `Coach,\n\nI am reaching out to provide a quick academic update. I just wrapped up my recent grading period and have improved my GPA to a {{GPA}}. Because {{COLLEGE_NAME}} is my top target, I want to assure you I can handle the academic rigor of a {{MAJOR}} degree.\n\nOn the mat, my latest tape is linked here:\nFilm: {{HIGHLIGHT_VIDEO_LINK}}\n\n{{UPCOMING_MEET}}\n\nI would love the opportunity to learn more about the student-athlete experience in your program.\n\nBest,\n\n{{FIRST_NAME}} {{LAST_NAME}}\nProfile: {{PROFILE_LINK}}`
  },
  {
    id: 'wr_pro_visit',
    name: 'Unofficial Visit Request',
    isPremium: true,
    subject: 'Campus Visit Request - {{FIRST_NAME}} {{LAST_NAME}} ({{GRAD_YEAR}} {{POSITION}})',
    body: `Coach,\n\nMy name is {{FIRST_NAME}} {{LAST_NAME}}, a {{GRAD_YEAR}} {{POSITION}} from {{HIGH_SCHOOL}}. I am planning to be in the area in the near future and would love the chance to take an unofficial visit to {{COLLEGE_NAME}}.\n\n{{WHY_THIS_SCHOOL}}\n\nI carry a {{GPA}} GPA and am very interested in your {{MAJOR}} department. Here is my latest film:\nFilm: {{HIGHLIGHT_VIDEO_LINK}}\n\nPlease let me know if you might be available for a brief introduction while I am on campus.\n\nThank you,\n\n{{FIRST_NAME}} {{LAST_NAME}}\nProfile: {{PROFILE_LINK}}`
  },
  {
    id: 'wr_pro_congrats',
    name: 'Congrats on Dual/Tournament Win',
    isPremium: true,
    subject: 'Great win this week! - {{FIRST_NAME}} {{LAST_NAME}} ({{GRAD_YEAR}})',
    body: `Coach,\n\nI wanted to reach out and say congratulations on the fantastic dual meet win this week! The team's conditioning and toughness looked amazing.\n\n{{WHY_THIS_SCHOOL}}\n\nI am training hard to hopefully be part of that kind of success. My tape is linked here: {{HIGHLIGHT_VIDEO_LINK}}\n\nI am a {{GPA}} GPA student at {{HIGH_SCHOOL}}. Wishing you the best of luck with the rest of the season!\n\nBest,\n\n{{FIRST_NAME}} {{LAST_NAME}}\nProfile: {{PROFILE_LINK}}`
  },
  {
    id: 'wr_pro_assistant',
    name: 'Direct to Assistant Coach',
    isPremium: true,
    subject: '{{GRAD_YEAR}} {{POSITION}} Prospect: {{FIRST_NAME}} {{LAST_NAME}}',
    body: `Coach,\n\nI am {{FIRST_NAME}} {{LAST_NAME}}, a {{GRAD_YEAR}} {{POSITION}} wrestling for {{HIGH_SCHOOL}}. I am reaching out to you directly because I know you handle recruiting evaluations for my region and weight class.\n\n{{WHY_THIS_SCHOOL}}\n\nI am a relentless, highly coachable wrestler with a {{GPA}} GPA. My latest tape is linked here:\nFilm: {{HIGHLIGHT_VIDEO_LINK}}\n\nMetrics/Stats:\n{{SELECTED_PRS}}\n\nI would love 5 minutes of your time to discuss your recruiting timeline for the {{GRAD_YEAR}} class.\n\nBest,\n\n{{FIRST_NAME}} {{LAST_NAME}}\nProfile: {{PROFILE_LINK}}`
  },
  {
    id: 'wr_pro_walkon',
    name: 'Walk-On / Roster Spot',
    isPremium: true,
    subject: 'Roster Spot Inquiry: {{FIRST_NAME}} {{LAST_NAME}} ({{GRAD_YEAR}} {{POSITION}})',
    body: `Coach,\n\nMy name is {{FIRST_NAME}} {{LAST_NAME}}, a {{GRAD_YEAR}} {{POSITION}} out of {{HIGH_SCHOOL}}. {{COLLEGE_NAME}} is my absolute top choice for academics, as I am planning to study {{MAJOR}} and hold a {{GPA}} GPA.\n\n{{WHY_THIS_SCHOOL}}\n\nI am reaching out to express my intense interest in earning a walk-on spot on your roster. I am a dedicated, team-first wrestler who will work incredibly hard as a training partner and fight for a spot in the lineup.\n\nFilm: {{HIGHLIGHT_VIDEO_LINK}}\n\nI would love to learn more about your walk-on evaluation process.\n\nThank you,\n\n{{FIRST_NAME}} {{LAST_NAME}}\nProfile: {{PROFILE_LINK}}`
  },
  {
    id: 'wr_pro_followup',
    name: 'Gentle Follow-Up',
    isPremium: true,
    subject: 'Following Up - {{FIRST_NAME}} {{LAST_NAME}} ({{GRAD_YEAR}} {{POSITION}})',
    body: `Coach,\n\nI know you have a demanding schedule, so I wanted to send a quick follow-up to reiterate my strong interest in the {{COLLEGE_NAME}} wrestling program.\n\n{{WHY_THIS_SCHOOL}}\n\nMy highlight tape is linked below:\nFilm: {{HIGHLIGHT_VIDEO_LINK}}\n\n{{UPCOMING_MEET}}\n\nI have a {{GPA}} GPA and am very serious about finding the right collegiate fit. I would appreciate the opportunity to connect with you soon.\n\nBest,\n\n{{FIRST_NAME}} {{LAST_NAME}}\nProfile: {{PROFILE_LINK}}`
  }
];