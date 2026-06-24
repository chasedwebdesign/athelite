import { EmailTemplate } from './index';

export const bowlingTemplates: EmailTemplate[] = [
  {
    id: 'bowl_free_intro',
    name: 'Standard Intro & Average',
    isPremium: false,
    subject: '{{GRAD_YEAR}} Bowling Recruit: {{FIRST_NAME}} {{LAST_NAME}}',
    body: `Coach,\n\nMy name is {{FIRST_NAME}} {{LAST_NAME}}, and I am a class of {{GRAD_YEAR}} bowler competing for {{HIGH_SCHOOL}}. I am reaching out because competing for the {{COLLEGE_NAME}} bowling program is a major goal of mine.\n\n{{WHY_THIS_SCHOOL}}\n\nHere are my most recent averages and metrics:\n{{SELECTED_PRS}}\n\nAcademically, I hold a {{GPA}} GPA and plan to pursue a degree in {{MAJOR}}. You can view my mechanics and form video here:\nVideo: {{HIGHLIGHT_VIDEO_LINK}}\n\n{{UPCOMING_MEET}}\n\nI would love to learn more about your recruiting standards and what averages you are looking for in the {{GRAD_YEAR}} class.\n\nBest regards,\n\n{{FIRST_NAME}} {{LAST_NAME}}\nClass of {{GRAD_YEAR}}\nProfile: {{PROFILE_LINK}}`
  },
  {
    id: 'bowl_pro_tournament_schedule',
    name: 'Junior Gold / Tournament Schedule',
    isPremium: true,
    subject: 'Tournament Schedule: {{FIRST_NAME}} {{LAST_NAME}} (C/O {{GRAD_YEAR}})',
    body: `Coach,\n\nI am {{FIRST_NAME}} {{LAST_NAME}}, a {{GRAD_YEAR}} bowler. As we move into the main tournament season (including Junior Gold), I wanted to share my upcoming schedule in case you or your assistant will be recruiting.\n\n{{UPCOMING_MEET}}\n\n{{WHY_THIS_SCHOOL}}\n\nTo give you an idea of my mechanics, my latest video is linked here:\nVideo: {{HIGHLIGHT_VIDEO_LINK}}\n\nI carry a {{GPA}} GPA and am very focused on finding a high-academic program. Please let me know if you will be at any of my events.\n\nBest,\n\n{{FIRST_NAME}} {{LAST_NAME}}\nProfile: {{PROFILE_LINK}}`
  },
  {
    id: 'bowl_pro_high_series',
    name: 'High Series / PR Update',
    isPremium: true,
    subject: 'New High Series Update: {{FIRST_NAME}} {{LAST_NAME}} ({{GRAD_YEAR}})',
    body: `Coach,\n\nI hope your week is going well. I wanted to send a quick update following a strong string of tournament performances.\n\nI recently shot a new personal best series/game, and my updated metrics are:\n{{SELECTED_PRS}}\n\n{{WHY_THIS_SCHOOL}}\n\nWith a {{GPA}} GPA (intended major: {{MAJOR}}), {{COLLEGE_NAME}} remains a top choice for me. {{UPCOMING_MEET}}\n\nThank you for your time, and I hope to hear from you soon.\n\n{{FIRST_NAME}} {{LAST_NAME}}\nProfile: {{PROFILE_LINK}}`
  },
  {
    id: 'bowl_pro_mechanics_video',
    name: 'New Form / Mechanics Video',
    isPremium: true,
    subject: 'New Form/Mechanics Video: {{FIRST_NAME}} {{LAST_NAME}} ({{GRAD_YEAR}})',
    body: `Coach,\n\nI have been working heavily with my coach on my release and versatility on different sport patterns, and I wanted to share my brand new footage with you.\n\nVideo Link: {{HIGHLIGHT_VIDEO_LINK}}\n\nMy current metrics and averages are:\n{{SELECTED_PRS}}\n\n{{WHY_THIS_SCHOOL}}\n\nI am a strong student with a {{GPA}} GPA, and I believe I have the work ethic to thrive in your lineup. Please let me know if you have any feedback.\n\nThanks,\n\n{{FIRST_NAME}} {{LAST_NAME}}\nProfile: {{PROFILE_LINK}}`
  },
  {
    id: 'bowl_pro_academic',
    name: 'Academic Update',
    isPremium: true,
    subject: 'Academic Update: {{FIRST_NAME}} {{LAST_NAME}} - C/O {{GRAD_YEAR}}',
    body: `Coach,\n\nI am writing to provide an academic update. I just finished my latest semester and have improved my GPA to a {{GPA}}. Knowing the academic rigor of {{COLLEGE_NAME}}, I want to assure you I can handle the workload as a student-athlete studying {{MAJOR}}.\n\nOn the lanes, my stats currently sit at:\n{{SELECTED_PRS}}\n\n{{UPCOMING_MEET}}\n\nI would love to arrange a time to speak briefly about your program.\n\nBest regards,\n\n{{FIRST_NAME}} {{LAST_NAME}}\nProfile: {{PROFILE_LINK}}`
  },
  {
    id: 'bowl_pro_visit',
    name: 'Campus / Facility Visit Request',
    isPremium: true,
    subject: 'Campus Visit Request - {{FIRST_NAME}} {{LAST_NAME}} ({{GRAD_YEAR}})',
    body: `Coach,\n\nMy name is {{FIRST_NAME}} {{LAST_NAME}}, a {{GRAD_YEAR}} prospect. I am planning to be in the area soon and would absolutely love the opportunity to take an unofficial visit to see the campus and your bowling facilities at {{COLLEGE_NAME}}.\n\n{{WHY_THIS_SCHOOL}}\n\nMy current metrics are:\n{{SELECTED_PRS}}\n\nI am serious about my academics, holding a {{GPA}} GPA. Please let me know if you might have time for a brief introduction if I make an unofficial visit.\n\nThank you,\n\n{{FIRST_NAME}} {{LAST_NAME}}\nProfile: {{PROFILE_LINK}}`
  },
  {
    id: 'bowl_pro_direct_coach',
    name: 'Direct to Head Coach',
    isPremium: true,
    subject: '{{GRAD_YEAR}} Bowling Prospect: {{FIRST_NAME}} {{LAST_NAME}}',
    body: `Coach,\n\nI am {{FIRST_NAME}} {{LAST_NAME}}, a {{GRAD_YEAR}} bowler. I am reaching out to you directly because of the way you develop your team at {{COLLEGE_NAME}}.\n\n{{WHY_THIS_SCHOOL}}\n\nI am highly coachable with a {{GPA}} GPA. My latest tape is linked here:\nVideo: {{HIGHLIGHT_VIDEO_LINK}}\n\nMetrics:\n{{SELECTED_PRS}}\n\nI would love to hop on a quick call to discuss what you are looking for in the {{GRAD_YEAR}} recruiting cycle.\n\nBest,\n\n{{FIRST_NAME}} {{LAST_NAME}}\nProfile: {{PROFILE_LINK}}`
  },
  {
    id: 'bowl_pro_congrats',
    name: 'Congrats on Tournament Win',
    isPremium: true,
    subject: 'Congrats on the great win! - {{FIRST_NAME}} {{LAST_NAME}} ({{GRAD_YEAR}})',
    body: `Coach,\n\nI wanted to reach out and say congratulations on the team's performance in the recent tournament. Watching the team compete reinforces why {{COLLEGE_NAME}} is my top choice.\n\n{{WHY_THIS_SCHOOL}}\n\nI am training hard to hopefully contribute to that culture one day. My metrics are currently:\n{{SELECTED_PRS}}\n\nWith a {{GPA}} GPA, I am highly focused on my goals. Best of luck with the rest of the season.\n\n{{FIRST_NAME}} {{LAST_NAME}}\nProfile: {{PROFILE_LINK}}`
  },
  {
    id: 'bowl_pro_walkon',
    name: 'Walk-On / Roster Spot Inquiry',
    isPremium: true,
    subject: 'Walk-On Inquiry: {{FIRST_NAME}} {{LAST_NAME}} ({{GRAD_YEAR}})',
    body: `Coach,\n\nMy name is {{FIRST_NAME}} {{LAST_NAME}}, a {{GRAD_YEAR}} bowler out of {{HIGH_SCHOOL}}. {{COLLEGE_NAME}} is my absolute top choice for academics (I am pursuing a degree in {{MAJOR}} with a {{GPA}} GPA).\n\n{{WHY_THIS_SCHOOL}}\n\nI am reaching out to express my intense interest in earning a walk-on spot on your roster. I am a dedicated player who will push the team in practice every single day.\n\nVideo: {{HIGHLIGHT_VIDEO_LINK}}\nMetrics: \n{{SELECTED_PRS}}\n\nI would love to learn more about your walk-on evaluation process.\n\nThank you,\n\n{{FIRST_NAME}} {{LAST_NAME}}\nProfile: {{PROFILE_LINK}}`
  },
  {
    id: 'bowl_pro_followup',
    name: 'Gentle Follow-Up',
    isPremium: true,
    subject: 'Following Up - {{FIRST_NAME}} {{LAST_NAME}} ({{GRAD_YEAR}})',
    body: `Coach,\n\nI know you have a demanding schedule, so I wanted to send a brief follow-up to my last email to reiterate my strong desire to bowl for {{COLLEGE_NAME}}.\n\n{{WHY_THIS_SCHOOL}}\n\nMy top metrics are:\n{{SELECTED_PRS}}\n\n{{UPCOMING_MEET}}\n\nI hold a {{GPA}} GPA and am very focused on my development. I would greatly appreciate a few minutes of your time to discuss the {{GRAD_YEAR}} recruiting class.\n\nBest,\n\n{{FIRST_NAME}} {{LAST_NAME}}\nProfile: {{PROFILE_LINK}}`
  }
];