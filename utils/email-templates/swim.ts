import { EmailTemplate } from './index';

export const swimTemplates: EmailTemplate[] = [
  {
    id: 'swim_free_intro',
    name: 'Standard Introduction',
    isPremium: false,
    subject: 'Class of {{GRAD_YEAR}} Swim Recruit: {{FIRST_NAME}} {{LAST_NAME}}',
    body: `Coach,\n\nMy name is {{FIRST_NAME}} {{LAST_NAME}}, and I am a class of {{GRAD_YEAR}} swimmer at {{HIGH_SCHOOL}}. I am extremely interested in the {{COLLEGE_NAME}} program and wanted to share my times with you.\n\n{{WHY_THIS_SCHOOL}}\n\nHere are my top current times:\n{{SELECTED_PRS}}\n\nI am a dedicated student with a {{GPA}} GPA, planning to major in {{MAJOR}}. \n\n{{UPCOMING_MEET}}\n\nI have linked my full athlete profile below for your review. I would love to learn more about the times you are looking for to secure a roster spot.\n\nBest regards,\n\n{{FIRST_NAME}} {{LAST_NAME}}\n{{HIGH_SCHOOL}} | Class of {{GRAD_YEAR}}\nProfile: {{PROFILE_LINK}}\nVideo: {{HIGHLIGHT_VIDEO_LINK}}`
  },
  {
    id: 'swim_pro_taper',
    name: 'Post-Taper Meet Update',
    isPremium: true,
    subject: 'New Taper Times: {{FIRST_NAME}} {{LAST_NAME}} ({{GRAD_YEAR}})',
    body: `Coach,\n\nI am {{FIRST_NAME}} {{LAST_NAME}}, a {{GRAD_YEAR}} prospect from {{HIGH_SCHOOL}}. I wanted to send a quick update following my recent championship meet where I was fully rested and tapered.\n\nI achieved new personal bests in the following events:\n{{SELECTED_PRS}}\n\n{{WHY_THIS_SCHOOL}}\n\nWith a {{GPA}} GPA, {{COLLEGE_NAME}} remains a top choice for me academically and athletically. {{UPCOMING_MEET}}\n\nThank you for your time, and I look forward to potentially speaking with you soon.\n\n{{FIRST_NAME}} {{LAST_NAME}}\nProfile: {{PROFILE_LINK}}`
  },
  {
    id: 'swim_pro_club_update',
    name: 'Club Season Kickoff',
    isPremium: true,
    subject: 'Short Course/Club Update - {{FIRST_NAME}} {{LAST_NAME}} ({{GRAD_YEAR}})',
    body: `Coach,\n\nAs we transition into the main club season, I wanted to reach out to ensure I am on your recruiting radar for the {{GRAD_YEAR}} class.\n\n{{WHY_THIS_SCHOOL}}\n\nMy focus in the water right now is heavily on technical execution and endurance. My current baseline times are:\n{{SELECTED_PRS}}\n\nI maintain a {{GPA}} GPA and am very interested in studying {{MAJOR}}. I would appreciate any feedback on where my times fit within your current roster.\n\nBest,\n\n{{FIRST_NAME}} {{LAST_NAME}}\nProfile: {{PROFILE_LINK}}`
  },
  {
    id: 'swim_pro_video',
    name: 'Stroke / Technique Video',
    isPremium: true,
    subject: 'Technique Video & Times: {{FIRST_NAME}} {{LAST_NAME}} ({{GRAD_YEAR}})',
    body: `Coach,\n\nMy name is {{FIRST_NAME}} {{LAST_NAME}}, a {{GRAD_YEAR}} swimmer from {{HIGH_SCHOOL}}. I recently recorded some underwater and race-pace technique video that I wanted to share with you.\n\nVideo Link: {{HIGHLIGHT_VIDEO_LINK}}\n\nMy top times are currently:\n{{SELECTED_PRS}}\n\n{{WHY_THIS_SCHOOL}}\n\nI am a strong student with a {{GPA}} GPA, and I believe I have the work ethic to thrive in your training environment. Please let me know if you have any feedback on my strokes.\n\nThanks,\n\n{{FIRST_NAME}} {{LAST_NAME}}\nProfile: {{PROFILE_LINK}}`
  },
  {
    id: 'swim_pro_visit',
    name: 'Junior Day / Visit Request',
    isPremium: true,
    subject: 'Campus Visit Inquiry - {{FIRST_NAME}} {{LAST_NAME}} ({{GRAD_YEAR}})',
    body: `Coach,\n\nI am {{FIRST_NAME}} {{LAST_NAME}}, a {{GRAD_YEAR}} recruit from {{HIGH_SCHOOL}}. I am highly interested in {{COLLEGE_NAME}} and am hoping to visit campus in the near future.\n\n{{WHY_THIS_SCHOOL}}\n\nMy current top times are:\n{{SELECTED_PRS}}\n\nI take my academics very seriously, holding a {{GPA}} GPA. Could you let me know if you will be hosting any prospect days soon, or if you would have time for a brief introduction if I make an unofficial visit?\n\nThank you,\n\n{{FIRST_NAME}} {{LAST_NAME}}\nProfile: {{PROFILE_LINK}}`
  },
  {
    id: 'swim_pro_academic',
    name: 'Academic/Test Score Update',
    isPremium: true,
    subject: 'Academic Update: {{FIRST_NAME}} {{LAST_NAME}} - C/O {{GRAD_YEAR}}',
    body: `Coach,\n\nI am writing to provide an academic update. I just finished my latest semester and have improved my GPA to a {{GPA}}. Knowing the academic rigor of {{COLLEGE_NAME}}, I want to assure you I can handle the workload as a student-athlete studying {{MAJOR}}.\n\nIn the pool, my times currently sit at:\n{{SELECTED_PRS}}\n\n{{UPCOMING_MEET}}\n\nI would love to arrange a time to speak briefly about your program.\n\nBest regards,\n\n{{FIRST_NAME}} {{LAST_NAME}}\nProfile: {{PROFILE_LINK}}`
  },
  {
    id: 'swim_pro_camp',
    name: 'Camp Registration',
    isPremium: true,
    subject: 'Registered for Camp! {{FIRST_NAME}} {{LAST_NAME}} ({{GRAD_YEAR}})',
    body: `Coach,\n\nI am very excited to inform you that I have registered for your upcoming swim camp. Getting to experience your coaching style directly is something I am really looking forward to.\n\n{{WHY_THIS_SCHOOL}}\n\nFor your reference before the camp, my top times are:\n{{SELECTED_PRS}}\n\nI am a {{GRAD_YEAR}} student with a {{GPA}} GPA. See you on the pool deck soon!\n\nBest,\n\n{{FIRST_NAME}} {{LAST_NAME}}\nProfile: {{PROFILE_LINK}}`
  },
  {
    id: 'swim_pro_congrats',
    name: 'Congrats on Conference/Dual Win',
    isPremium: true,
    subject: 'Congrats on the win! - {{FIRST_NAME}} {{LAST_NAME}} ({{GRAD_YEAR}})',
    body: `Coach,\n\nI wanted to reach out and say congratulations on the team's performance at the recent meet. Watching the team compete at such a high level reinforces why {{COLLEGE_NAME}} is my top choice.\n\n{{WHY_THIS_SCHOOL}}\n\nI am training hard to hopefully contribute to that culture one day. My times are currently:\n{{SELECTED_PRS}}\n\nWith a {{GPA}} GPA, I am highly focused on my goals. Best of luck with the rest of the season.\n\n{{FIRST_NAME}} {{LAST_NAME}}\nProfile: {{PROFILE_LINK}}`
  },
  {
    id: 'swim_pro_application',
    name: 'Application Submitted',
    isPremium: true,
    subject: 'Admissions Update: {{FIRST_NAME}} {{LAST_NAME}} ({{GRAD_YEAR}})',
    body: `Coach,\n\nI am thrilled to share that I have officially applied to {{COLLEGE_NAME}}! I am hoping to be admitted to study {{MAJOR}}.\n\n{{WHY_THIS_SCHOOL}}\n\nAs a reminder, I am a {{GRAD_YEAR}} swimmer with a {{GPA}} GPA. My best events and times are:\n{{SELECTED_PRS}}\n\nI would absolutely love the opportunity to be a part of your team if admitted. \n\nThank you,\n\n{{FIRST_NAME}} {{LAST_NAME}}\nProfile: {{PROFILE_LINK}}`
  },
  {
    id: 'swim_pro_followup',
    name: 'Gentle Follow-Up',
    isPremium: true,
    subject: 'Following up - {{FIRST_NAME}} {{LAST_NAME}}, {{GRAD_YEAR}} Swimmer',
    body: `Coach,\n\nI know you have a demanding schedule, so I wanted to send a brief follow-up to my last email to reiterate my strong desire to swim for {{COLLEGE_NAME}}.\n\n{{WHY_THIS_SCHOOL}}\n\nMy top times are:\n{{SELECTED_PRS}}\n\n{{UPCOMING_MEET}}\n\nI hold a {{GPA}} GPA and am very focused on my development. I would greatly appreciate a few minutes of your time to discuss the {{GRAD_YEAR}} recruiting class.\n\nBest,\n\n{{FIRST_NAME}} {{LAST_NAME}}\nProfile: {{PROFILE_LINK}}`
  }
];