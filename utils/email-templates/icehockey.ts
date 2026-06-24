import { EmailTemplate } from './index';

export const iceHockeyTemplates: EmailTemplate[] = [
  {
    id: 'ih_free_intro',
    name: 'Standard Intro',
    isPremium: false,
    subject: '{{GRAD_YEAR}} {{POSITION}} Recruit - {{FIRST_NAME}} {{LAST_NAME}}',
    body: `Coach,\n\nMy name is {{FIRST_NAME}} {{LAST_NAME}}, a {{GRAD_YEAR}} {{POSITION}} playing for {{HIGH_SCHOOL}} / my club team. I am very interested in the academic and athletic opportunities at {{COLLEGE_NAME}}.\n\n{{WHY_THIS_SCHOOL}}\n\nOn the ice, I am a 200-foot {{POSITION}} who plays physical and smart. In the classroom, I maintain a {{GPA}} GPA and want to pursue a degree in {{MAJOR}}.\n\nHere is a link to my recent game highlights:\nVideo: {{HIGHLIGHT_VIDEO_LINK}}\n\nMy current stats and measurables:\n{{SELECTED_PRS}}\n\n{{UPCOMING_MEET}}\n\nI would love to learn more about your program and see if I might be a fit for your future roster.\n\nThank you for your time,\n\n{{FIRST_NAME}} {{LAST_NAME}}\nClass of {{GRAD_YEAR}}\nProfile: {{PROFILE_LINK}}`
  },
  {
    id: 'ih_pro_showcase',
    name: 'Showcase / Tournament Schedule',
    isPremium: true,
    subject: 'Showcase Schedule: {{FIRST_NAME}} {{LAST_NAME}} ({{GRAD_YEAR}} {{POSITION}})',
    body: `Coach,\n\nI am {{FIRST_NAME}} {{LAST_NAME}}, a {{GRAD_YEAR}} {{POSITION}}. I am reaching out because {{COLLEGE_NAME}} is a top choice for me, and I wanted to share my upcoming showcase/tournament schedule.\n\n{{UPCOMING_MEET}}\n\n{{WHY_THIS_SCHOOL}}\n\nIf you have a moment, please take a look at my most recent highlight video to see my style of play:\nVideo: {{HIGHLIGHT_VIDEO_LINK}}\n\nI carry a {{GPA}} GPA and am very serious about my studies (intended major: {{MAJOR}}). Please let me know if your staff will be attending my events!\n\nThanks,\n\n{{FIRST_NAME}} {{LAST_NAME}}\nProfile: {{PROFILE_LINK}}`
  },
  {
    id: 'ih_pro_junior_update',
    name: 'Junior Draft / League Update',
    isPremium: true,
    subject: 'Junior Hockey Update: {{FIRST_NAME}} {{LAST_NAME}} ({{GRAD_YEAR}} {{POSITION}})',
    body: `Coach,\n\nI wanted to provide a quick update regarding my development path. I am currently navigating my options for Junior hockey and wanted to keep {{COLLEGE_NAME}} in the loop as my ultimate collegiate goal.\n\n{{WHY_THIS_SCHOOL}}\n\nMy current measurables and stats are:\n{{SELECTED_PRS}}\n\nFilm: {{HIGHLIGHT_VIDEO_LINK}}\n\nI am a {{GPA}} GPA student, and I am focused on developing my game to be ready for the college level. {{UPCOMING_MEET}}\n\nBest,\n\n{{FIRST_NAME}} {{LAST_NAME}}\nProfile: {{PROFILE_LINK}}`
  },
  {
    id: 'ih_pro_full_game',
    name: 'Full Game Footage Update',
    isPremium: true,
    subject: 'Full Game Film: {{FIRST_NAME}} {{LAST_NAME}} ({{GRAD_YEAR}} {{POSITION}})',
    body: `Coach,\n\nI know that as a college evaluator, you often need to see full shifts rather than just highlights. I recently uploaded full, unedited shifts from my last few games.\n\nShift Video: {{HIGHLIGHT_VIDEO_LINK}}\n\n{{WHY_THIS_SCHOOL}}\n\nI have been working heavily on my gap control and puck protection. My current stats are:\n{{SELECTED_PRS}}\n\nI hold a {{GPA}} GPA. {{UPCOMING_MEET}}\n\nI would greatly appreciate any feedback you have on my tape.\n\nBest regards,\n\n{{FIRST_NAME}} {{LAST_NAME}}\nProfile: {{PROFILE_LINK}}`
  },
  {
    id: 'ih_pro_academic',
    name: 'Academic Update',
    isPremium: true,
    subject: 'Academic/Athletic Update: {{FIRST_NAME}} {{LAST_NAME}} (C/O {{GRAD_YEAR}})',
    body: `Coach,\n\nI am reaching out to provide a quick academic update. I just wrapped up my recent grading period and have improved my GPA to a {{GPA}}. Because {{COLLEGE_NAME}} is my top target, I want to assure you I can handle the academic rigor of a {{MAJOR}} degree.\n\nOn the ice, my latest tape is linked here:\nFilm: {{HIGHLIGHT_VIDEO_LINK}}\n\n{{UPCOMING_MEET}}\n\nI would love the opportunity to learn more about the student-athlete experience at your program.\n\nBest,\n\n{{FIRST_NAME}} {{LAST_NAME}}\nProfile: {{PROFILE_LINK}}`
  },
  {
    id: 'ih_pro_visit',
    name: 'Unofficial Visit Request',
    isPremium: true,
    subject: 'Campus Visit Request - {{FIRST_NAME}} {{LAST_NAME}} ({{GRAD_YEAR}} {{POSITION}})',
    body: `Coach,\n\nMy name is {{FIRST_NAME}} {{LAST_NAME}}, a {{GRAD_YEAR}} {{POSITION}}. I am planning to be in the area in the near future and would love the chance to take an unofficial visit to {{COLLEGE_NAME}}.\n\n{{WHY_THIS_SCHOOL}}\n\nI carry a {{GPA}} GPA and am very interested in your {{MAJOR}} department. Here is my latest film:\nFilm: {{HIGHLIGHT_VIDEO_LINK}}\n\nPlease let me know if you might be available for a brief introduction while I am on campus.\n\nThank you,\n\n{{FIRST_NAME}} {{LAST_NAME}}\nProfile: {{PROFILE_LINK}}`
  },
  {
    id: 'ih_pro_congrats',
    name: 'Congrats on Great Weekend',
    isPremium: true,
    subject: 'Great weekend sweep! - {{FIRST_NAME}} {{LAST_NAME}} ({{GRAD_YEAR}})',
    body: `Coach,\n\nI wanted to reach out and say congratulations on the fantastic weekend sweep! The team's special teams execution looked amazing.\n\n{{WHY_THIS_SCHOOL}}\n\nI am training hard to hopefully be part of that kind of success. My tape is linked here: {{HIGHLIGHT_VIDEO_LINK}}\n\nI am a {{GPA}} GPA student. Wishing you the best of luck with the rest of the season!\n\nBest,\n\n{{FIRST_NAME}} {{LAST_NAME}}\nProfile: {{PROFILE_LINK}}`
  },
  {
    id: 'ih_pro_assistant',
    name: 'Direct to Assistant Coach',
    isPremium: true,
    subject: '{{GRAD_YEAR}} {{POSITION}} Prospect: {{FIRST_NAME}} {{LAST_NAME}}',
    body: `Coach,\n\nI am {{FIRST_NAME}} {{LAST_NAME}}, a {{GRAD_YEAR}} {{POSITION}}. I am reaching out to you directly because I know you handle recruiting evaluations for my region and position group.\n\n{{WHY_THIS_SCHOOL}}\n\nI am a hardworking, highly coachable player with a {{GPA}} GPA. My latest tape is linked here:\nFilm: {{HIGHLIGHT_VIDEO_LINK}}\n\nMetrics/Stats:\n{{SELECTED_PRS}}\n\nI would love 5 minutes of your time to discuss your recruiting timeline for the {{GRAD_YEAR}} class.\n\nBest,\n\n{{FIRST_NAME}} {{LAST_NAME}}\nProfile: {{PROFILE_LINK}}`
  },
  {
    id: 'ih_pro_walkon',
    name: 'Walk-On / Roster Spot',
    isPremium: true,
    subject: 'Roster Spot Inquiry: {{FIRST_NAME}} {{LAST_NAME}} ({{GRAD_YEAR}} {{POSITION}})',
    body: `Coach,\n\nMy name is {{FIRST_NAME}} {{LAST_NAME}}, a {{GRAD_YEAR}} {{POSITION}}. {{COLLEGE_NAME}} is my absolute top choice for academics, as I am planning to study {{MAJOR}} and hold a {{GPA}} GPA.\n\n{{WHY_THIS_SCHOOL}}\n\nI am reaching out to express my intense interest in earning a walk-on spot on your roster. I am a dedicated, team-first player who will work incredibly hard in practice every single day.\n\nFilm: {{HIGHLIGHT_VIDEO_LINK}}\n\nI would love to learn more about your walk-on evaluation process.\n\nThank you,\n\n{{FIRST_NAME}} {{LAST_NAME}}\nProfile: {{PROFILE_LINK}}`
  },
  {
    id: 'ih_pro_followup',
    name: 'Gentle Follow-Up',
    isPremium: true,
    subject: 'Following Up - {{FIRST_NAME}} {{LAST_NAME}} ({{GRAD_YEAR}} {{POSITION}})',
    body: `Coach,\n\nI know you have a demanding schedule, so I wanted to send a quick follow-up to reiterate my strong interest in the {{COLLEGE_NAME}} hockey program.\n\n{{WHY_THIS_SCHOOL}}\n\nMy highlight tape is linked below:\nFilm: {{HIGHLIGHT_VIDEO_LINK}}\n\n{{UPCOMING_MEET}}\n\nI have a {{GPA}} GPA and am very serious about finding the right collegiate fit. I would appreciate the opportunity to connect with you soon.\n\nBest,\n\n{{FIRST_NAME}} {{LAST_NAME}}\nProfile: {{PROFILE_LINK}}`
  }
];