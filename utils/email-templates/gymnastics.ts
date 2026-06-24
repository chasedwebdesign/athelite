import { EmailTemplate } from './index';

export const gymnasticsTemplates: EmailTemplate[] = [
  {
    id: 'gym_free_intro',
    name: 'Standard Intro & Scores',
    isPremium: false,
    subject: '{{GRAD_YEAR}} Gymnastics Recruit: {{FIRST_NAME}} {{LAST_NAME}}',
    body: `Coach,\n\nMy name is {{FIRST_NAME}} {{LAST_NAME}}, and I am a class of {{GRAD_YEAR}} gymnast competing for {{HIGH_SCHOOL}} / my club gym. I am reaching out because competing for the {{COLLEGE_NAME}} gymnastics program is a major goal of mine.\n\n{{WHY_THIS_SCHOOL}}\n\nHere are my most recent scores and metrics:\n{{SELECTED_PRS}}\n\nAcademically, I hold a {{GPA}} GPA and plan to pursue a degree in {{MAJOR}}. You can view my routine videos here:\nVideo: {{HIGHLIGHT_VIDEO_LINK}}\n\n{{UPCOMING_MEET}}\n\nI would love to learn more about your recruiting standards and what scores/skills you are looking for in the {{GRAD_YEAR}} class.\n\nBest regards,\n\n{{FIRST_NAME}} {{LAST_NAME}}\nClass of {{GRAD_YEAR}}\nProfile: {{PROFILE_LINK}}`
  },
  {
    id: 'gym_pro_meet_schedule',
    name: 'Meet / Invitationals Schedule',
    isPremium: true,
    subject: 'Meet Schedule: {{FIRST_NAME}} {{LAST_NAME}} (C/O {{GRAD_YEAR}})',
    body: `Coach,\n\nI am {{FIRST_NAME}} {{LAST_NAME}}, a {{GRAD_YEAR}} gymnast. As we move into the main competition season, I wanted to share my upcoming meet schedule in case you or your assistant will be recruiting.\n\n{{UPCOMING_MEET}}\n\n{{WHY_THIS_SCHOOL}}\n\nTo give you an idea of my current routines, my latest video is linked here:\nVideo: {{HIGHLIGHT_VIDEO_LINK}}\n\nI carry a {{GPA}} GPA and am very focused on finding a high-academic program. Please let me know if you will be at any of my events.\n\nBest,\n\n{{FIRST_NAME}} {{LAST_NAME}}\nProfile: {{PROFILE_LINK}}`
  },
  {
    id: 'gym_pro_upgraded_skills',
    name: 'Upgraded Skills Update',
    isPremium: true,
    subject: 'Upgraded Skills / Routine Update: {{FIRST_NAME}} {{LAST_NAME}} ({{GRAD_YEAR}})',
    body: `Coach,\n\nI hope your week is going well. I wanted to send a quick update as I have recently upgraded a few of my skills in practice and successfully competed them.\n\nMy updated scores and metrics are:\n{{SELECTED_PRS}}\n\n{{WHY_THIS_SCHOOL}}\n\nYou can see my new passes/routines here: {{HIGHLIGHT_VIDEO_LINK}}\n\nWith a {{GPA}} GPA (intended major: {{MAJOR}}), {{COLLEGE_NAME}} remains a top choice for me. {{UPCOMING_MEET}}\n\nThank you for your time.\n\n{{FIRST_NAME}} {{LAST_NAME}}\nProfile: {{PROFILE_LINK}}`
  },
  {
    id: 'gym_pro_routine_video',
    name: 'New Routine Video',
    isPremium: true,
    subject: 'New Routine Video: {{FIRST_NAME}} {{LAST_NAME}} ({{GRAD_YEAR}})',
    body: `Coach,\n\nI have been working heavily on my execution and form, and I wanted to share my brand new routine footage with you.\n\nVideo Link: {{HIGHLIGHT_VIDEO_LINK}}\n\nMy current metrics and scores are:\n{{SELECTED_PRS}}\n\n{{WHY_THIS_SCHOOL}}\n\nI am a strong student with a {{GPA}} GPA, and I believe I have the work ethic to thrive in your gym. Please let me know if you have any feedback.\n\nThanks,\n\n{{FIRST_NAME}} {{LAST_NAME}}\nProfile: {{PROFILE_LINK}}`
  },
  {
    id: 'gym_pro_academic',
    name: 'Academic Update',
    isPremium: true,
    subject: 'Academic Update: {{FIRST_NAME}} {{LAST_NAME}} - C/O {{GRAD_YEAR}}',
    body: `Coach,\n\nI am writing to provide an academic update. I just finished my latest semester and have improved my GPA to a {{GPA}}. Knowing the academic rigor of {{COLLEGE_NAME}}, I want to assure you I can handle the workload as a student-athlete studying {{MAJOR}}.\n\nIn the gym, my stats currently sit at:\n{{SELECTED_PRS}}\n\n{{UPCOMING_MEET}}\n\nI would love to arrange a time to speak briefly about your program.\n\nBest regards,\n\n{{FIRST_NAME}} {{LAST_NAME}}\nProfile: {{PROFILE_LINK}}`
  },
  {
    id: 'gym_pro_visit',
    name: 'Campus / Gym Visit Request',
    isPremium: true,
    subject: 'Campus Visit Request - {{FIRST_NAME}} {{LAST_NAME}} ({{GRAD_YEAR}})',
    body: `Coach,\n\nMy name is {{FIRST_NAME}} {{LAST_NAME}}, a {{GRAD_YEAR}} prospect. I am planning to be in the area soon and would absolutely love the opportunity to take an unofficial visit to see the campus and your gymnastics facilities at {{COLLEGE_NAME}}.\n\n{{WHY_THIS_SCHOOL}}\n\nMy current metrics are:\n{{SELECTED_PRS}}\n\nI am serious about my academics, holding a {{GPA}} GPA. Please let me know if you might have time for a brief introduction if I make an unofficial visit.\n\nThank you,\n\n{{FIRST_NAME}} {{LAST_NAME}}\nProfile: {{PROFILE_LINK}}`
  },
  {
    id: 'gym_pro_camp',
    name: 'Camp Registration',
    isPremium: true,
    subject: 'Registered for Camp! - {{FIRST_NAME}} {{LAST_NAME}} ({{GRAD_YEAR}})',
    body: `Coach,\n\nI am very excited to let you know that I am officially registered for your upcoming gymnastics camp at {{COLLEGE_NAME}}.\n\n{{WHY_THIS_SCHOOL}}\n\nBefore I get to the gym, I wanted to provide my latest film so you have an idea of my skill set:\nFilm: {{HIGHLIGHT_VIDEO_LINK}}\n\nStats/Scores:\n{{SELECTED_PRS}}\n\nI am a {{GPA}} GPA student, and I am coming to camp ready to grind and learn from your coaching staff. See you soon!\n\nBest,\n\n{{FIRST_NAME}} {{LAST_NAME}}\nProfile: {{PROFILE_LINK}}`
  },
  {
    id: 'gym_pro_nationals',
    name: 'Regionals / Nationals Update',
    isPremium: true,
    subject: 'Regionals/Nationals Update - {{FIRST_NAME}} {{LAST_NAME}} ({{GRAD_YEAR}})',
    body: `Coach,\n\nI wanted to reach out following my recent performance at the Regional/National Championships. I was able to peak at the right time and put together some great routines under pressure.\n\nMy scores were:\n{{SELECTED_PRS}}\n\n{{WHY_THIS_SCHOOL}}\n\nI carry a {{GPA}} GPA and am highly interested in your program. Full video of my routines from the meet can be found here: {{HIGHLIGHT_VIDEO_LINK}}\n\nBest,\n\n{{FIRST_NAME}} {{LAST_NAME}}\nProfile: {{PROFILE_LINK}}`
  },
  {
    id: 'gym_pro_walkon',
    name: 'Walk-On / Roster Spot Inquiry',
    isPremium: true,
    subject: 'Walk-On Inquiry: {{FIRST_NAME}} {{LAST_NAME}} ({{GRAD_YEAR}})',
    body: `Coach,\n\nMy name is {{FIRST_NAME}} {{LAST_NAME}}, a {{GRAD_YEAR}} gymnast. {{COLLEGE_NAME}} is my absolute top choice for academics (I am pursuing a degree in {{MAJOR}} with a {{GPA}} GPA).\n\n{{WHY_THIS_SCHOOL}}\n\nI am reaching out to express my intense interest in earning a walk-on spot on your roster. I am a dedicated teammate who will work tirelessly in the gym every single day.\n\nVideo: {{HIGHLIGHT_VIDEO_LINK}}\nScores: \n{{SELECTED_PRS}}\n\nI would love to learn more about your walk-on evaluation process.\n\nThank you,\n\n{{FIRST_NAME}} {{LAST_NAME}}\nProfile: {{PROFILE_LINK}}`
  },
  {
    id: 'gym_pro_followup',
    name: 'Gentle Follow-Up',
    isPremium: true,
    subject: 'Following Up - {{FIRST_NAME}} {{LAST_NAME}} ({{GRAD_YEAR}})',
    body: `Coach,\n\nI know you have a demanding schedule, so I wanted to send a brief follow-up to my last email to reiterate my strong desire to compete for {{COLLEGE_NAME}}.\n\n{{WHY_THIS_SCHOOL}}\n\nMy top scores are:\n{{SELECTED_PRS}}\n\n{{UPCOMING_MEET}}\n\nI hold a {{GPA}} GPA and am very focused on my development. I would greatly appreciate a few minutes of your time to discuss the {{GRAD_YEAR}} recruiting class.\n\nBest,\n\n{{FIRST_NAME}} {{LAST_NAME}}\nProfile: {{PROFILE_LINK}}`
  }
];