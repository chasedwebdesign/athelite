import { EmailTemplate } from './index';

export const golfTemplates: EmailTemplate[] = [
  {
    id: 'golf_free_intro',
    name: 'Standard Intro',
    isPremium: false,
    subject: '{{GRAD_YEAR}} Golf Recruit: {{FIRST_NAME}} {{LAST_NAME}}',
    body: `Coach,\n\nMy name is {{FIRST_NAME}} {{LAST_NAME}}, and I am a class of {{GRAD_YEAR}} golfer at {{HIGH_SCHOOL}}. I am reaching out because competing for the {{COLLEGE_NAME}} golf program is a major goal of mine.\n\n{{WHY_THIS_SCHOOL}}\n\nHere are my most recent scoring averages and metrics:\n{{SELECTED_PRS}}\n\nAcademically, I hold a {{GPA}} GPA and plan to pursue a degree in {{MAJOR}}. You can view my swing video here:\nVideo: {{HIGHLIGHT_VIDEO_LINK}}\n\n{{UPCOMING_MEET}}\n\nI would love to learn more about your recruiting standards and what scores you are looking for in the {{GRAD_YEAR}} class.\n\nBest regards,\n\n{{FIRST_NAME}} {{LAST_NAME}}\n{{HIGH_SCHOOL}} | Class of {{GRAD_YEAR}}\nProfile: {{PROFILE_LINK}}`
  },
  {
    id: 'golf_pro_tournament_schedule',
    name: 'Tournament Schedule',
    isPremium: true,
    subject: 'Upcoming Tournament Schedule: {{FIRST_NAME}} {{LAST_NAME}} (C/O {{GRAD_YEAR}})',
    body: `Coach,\n\nI am {{FIRST_NAME}} {{LAST_NAME}}, a {{GRAD_YEAR}} golfer from {{HIGH_SCHOOL}}. As we move into the main summer tournament season, I wanted to share my upcoming schedule (AJGA/State/Regional events) in case you will be recruiting.\n\n{{UPCOMING_MEET}}\n\n{{WHY_THIS_SCHOOL}}\n\nTo give you an idea of my mechanics, my latest swing video is linked here:\nSwing Video: {{HIGHLIGHT_VIDEO_LINK}}\n\nI carry a {{GPA}} GPA and am very focused on finding a high-academic program. Please let me know if you will be at any of my events.\n\nBest,\n\n{{FIRST_NAME}} {{LAST_NAME}}\nProfile: {{PROFILE_LINK}}`
  },
  {
    id: 'golf_pro_tournament_result',
    name: 'Tournament Result Update',
    isPremium: true,
    subject: 'Recent Tournament Result: {{FIRST_NAME}} {{LAST_NAME}} ({{GRAD_YEAR}})',
    body: `Coach,\n\nI hope your week is going well. I wanted to send a quick update following a strong performance at my recent tournament.\n\nI shot a personal best / top finish, and my updated scoring metrics are:\n{{SELECTED_PRS}}\n\n{{WHY_THIS_SCHOOL}}\n\nWith a {{GPA}} GPA (intended major: {{MAJOR}}), {{COLLEGE_NAME}} remains a top choice for me. {{UPCOMING_MEET}}\n\nThank you for your time, and I hope to hear from you soon.\n\n{{FIRST_NAME}} {{LAST_NAME}}\nProfile: {{PROFILE_LINK}}`
  },
  {
    id: 'golf_pro_swing_video',
    name: 'New Swing Video Update',
    isPremium: true,
    subject: 'Updated Swing Video: {{FIRST_NAME}} {{LAST_NAME}} ({{GRAD_YEAR}})',
    body: `Coach,\n\nI have been working heavily with my swing coach on my ball striking and consistency, and I wanted to share my brand new swing video with you.\n\nVideo Link: {{HIGHLIGHT_VIDEO_LINK}}\n\nMy current metrics and scoring averages are:\n{{SELECTED_PRS}}\n\n{{WHY_THIS_SCHOOL}}\n\nI am a strong student with a {{GPA}} GPA, and I believe I have the work ethic to thrive in your program. Please let me know if you have any feedback on my swing mechanics.\n\nThanks,\n\n{{FIRST_NAME}} {{LAST_NAME}}\nProfile: {{PROFILE_LINK}}`
  },
  {
    id: 'golf_pro_academic',
    name: 'Academic Update',
    isPremium: true,
    subject: 'Academic Update: {{FIRST_NAME}} {{LAST_NAME}} - C/O {{GRAD_YEAR}}',
    body: `Coach,\n\nI am writing to provide an academic update. I just finished my latest semester and have improved my GPA to a {{GPA}}. Knowing the academic rigor of {{COLLEGE_NAME}}, I want to assure you I can handle the workload as a student-athlete studying {{MAJOR}}.\n\nOn the course, my stats currently sit at:\n{{SELECTED_PRS}}\n\n{{UPCOMING_MEET}}\n\nI would love to arrange a time to speak briefly about your program.\n\nBest regards,\n\n{{FIRST_NAME}} {{LAST_NAME}}\nProfile: {{PROFILE_LINK}}`
  },
  {
    id: 'golf_pro_visit',
    name: 'Campus / Facilities Visit Request',
    isPremium: true,
    subject: 'Campus Visit Request - {{FIRST_NAME}} {{LAST_NAME}} ({{GRAD_YEAR}})',
    body: `Coach,\n\nMy name is {{FIRST_NAME}} {{LAST_NAME}}, a {{GRAD_YEAR}} prospect from {{HIGH_SCHOOL}}. I am planning to be in the area soon and would absolutely love the opportunity to take an unofficial visit to see the campus and your golf facilities at {{COLLEGE_NAME}}.\n\n{{WHY_THIS_SCHOOL}}\n\nMy current metrics are:\n{{SELECTED_PRS}}\n\nI am serious about my academics, holding a {{GPA}} GPA. Please let me know if you might have time for a brief introduction if I make an unofficial visit.\n\nThank you,\n\n{{FIRST_NAME}} {{LAST_NAME}}\nProfile: {{PROFILE_LINK}}`
  },
  {
    id: 'golf_pro_checkin',
    name: 'Recruiting Timeline Request',
    isPremium: true,
    subject: 'Recruiting Timeline Query: {{FIRST_NAME}} {{LAST_NAME}} ({{GRAD_YEAR}})',
    body: `Coach,\n\nI am {{FIRST_NAME}} {{LAST_NAME}}, a {{GRAD_YEAR}} golfer playing for {{HIGH_SCHOOL}}. I am reaching out to check in on where you are at with the {{GRAD_YEAR}} recruiting class.\n\n{{WHY_THIS_SCHOOL}}\n\nMy latest metrics and scoring averages are:\n{{SELECTED_PRS}}\n\nSwing Video: {{HIGHLIGHT_VIDEO_LINK}}\n\nWith a {{GPA}} GPA, I am highly interested in your program. I would love a few minutes on the phone to discuss what you look for in recruits.\n\nBest,\n\n{{FIRST_NAME}} {{LAST_NAME}}\nProfile: {{PROFILE_LINK}}`
  },
  {
    id: 'golf_pro_congrats',
    name: 'Congrats on Team Performance',
    isPremium: true,
    subject: 'Congrats on the great event! - {{FIRST_NAME}} {{LAST_NAME}} ({{GRAD_YEAR}})',
    body: `Coach,\n\nI wanted to reach out and say congratulations on the team's performance at the recent invitational. Watching the team compete reinforces why {{COLLEGE_NAME}} is my top choice.\n\n{{WHY_THIS_SCHOOL}}\n\nI am training hard to hopefully contribute to that culture one day. My metrics are currently:\n{{SELECTED_PRS}}\n\nWith a {{GPA}} GPA, I am highly focused on my goals. Best of luck with the rest of the season.\n\n{{FIRST_NAME}} {{LAST_NAME}}\nProfile: {{PROFILE_LINK}}`
  },
  {
    id: 'golf_pro_walkon',
    name: 'Walk-On / Roster Spot Inquiry',
    isPremium: true,
    subject: 'Walk-On Inquiry: {{FIRST_NAME}} {{LAST_NAME}} ({{GRAD_YEAR}})',
    body: `Coach,\n\nMy name is {{FIRST_NAME}} {{LAST_NAME}}, a {{GRAD_YEAR}} golfer out of {{HIGH_SCHOOL}}. {{COLLEGE_NAME}} is my absolute top choice for academics (I am pursuing a degree in {{MAJOR}} with a {{GPA}} GPA).\n\n{{WHY_THIS_SCHOOL}}\n\nI am reaching out to express my intense interest in earning a walk-on spot on your roster. I am a dedicated player who will push the team in qualifying and practice.\n\nSwing Video: {{HIGHLIGHT_VIDEO_LINK}}\nMetrics: \n{{SELECTED_PRS}}\n\nI would love to learn more about what scores you need to see to earn a walk-on spot.\n\nThank you,\n\n{{FIRST_NAME}} {{LAST_NAME}}\nProfile: {{PROFILE_LINK}}`
  },
  {
    id: 'golf_pro_followup',
    name: 'Gentle Follow-Up',
    isPremium: true,
    subject: 'Following Up - {{FIRST_NAME}} {{LAST_NAME}} ({{GRAD_YEAR}})',
    body: `Coach,\n\nI know you have a demanding schedule, so I wanted to send a brief follow-up to my last email to reiterate my strong desire to golf for {{COLLEGE_NAME}}.\n\n{{WHY_THIS_SCHOOL}}\n\nMy top metrics are:\n{{SELECTED_PRS}}\n\n{{UPCOMING_MEET}}\n\nI hold a {{GPA}} GPA and am very focused on my development. I would greatly appreciate a few minutes of your time to discuss the {{GRAD_YEAR}} recruiting class.\n\nBest,\n\n{{FIRST_NAME}} {{LAST_NAME}}\nProfile: {{PROFILE_LINK}}`
  }
];