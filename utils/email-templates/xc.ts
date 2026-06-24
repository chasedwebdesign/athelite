import { EmailTemplate } from './index';

export const xcTemplates: EmailTemplate[] = [
  {
    id: 'xc_free_intro',
    name: 'Standard Introduction',
    isPremium: false,
    subject: 'Recruit Prospect: {{FIRST_NAME}} {{LAST_NAME}} - Class of {{GRAD_YEAR}} Cross Country',
    body: `Coach,\n\nMy name is {{FIRST_NAME}} {{LAST_NAME}}, and I am a class of {{GRAD_YEAR}} Cross Country athlete at {{HIGH_SCHOOL}}. I am reaching out because {{COLLEGE_NAME}} is one of my top target schools.\n\n{{WHY_THIS_SCHOOL}}\n\nHere are my most recent verified marks on the grass:\n{{SELECTED_PRS}}\n\nAcademically, I am carrying a {{GPA}} GPA and plan to pursue a degree in {{MAJOR}}. You can view my full progression history on my Athletic.net profile here: {{ATHLETIC_NET_LINK}}\n\n{{UPCOMING_MEET}}\n\nI have linked my ChasedSports profile below. I would love to learn more about your walk-on and recruiting standards for your distance squad.\n\nBest regards,\n\n{{FIRST_NAME}} {{LAST_NAME}}\n{{HIGH_SCHOOL}} | Class of {{GRAD_YEAR}}\nProfile: {{PROFILE_LINK}}`
  },
  {
    id: 'xc_pro_race_update',
    name: 'Post-Race / PR Alert',
    isPremium: true,
    subject: 'New PR / Race Update: {{FIRST_NAME}} {{LAST_NAME}} - {{GRAD_YEAR}} Recruit',
    body: `Coach,\n\nI hope your season is going well. I am a class of {{GRAD_YEAR}} athlete at {{HIGH_SCHOOL}}, and I wanted to share a quick update on my recent race.\n\nWe ran on a pretty challenging course this weekend, but I felt strong and was able to hit a new personal best. My current top marks are now:\n{{SELECTED_PRS}}\n\n{{WHY_THIS_SCHOOL}}\n\nWith a {{GPA}} GPA (intended major: {{MAJOR}}), I am looking for a program that pushes me both on the course and in the classroom. {{UPCOMING_MEET}}\n\nAll of my official marks can be verified here: {{ATHLETIC_NET_LINK}}\n\nThank you for your time, and I hope to hear from you soon.\n\n{{FIRST_NAME}} {{LAST_NAME}}\nProfile: {{PROFILE_LINK}}`
  },
  {
    id: 'xc_pro_championship',
    name: 'Championship / State Meet Update',
    isPremium: true,
    subject: 'Post-Championship Update: {{FIRST_NAME}} {{LAST_NAME}} (C/O {{GRAD_YEAR}})',
    body: `Coach,\n\nI wanted to reach out following my recent championship meet. My training block leading up to this race went perfectly, and I was able to peak at the right time.\n\nMy official marks from the championship were:\n{{SELECTED_PRS}}\n\n{{WHY_THIS_SCHOOL}}\n\n{{COLLEGE_NAME}} remains high on my list, and I am excited to transition this fitness to the track soon. I carry a {{GPA}} GPA and am highly interested in your {{MAJOR}} program.\n\nFull race results can be found here: {{ATHLETIC_NET_LINK}}\n\nBest,\n\n{{FIRST_NAME}} {{LAST_NAME}}\nProfile: {{PROFILE_LINK}}`
  },
  {
    id: 'xc_pro_summer_mileage',
    name: 'Summer Mileage / Base Phase Update',
    isPremium: true,
    subject: 'Summer Base Training Update: {{FIRST_NAME}} {{LAST_NAME}} - C/O {{GRAD_YEAR}}',
    body: `Coach,\n\nAs I get deep into my summer base training, I wanted to reconnect and express my continued interest in the {{COLLEGE_NAME}} distance program.\n\n{{WHY_THIS_SCHOOL}}\n\nI have been consistently hitting my mileage goals and feeling incredibly strong on my long runs. For context, here is where my marks ended up last cross country season:\n{{SELECTED_PRS}}\n\nI am maintaining a {{GPA}} GPA and am very focused on having a breakout fall. I’d love to know what specific 5k/8k times your staff looks for in the {{GRAD_YEAR}} class.\n\nBest,\n\n{{FIRST_NAME}} {{LAST_NAME}}\nProfile: {{PROFILE_LINK}}`
  },
  {
    id: 'xc_pro_unofficial_visit',
    name: 'Visit Request',
    isPremium: true,
    subject: 'Campus Visit Inquiry - {{FIRST_NAME}} {{LAST_NAME}} ({{GRAD_YEAR}})',
    body: `Coach,\n\nMy name is {{FIRST_NAME}} {{LAST_NAME}}, a {{GRAD_YEAR}} prospect from {{HIGH_SCHOOL}}. I am planning to be in the area soon and would love the opportunity to take an unofficial visit to {{COLLEGE_NAME}}.\n\n{{WHY_THIS_SCHOOL}}\n\nTo give you a quick snapshot of my profile, my top cross country marks are:\n{{SELECTED_PRS}}\n\nI am serious about my academics as well, holding a {{GPA}} GPA. Please let me know if there are any upcoming Junior Days or if you would have time for me to introduce myself in person.\n\nThank you,\n\n{{FIRST_NAME}} {{LAST_NAME}}\nProfile: {{PROFILE_LINK}}\nAthletic.net: {{ATHLETIC_NET_LINK}}`
  },
  {
    id: 'xc_pro_camp',
    name: 'Distance Camp Registration',
    isPremium: true,
    subject: 'Looking forward to camp! {{FIRST_NAME}} {{LAST_NAME}} ({{GRAD_YEAR}})',
    body: `Coach,\n\nI am writing to let you know that I have officially registered for your upcoming cross country camp. I am incredibly excited to train with the team and learn from the coaching staff.\n\n{{WHY_THIS_SCHOOL}}\n\nBefore I arrive, I wanted to ensure you had my most up-to-date metrics:\n{{SELECTED_PRS}}\n\nI am a {{GRAD_YEAR}} at {{HIGH_SCHOOL}} with a {{GPA}} GPA. I look forward to meeting you soon and getting some miles in.\n\nThanks,\n\n{{FIRST_NAME}} {{LAST_NAME}}\nProfile: {{PROFILE_LINK}}`
  },
  {
    id: 'xc_pro_academic',
    name: 'Academic Update',
    isPremium: true,
    subject: 'Academic/Athletic Update: {{FIRST_NAME}} {{LAST_NAME}} ({{GRAD_YEAR}})',
    body: `Coach,\n\nI am {{FIRST_NAME}} {{LAST_NAME}}, a {{GRAD_YEAR}} prospect from {{HIGH_SCHOOL}}. I wanted to share a quick update regarding my academics, as I know {{COLLEGE_NAME}} holds its athletes to a high standard.\n\nI just finished my recent grading period and have improved my cumulative GPA to a {{GPA}}. I am extremely focused on earning admission to study {{MAJOR}}.\n\nOn the course, my current top marks are:\n{{SELECTED_PRS}}\n\n{{UPCOMING_MEET}}\n\nI would love to learn more about the academic support your program offers its student-athletes.\n\nBest regards,\n\n{{FIRST_NAME}} {{LAST_NAME}}\nProfile: {{PROFILE_LINK}}`
  },
  {
    id: 'xc_pro_congrats',
    name: 'Congrats on Recent Meet/Win',
    isPremium: true,
    subject: 'Congrats on the weekend! - {{FIRST_NAME}} {{LAST_NAME}} ({{GRAD_YEAR}})',
    body: `Coach,\n\nI wanted to send a quick note to congratulate you and the team on a great performance this past weekend. Seeing the pack time and execution from the squad validates why {{COLLEGE_NAME}} is one of my top choices.\n\n{{WHY_THIS_SCHOOL}}\n\nI am working hard to be in a position to contribute to that kind of depth. For reference, my top marks are:\n{{SELECTED_PRS}}\n\nI currently hold a {{GPA}} GPA at {{HIGH_SCHOOL}}. Keep up the great season, and I hope to speak with you soon.\n\nBest,\n\n{{FIRST_NAME}} {{LAST_NAME}}\nProfile: {{PROFILE_LINK}}`
  },
  {
    id: 'xc_pro_application',
    name: 'Application Submitted',
    isPremium: true,
    subject: 'Application Submitted: {{FIRST_NAME}} {{LAST_NAME}} ({{GRAD_YEAR}})',
    body: `Coach,\n\nI am excited to let you know that I have officially submitted my application to {{COLLEGE_NAME}} for the Fall term. I am very hopeful for a favorable decision to study {{MAJOR}}.\n\n{{WHY_THIS_SCHOOL}}\n\nAs a reminder, I am a {{GRAD_YEAR}} prospect from {{HIGH_SCHOOL}} with a {{GPA}} GPA. My top athletic marks are:\n{{SELECTED_PRS}}\n\nI would love to discuss the possibility of walking on or competing for a roster spot should I be accepted academically. \n\nThank you for your time,\n\n{{FIRST_NAME}} {{LAST_NAME}}\nProfile: {{PROFILE_LINK}}`
  },
  {
    id: 'xc_pro_followup',
    name: 'Gentle Follow-Up',
    isPremium: true,
    subject: 'Following Up: {{FIRST_NAME}} {{LAST_NAME}} - C/O {{GRAD_YEAR}} Prospect',
    body: `Coach,\n\nI know you are extremely busy, so I wanted to send a quick follow-up to my previous email to reiterate my strong interest in the {{COLLEGE_NAME}} cross country program.\n\n{{WHY_THIS_SCHOOL}}\n\nMy top verified marks currently sit at:\n{{SELECTED_PRS}}\n\n{{UPCOMING_MEET}}\n\nI am a dedicated student with a {{GPA}} GPA. I would value the opportunity to get 5 minutes on the phone with you or an assistant coach to discuss your recruiting needs for the {{GRAD_YEAR}} class.\n\nThanks again for your time,\n\n{{FIRST_NAME}} {{LAST_NAME}}\nProfile: {{PROFILE_LINK}}`
  }
];