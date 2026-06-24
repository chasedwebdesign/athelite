import { EmailTemplate } from './index';

export const lacrosseTemplates: EmailTemplate[] = [
  {
    id: 'lax_free_intro',
    name: 'Standard Intro',
    isPremium: false,
    subject: '{{GRAD_YEAR}} {{POSITION}} - {{FIRST_NAME}} {{LAST_NAME}} Highlight Video',
    body: `Coach,\n\nMy name is {{FIRST_NAME}} {{LAST_NAME}}, and I am a class of {{GRAD_YEAR}} {{POSITION}} playing at {{HIGH_SCHOOL}}. I am reaching out to express my strong interest in the {{COLLEGE_NAME}} lacrosse program.\n\n{{WHY_THIS_SCHOOL}}\n\nI am a fast, physical, and high-IQ {{POSITION}}. I am also an excellent student, carrying a {{GPA}} GPA with an intended major of {{MAJOR}}.\n\nPlease find my most recent highlight reel linked below:\nFilm: {{HIGHLIGHT_VIDEO_LINK}}\n\nHere are my current metrics/stats:\n{{SELECTED_PRS}}\n\n{{UPCOMING_MEET}}\n\nI would love to hear your feedback and learn about your recruiting process for the {{GRAD_YEAR}} class.\n\nBest,\n\n{{FIRST_NAME}} {{LAST_NAME}}\n{{HIGH_SCHOOL}} | Class of {{GRAD_YEAR}}\nProfile: {{PROFILE_LINK}}`
  },
  {
    id: 'lax_pro_club_schedule',
    name: 'Summer Club Schedule',
    isPremium: true,
    subject: 'Summer Club Schedule: {{FIRST_NAME}} {{LAST_NAME}} ({{GRAD_YEAR}} {{POSITION}})',
    body: `Coach,\n\nI hope your recruiting season is going well. I am {{FIRST_NAME}} {{LAST_NAME}}, a {{GRAD_YEAR}} {{POSITION}} from {{HIGH_SCHOOL}}. As we move into the main summer club circuit, I wanted to provide an update on my tournament schedule.\n\n{{UPCOMING_MEET}}\n\n{{WHY_THIS_SCHOOL}}\n\nI recently updated my film to include my best clips from the spring high school season:\nNew Film: {{HIGHLIGHT_VIDEO_LINK}}\n\nWith a {{GPA}} GPA and plans to study {{MAJOR}}, I hope you or your staff get a chance to see me play live this summer.\n\nThank you,\n\n{{FIRST_NAME}} {{LAST_NAME}}\nProfile: {{PROFILE_LINK}}`
  },
  {
    id: 'lax_pro_prospect_day',
    name: 'Prospect Day Registration',
    isPremium: true,
    subject: 'Attending Prospect Day - {{FIRST_NAME}} {{LAST_NAME}} ({{GRAD_YEAR}})',
    body: `Coach,\n\nI wanted to personally let you know that I am registered for your upcoming Prospect Day at {{COLLEGE_NAME}}. Playing for your program is a massive goal of mine, and I am excited to compete on your field.\n\n{{WHY_THIS_SCHOOL}}\n\nFor some context before I arrive, I am a {{POSITION}} with a {{GPA}} GPA. Here is my latest tape:\nFilm: {{HIGHLIGHT_VIDEO_LINK}}\n\nMy metrics/stats:\n{{SELECTED_PRS}}\n\nI look forward to meeting the staff and proving my abilities in person.\n\nBest,\n\n{{FIRST_NAME}} {{LAST_NAME}}\nProfile: {{PROFILE_LINK}}`
  },
  {
    id: 'lax_pro_film_update',
    name: 'End of Summer Film Update',
    isPremium: true,
    subject: 'Updated Summer Reel: {{FIRST_NAME}} {{LAST_NAME}} ({{GRAD_YEAR}} {{POSITION}})',
    body: `Coach,\n\nThe summer circuit just wrapped up, and I wanted to send over my updated highlight reel encompassing my best plays against top-tier club competition.\n\nSummer Tape: {{HIGHLIGHT_VIDEO_LINK}}\n\n{{WHY_THIS_SCHOOL}}\n\nI felt really strong at the {{POSITION}} spot this summer. My current stats/measurables are:\n{{SELECTED_PRS}}\n\nI am heading into my next high school year carrying a {{GPA}} GPA. {{UPCOMING_MEET}}\n\nI would love to arrange a time to speak about your {{GRAD_YEAR}} recruiting needs.\n\nBest regards,\n\n{{FIRST_NAME}} {{LAST_NAME}}\nProfile: {{PROFILE_LINK}}`
  },
  {
    id: 'lax_pro_academic',
    name: 'Academic Update',
    isPremium: true,
    subject: 'Academic Update: {{FIRST_NAME}} {{LAST_NAME}} - C/O {{GRAD_YEAR}}',
    body: `Coach,\n\nI am {{FIRST_NAME}} {{LAST_NAME}}, a {{GRAD_YEAR}} {{POSITION}} from {{HIGH_SCHOOL}}. Because {{COLLEGE_NAME}} is my top target school, I wanted to provide an update on my academics.\n\nI just finished the term and my GPA is now a {{GPA}}. I am highly focused on earning admission to study {{MAJOR}}.\n\nOn the field, my tape is linked here:\nFilm: {{HIGHLIGHT_VIDEO_LINK}}\n\n{{UPCOMING_MEET}}\n\nI would appreciate the chance to discuss how I might fit into your program both academically and athletically.\n\nBest,\n\n{{FIRST_NAME}} {{LAST_NAME}}\nProfile: {{PROFILE_LINK}}`
  },
  {
    id: 'lax_pro_visit',
    name: 'Unofficial Visit Request',
    isPremium: true,
    subject: 'Campus Visit Request - {{FIRST_NAME}} {{LAST_NAME}} ({{GRAD_YEAR}} {{POSITION}})',
    body: `Coach,\n\nI am planning to be in the area in the coming weeks and would absolutely love the opportunity to take an unofficial visit to {{COLLEGE_NAME}}.\n\n{{WHY_THIS_SCHOOL}}\n\nI am a {{GRAD_YEAR}} {{POSITION}} with a {{GPA}} GPA. My latest highlights are here:\nFilm: {{HIGHLIGHT_VIDEO_LINK}}\n\nPlease let me know if you or an assistant coach might have a few minutes to meet while I am on campus.\n\nThank you for your time,\n\n{{FIRST_NAME}} {{LAST_NAME}}\nProfile: {{PROFILE_LINK}}`
  },
  {
    id: 'lax_pro_position_coach',
    name: 'Direct to Positional Coach',
    isPremium: true,
    subject: '{{GRAD_YEAR}} {{POSITION}} Evaluation: {{FIRST_NAME}} {{LAST_NAME}}',
    body: `Coach,\n\nMy name is {{FIRST_NAME}} {{LAST_NAME}}, a class of {{GRAD_YEAR}} {{POSITION}} at {{HIGH_SCHOOL}}. I am reaching out to you directly because of the way you develop the {{POSITION}} group at {{COLLEGE_NAME}}.\n\n{{WHY_THIS_SCHOOL}}\n\nI am a highly coachable player who thrives on ground balls and transition play. My tape is here:\nFilm: {{HIGHLIGHT_VIDEO_LINK}}\n\nMetrics:\n{{SELECTED_PRS}}\n\nI maintain a {{GPA}} GPA. I would love to get your direct feedback on my film when you have a moment.\n\nBest,\n\n{{FIRST_NAME}} {{LAST_NAME}}\nProfile: {{PROFILE_LINK}}`
  },
  {
    id: 'lax_pro_congrats',
    name: 'Congrats on Recent Win',
    isPremium: true,
    subject: 'Great win! - {{FIRST_NAME}} {{LAST_NAME}} ({{GRAD_YEAR}} {{POSITION}})',
    body: `Coach,\n\nI tuned into the game this weekend and wanted to say congratulations on a massive win! The team’s ride and offensive execution looked incredible.\n\n{{WHY_THIS_SCHOOL}}\n\nI am working hard to hopefully join that culture. As a reminder, my tape is linked here:\nFilm: {{HIGHLIGHT_VIDEO_LINK}}\n\nGood luck with the rest of the season, I will be watching!\n\nBest,\n\n{{FIRST_NAME}} {{LAST_NAME}}\nProfile: {{PROFILE_LINK}}`
  },
  {
    id: 'lax_pro_application',
    name: 'Application Submitted',
    isPremium: true,
    subject: 'Application Submitted: {{FIRST_NAME}} {{LAST_NAME}} ({{GRAD_YEAR}})',
    body: `Coach,\n\nI am very excited to let you know that I have officially submitted my application to {{COLLEGE_NAME}}! I am hoping to be admitted into the {{MAJOR}} program.\n\n{{WHY_THIS_SCHOOL}}\n\nI am a {{GRAD_YEAR}} {{POSITION}} with a {{GPA}} GPA. My film and stats are here:\nFilm: {{HIGHLIGHT_VIDEO_LINK}}\n{{SELECTED_PRS}}\n\nI would love to discuss the possibility of walking on or competing for a roster spot if admitted.\n\nThank you,\n\n{{FIRST_NAME}} {{LAST_NAME}}\nProfile: {{PROFILE_LINK}}`
  },
  {
    id: 'lax_pro_followup',
    name: 'Gentle Follow-Up',
    isPremium: true,
    subject: 'Following Up - {{FIRST_NAME}} {{LAST_NAME}} ({{GRAD_YEAR}} {{POSITION}})',
    body: `Coach,\n\nI know the season keeps you extremely busy, so I wanted to send a quick follow-up to my last email regarding my interest in the {{COLLEGE_NAME}} lacrosse program.\n\n{{WHY_THIS_SCHOOL}}\n\nMy tape is linked below:\nFilm: {{HIGHLIGHT_VIDEO_LINK}}\n\n{{UPCOMING_MEET}}\n\nI carry a {{GPA}} GPA and am very serious about finding a home at the next level. I would appreciate the chance to connect with you soon.\n\nBest,\n\n{{FIRST_NAME}} {{LAST_NAME}}\nProfile: {{PROFILE_LINK}}`
  }
];