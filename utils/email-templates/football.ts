import { EmailTemplate } from './index';

export const footballTemplates: EmailTemplate[] = [
  {
    id: 'fb_free_intro',
    name: 'Standard Film Intro',
    isPremium: false,
    subject: '{{POSITION}} Prospect: {{FIRST_NAME}} {{LAST_NAME}} - C/O {{GRAD_YEAR}} Film',
    body: `Coach,\n\nMy name is {{FIRST_NAME}} {{LAST_NAME}}, and I play {{POSITION}} for {{HIGH_SCHOOL}} in the class of {{GRAD_YEAR}}. I've been following your program and believe I have the skills and work ethic to compete at {{COLLEGE_NAME}}.\n\n{{WHY_THIS_SCHOOL}}\n\nI take my academics seriously with a {{GPA}} GPA and am interested in studying {{MAJOR}}. I have attached a link to my most recent highlight tape below. I believe my film shows my physicality, football IQ, and ability to make plays.\n\nHighlight Film: {{HIGHLIGHT_VIDEO_LINK}}\n\nHere are a few of my measurables:\n{{SELECTED_PRS}}\n\n{{UPCOMING_MEET}}\n\nI would appreciate it if you or a position coach could evaluate my film. \n\nThank you,\n\n{{FIRST_NAME}} {{LAST_NAME}}\n{{HIGH_SCHOOL}} | {{POSITION}} | Class of {{GRAD_YEAR}}\nProfile: {{PROFILE_LINK}}`
  },
  {
    id: 'fb_pro_midseason',
    name: 'Mid-Season Highlight Update',
    isPremium: true,
    subject: 'Mid-Season Highlights: {{FIRST_NAME}} {{LAST_NAME}} ({{GRAD_YEAR}} {{POSITION}})',
    body: `Coach,\n\nI hope your season is going great. I am a {{GRAD_YEAR}} {{POSITION}} at {{HIGH_SCHOOL}}. We are halfway through our season, and I wanted to send you my updated mid-season highlight reel.\n\nMid-Season Tape: {{HIGHLIGHT_VIDEO_LINK}}\n\n{{WHY_THIS_SCHOOL}}\n\nI am currently carrying a {{GPA}} GPA. My updated measurables are:\n{{SELECTED_PRS}}\n\n{{UPCOMING_MEET}}\n\nI would love any feedback you have on my film and to learn more about what you look for in a {{POSITION}}.\n\nBest regards,\n\n{{FIRST_NAME}} {{LAST_NAME}}\nProfile: {{PROFILE_LINK}}`
  },
  {
    id: 'fb_pro_camp_invite',
    name: 'Camp Request / Follow-up',
    isPremium: true,
    subject: 'Prospect Camp/Visit - {{FIRST_NAME}} {{LAST_NAME}} ({{GRAD_YEAR}} {{POSITION}})',
    body: `Coach,\n\nMy name is {{FIRST_NAME}} {{LAST_NAME}}, a {{GRAD_YEAR}} {{POSITION}} from {{HIGH_SCHOOL}}. I am reaching out because I am extremely interested in attending one of your upcoming prospect camps or Junior Days to compete in front of the coaching staff.\n\n{{WHY_THIS_SCHOOL}}\n\nBefore I get on campus, I wanted to share my most recent game film with you:\nFilm: {{HIGHLIGHT_VIDEO_LINK}}\n\nI hold a {{GPA}} GPA and plan to major in {{MAJOR}}. I know that evaluating film is just the first step, and I am eager to prove myself in person. Please let me know the best dates for me to visit.\n\nThanks,\n\n{{FIRST_NAME}} {{LAST_NAME}}\nProfile: {{PROFILE_LINK}}`
  },
  {
    id: 'fb_pro_coach_intro',
    name: 'Direct to Position Coach',
    isPremium: true,
    subject: '{{GRAD_YEAR}} {{POSITION}} Evaluation Request: {{FIRST_NAME}} {{LAST_NAME}}',
    body: `Coach,\n\nI am {{FIRST_NAME}} {{LAST_NAME}}, a {{GRAD_YEAR}} {{POSITION}} out of {{HIGH_SCHOOL}}. I am specifically reaching out to you because I love how your positional group plays at {{COLLEGE_NAME}}.\n\n{{WHY_THIS_SCHOOL}}\n\nI pride myself on technique and effort. Here are my measurables:\n{{SELECTED_PRS}}\n\nPlease take a look at my most recent tape when you have a moment:\nFilm: {{HIGHLIGHT_VIDEO_LINK}}\n\nI have a {{GPA}} GPA and am focused on my development. I would love 5 minutes on the phone to discuss your evaluation process.\n\nBest,\n\n{{FIRST_NAME}} {{LAST_NAME}}\nProfile: {{PROFILE_LINK}}`
  },
  {
    id: 'fb_pro_combine',
    name: 'Post-Combine / Showcase Metrics',
    isPremium: true,
    subject: 'Updated Combine Metrics: {{FIRST_NAME}} {{LAST_NAME}} ({{GRAD_YEAR}} {{POSITION}})',
    body: `Coach,\n\nI am {{FIRST_NAME}} {{LAST_NAME}}, a {{GRAD_YEAR}} {{POSITION}} from {{HIGH_SCHOOL}}. I recently attended a regional combine/showcase and wanted to update you on my verified measurables.\n\n{{SELECTED_PRS}}\n\n{{WHY_THIS_SCHOOL}}\n\nYou can also view my latest game and drill film here:\nFilm: {{HIGHLIGHT_VIDEO_LINK}}\n\nWith a {{GPA}} GPA, I am looking for a school with high academic and athletic standards like {{COLLEGE_NAME}}. \n\nThanks for your time,\n\n{{FIRST_NAME}} {{LAST_NAME}}\nProfile: {{PROFILE_LINK}}`
  },
  {
    id: 'fb_pro_academic',
    name: 'Academic & Film Update',
    isPremium: true,
    subject: 'Academic Update + Film: {{FIRST_NAME}} {{LAST_NAME}} (C/O {{GRAD_YEAR}})',
    body: `Coach,\n\nI am writing to provide an academic update. I just received my latest transcripts and currently hold a {{GPA}} GPA. I know {{COLLEGE_NAME}} values smart players, and I want to assure you I handle my business in the classroom.\n\nOn the field, I play {{POSITION}} for {{HIGH_SCHOOL}}. Here is my latest tape:\nFilm: {{HIGHLIGHT_VIDEO_LINK}}\n\nMeasurables:\n{{SELECTED_PRS}}\n\n{{UPCOMING_MEET}}\n\nI would love the opportunity to be evaluated by your staff.\n\nBest,\n\n{{FIRST_NAME}} {{LAST_NAME}}\nProfile: {{PROFILE_LINK}}`
  },
  {
    id: 'fb_pro_offseason',
    name: 'Spring Ball / 7v7 Update',
    isPremium: true,
    subject: 'Spring/7v7 Update: {{FIRST_NAME}} {{LAST_NAME}} ({{GRAD_YEAR}} {{POSITION}})',
    body: `Coach,\n\nAs we head into spring ball and the 7v7 circuit, I wanted to reach out to ensure I am on your board for the {{GRAD_YEAR}} class.\n\n{{WHY_THIS_SCHOOL}}\n\nI have been working hard in the weight room. My current stats are:\n{{SELECTED_PRS}}\n\nMy junior year film is linked here: {{HIGHLIGHT_VIDEO_LINK}}\n\nI am a {{GPA}} GPA student at {{HIGH_SCHOOL}}. If your staff will be in my area for spring evaluations, I would love to introduce myself.\n\nThank you,\n\n{{FIRST_NAME}} {{LAST_NAME}}\nProfile: {{PROFILE_LINK}}`
  },
  {
    id: 'fb_pro_congrats',
    name: 'Congrats on Big Win',
    isPremium: true,
    subject: 'Great win this weekend! - {{FIRST_NAME}} {{LAST_NAME}} ({{GRAD_YEAR}})',
    body: `Coach,\n\nCongratulations on the massive win this weekend! The energy and execution from the team were incredible. It’s exactly why {{COLLEGE_NAME}} is my dream program.\n\n{{WHY_THIS_SCHOOL}}\n\nI am a {{GRAD_YEAR}} {{POSITION}} at {{HIGH_SCHOOL}} with a {{GPA}} GPA. My tape is linked here for your review:\nFilm: {{HIGHLIGHT_VIDEO_LINK}}\n\nMeasurables:\n{{SELECTED_PRS}}\n\nKeep rolling this season, and I hope to speak with you soon.\n\nBest,\n\n{{FIRST_NAME}} {{LAST_NAME}}\nProfile: {{PROFILE_LINK}}`
  },
  {
    id: 'fb_pro_walkon',
    name: 'Walk-On / PWO Inquiry',
    isPremium: true,
    subject: 'PWO/Walk-On Inquiry: {{FIRST_NAME}} {{LAST_NAME}} ({{GRAD_YEAR}} {{POSITION}})',
    body: `Coach,\n\nMy name is {{FIRST_NAME}} {{LAST_NAME}}, a {{GRAD_YEAR}} {{POSITION}} at {{HIGH_SCHOOL}}. I am incredibly interested in {{COLLEGE_NAME}} for its {{MAJOR}} program, and I am reaching out to express my interest in earning a spot on your roster as a preferred walk-on.\n\n{{WHY_THIS_SCHOOL}}\n\nI have a {{GPA}} GPA and am confident I can contribute to your scout team and special teams immediately with my work ethic. \n\nFilm: {{HIGHLIGHT_VIDEO_LINK}}\nMeasurables:\n{{SELECTED_PRS}}\n\nI would love to discuss the walk-on process at {{COLLEGE_NAME}}.\n\nThank you,\n\n{{FIRST_NAME}} {{LAST_NAME}}\nProfile: {{PROFILE_LINK}}`
  },
  {
    id: 'fb_pro_followup',
    name: 'Gentle Follow-up',
    isPremium: true,
    subject: 'Following Up - {{FIRST_NAME}} {{LAST_NAME}} ({{GRAD_YEAR}} {{POSITION}})',
    body: `Coach,\n\nI know it's a busy time of year for you, but I wanted to follow up on my previous email. I am still highly interested in the {{COLLEGE_NAME}} football program.\n\n{{WHY_THIS_SCHOOL}}\n\nFor a quick refresher, here is my film: {{HIGHLIGHT_VIDEO_LINK}}\n\nMeasurables:\n{{SELECTED_PRS}}\n\nI hold a {{GPA}} GPA at {{HIGH_SCHOOL}} and would love the chance to jump on a quick call to talk about your needs for the {{GRAD_YEAR}} class.\n\nBest regards,\n\n{{FIRST_NAME}} {{LAST_NAME}}\nProfile: {{PROFILE_LINK}}`
  }
];