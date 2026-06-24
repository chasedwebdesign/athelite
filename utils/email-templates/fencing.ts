import { EmailTemplate } from './index';

export const fencingTemplates: EmailTemplate[] = [
  {
    id: 'fen_free_intro',
    name: 'Standard Intro & Weapon',
    isPremium: false,
    subject: '{{GRAD_YEAR}} {{POSITION}} Recruit - {{FIRST_NAME}} {{LAST_NAME}}',
    body: `Coach,\n\nMy name is {{FIRST_NAME}} {{LAST_NAME}}, a class of {{GRAD_YEAR}} {{POSITION}} fencer for {{HIGH_SCHOOL}} / my club. I am very interested in the academic and athletic opportunities at {{COLLEGE_NAME}}.\n\n{{WHY_THIS_SCHOOL}}\n\nOn the strip, I am an aggressive and tactical {{POSITION}} fencer. In the classroom, I maintain a {{GPA}} GPA and want to pursue a degree in {{MAJOR}}.\n\nHere is a link to my recent bout footage:\nVideo: {{HIGHLIGHT_VIDEO_LINK}}\n\nMy current rating and metrics:\n{{SELECTED_PRS}}\n\n{{UPCOMING_MEET}}\n\nI would love to learn more about your program and see if I might be a fit for your roster.\n\nThank you for your time,\n\n{{FIRST_NAME}} {{LAST_NAME}}\nClass of {{GRAD_YEAR}}\nProfile: {{PROFILE_LINK}}`
  },
  {
    id: 'fen_pro_nac_schedule',
    name: 'NAC / Tournament Schedule',
    isPremium: true,
    subject: 'NAC / Tournament Schedule: {{FIRST_NAME}} {{LAST_NAME}} ({{GRAD_YEAR}} {{POSITION}})',
    body: `Coach,\n\nI am {{FIRST_NAME}} {{LAST_NAME}}, a {{GRAD_YEAR}} {{POSITION}} fencer. I am reaching out because {{COLLEGE_NAME}} is a top choice for me, and I wanted to share my upcoming NAC/tournament schedule.\n\n{{UPCOMING_MEET}}\n\n{{WHY_THIS_SCHOOL}}\n\nIf you have a moment, please take a look at my most recent bout video to see my style of fencing:\nVideo: {{HIGHLIGHT_VIDEO_LINK}}\n\nI carry a {{GPA}} GPA and am very serious about my studies (intended major: {{MAJOR}}). Please let me know if your staff will be attending my events!\n\nThanks,\n\n{{FIRST_NAME}} {{LAST_NAME}}\nProfile: {{PROFILE_LINK}}`
  },
  {
    id: 'fen_pro_rating_update',
    name: 'Rating / Points Update',
    isPremium: true,
    subject: 'Updated Rating/Points: {{FIRST_NAME}} {{LAST_NAME}} ({{GRAD_YEAR}} {{POSITION}})',
    body: `Coach,\n\nI wanted to provide a quick update regarding my fencing resume. I recently competed at a major regional/national event and was able to update my rating/points standing.\n\n{{WHY_THIS_SCHOOL}}\n\nMy current measurables and stats are:\n{{SELECTED_PRS}}\n\nFilm: {{HIGHLIGHT_VIDEO_LINK}}\n\nI am a {{GPA}} GPA student, and I am focused on developing my tactical game to be ready for the college level. {{UPCOMING_MEET}}\n\nBest,\n\n{{FIRST_NAME}} {{LAST_NAME}}\nProfile: {{PROFILE_LINK}}`
  },
  {
    id: 'fen_pro_bout_video',
    name: 'New Bout Footage Update',
    isPremium: true,
    subject: 'New Bout Film: {{FIRST_NAME}} {{LAST_NAME}} ({{GRAD_YEAR}} {{POSITION}})',
    body: `Coach,\n\nI know that evaluating footwork and timing is crucial, so I recently uploaded unedited bouts from my last few tournaments.\n\nBout Video: {{HIGHLIGHT_VIDEO_LINK}}\n\n{{WHY_THIS_SCHOOL}}\n\nI have been working heavily on my distance control and parry-riposte. My current stats are:\n{{SELECTED_PRS}}\n\nI hold a {{GPA}} GPA. {{UPCOMING_MEET}}\n\nI would greatly appreciate any feedback you have on my tape.\n\nBest regards,\n\n{{FIRST_NAME}} {{LAST_NAME}}\nProfile: {{PROFILE_LINK}}`
  },
  {
    id: 'fen_pro_academic',
    name: 'Academic Update',
    isPremium: true,
    subject: 'Academic/Athletic Update: {{FIRST_NAME}} {{LAST_NAME}} (C/O {{GRAD_YEAR}})',
    body: `Coach,\n\nI am reaching out to provide a quick academic update. I just wrapped up my recent grading period and have improved my GPA to a {{GPA}}. Because {{COLLEGE_NAME}} is my top target, I want to assure you I can handle the academic rigor of a {{MAJOR}} degree.\n\nOn the strip, my latest tape is linked here:\nFilm: {{HIGHLIGHT_VIDEO_LINK}}\n\n{{UPCOMING_MEET}}\n\nI would love the opportunity to learn more about the student-athlete experience at your program.\n\nBest,\n\n{{FIRST_NAME}} {{LAST_NAME}}\nProfile: {{PROFILE_LINK}}`
  },
  {
    id: 'fen_pro_visit',
    name: 'Unofficial Visit Request',
    isPremium: true,
    subject: 'Campus Visit Request - {{FIRST_NAME}} {{LAST_NAME}} ({{GRAD_YEAR}} {{POSITION}})',
    body: `Coach,\n\nMy name is {{FIRST_NAME}} {{LAST_NAME}}, a {{GRAD_YEAR}} {{POSITION}}. I am planning to be in the area in the near future and would love the chance to take an unofficial visit to {{COLLEGE_NAME}}.\n\n{{WHY_THIS_SCHOOL}}\n\nI carry a {{GPA}} GPA and am very interested in your {{MAJOR}} department. Here is my latest film:\nFilm: {{HIGHLIGHT_VIDEO_LINK}}\n\nPlease let me know if you might be available for a brief introduction while I am on campus.\n\nThank you,\n\n{{FIRST_NAME}} {{LAST_NAME}}\nProfile: {{PROFILE_LINK}}`
  },
  {
    id: 'fen_pro_congrats',
    name: 'Congrats on Meet Performance',
    isPremium: true,
    subject: 'Great result this weekend! - {{FIRST_NAME}} {{LAST_NAME}} ({{GRAD_YEAR}})',
    body: `Coach,\n\nI wanted to reach out and say congratulations on the team's fantastic performance this weekend! The squad's depth looked amazing.\n\n{{WHY_THIS_SCHOOL}}\n\nI am training hard to hopefully be part of that kind of success. My tape is linked here: {{HIGHLIGHT_VIDEO_LINK}}\n\nI am a {{GPA}} GPA student. Wishing you the best of luck with the rest of the season!\n\nBest,\n\n{{FIRST_NAME}} {{LAST_NAME}}\nProfile: {{PROFILE_LINK}}`
  },
  {
    id: 'fen_pro_assistant',
    name: 'Direct to Weapon/Assistant Coach',
    isPremium: true,
    subject: '{{GRAD_YEAR}} {{POSITION}} Prospect: {{FIRST_NAME}} {{LAST_NAME}}',
    body: `Coach,\n\nI am {{FIRST_NAME}} {{LAST_NAME}}, a {{GRAD_YEAR}} {{POSITION}}. I am reaching out to you directly because I know you handle the {{POSITION}} squad evaluations for the team.\n\n{{WHY_THIS_SCHOOL}}\n\nI am a hardworking, highly coachable fencer with a {{GPA}} GPA. My latest tape is linked here:\nFilm: {{HIGHLIGHT_VIDEO_LINK}}\n\nMetrics/Stats:\n{{SELECTED_PRS}}\n\nI would love 5 minutes of your time to discuss your recruiting timeline for the {{GRAD_YEAR}} class.\n\nBest,\n\n{{FIRST_NAME}} {{LAST_NAME}}\nProfile: {{PROFILE_LINK}}`
  },
  {
    id: 'fen_pro_walkon',
    name: 'Walk-On / Roster Spot',
    isPremium: true,
    subject: 'Roster Spot Inquiry: {{FIRST_NAME}} {{LAST_NAME}} ({{GRAD_YEAR}} {{POSITION}})',
    body: `Coach,\n\nMy name is {{FIRST_NAME}} {{LAST_NAME}}, a {{GRAD_YEAR}} {{POSITION}}. {{COLLEGE_NAME}} is my absolute top choice for academics, as I am planning to study {{MAJOR}} and hold a {{GPA}} GPA.\n\n{{WHY_THIS_SCHOOL}}\n\nI am reaching out to express my intense interest in earning a walk-on spot on your roster. I am a dedicated, team-first fencer who will work incredibly hard in practice every single day.\n\nFilm: {{HIGHLIGHT_VIDEO_LINK}}\n\nI would love to learn more about your walk-on evaluation process.\n\nThank you,\n\n{{FIRST_NAME}} {{LAST_NAME}}\nProfile: {{PROFILE_LINK}}`
  },
  {
    id: 'fen_pro_followup',
    name: 'Gentle Follow-Up',
    isPremium: true,
    subject: 'Following Up - {{FIRST_NAME}} {{LAST_NAME}} ({{GRAD_YEAR}} {{POSITION}})',
    body: `Coach,\n\nI know you have a demanding schedule, so I wanted to send a quick follow-up to reiterate my strong interest in the {{COLLEGE_NAME}} fencing program.\n\n{{WHY_THIS_SCHOOL}}\n\nMy highlight tape is linked below:\nFilm: {{HIGHLIGHT_VIDEO_LINK}}\n\n{{UPCOMING_MEET}}\n\nI have a {{GPA}} GPA and am very serious about finding the right collegiate fit. I would appreciate the opportunity to connect with you soon.\n\nBest,\n\n{{FIRST_NAME}} {{LAST_NAME}}\nProfile: {{PROFILE_LINK}}`
  }
];