export const en = {
  'lang.label': 'Language',

  'auth.welcome': 'Welcome to PravAI',
  'auth.phoneIntro': "Enter your phone number and we'll send you a verification code.",
  'auth.phoneLabel': 'Phone number',
  'auth.invalidPhone': 'Please enter a valid phone number.',
  'auth.agree': 'By continuing you agree to use PravAI to prepare for your driving theory exam.',
  'auth.sendCode': 'Send code',
  'auth.sending': 'Sending…',
  'auth.verifyTitle': 'Enter the code',
  'auth.verifyIntro': "We've sent a 6-digit code to ",
  'auth.verify': 'Verify',
  'auth.verifying': 'Verifying…',
  'auth.codeExpired': 'Code expired',
  'auth.resend': 'Resend code',
  'auth.resendIn': 'Resend in ',
  'auth.uploadFailed': 'Upload failed. Try again.',
  'auth.uploading': 'Uploading…',
  'auth.uploadPhoto': 'Add a photo',

  'home.greeting': 'Welcome back',
  'home.placeholderTitle': 'Your practice dashboard is on its way',
  'home.placeholderBody': "Recent attempts and progress by topic will show up here once you've taken a few practice tests.",

  'tab.home': 'Home',
  'tab.tests': 'Tests',
  'tab.chat': 'AI Chat',
  'tab.profile': 'Profile',

  'tests.placeholderTitle': 'Tests are coming soon',
  'tests.placeholderBody': "Practice sections and official-style tickets will appear here, organized by topic and license category.",

  'quiz.placeholderTitle': 'Test-taking is coming soon',
  'quiz.placeholderBody': 'This screen will walk you through a test question by question.',

  'result.title': 'Result',
  'result.placeholderTitle': 'Results are coming soon',
  'result.placeholderBody': "You'll see your score and a review of each question here once you finish a test.",

  'chat.placeholderTitle': 'AI Chat is coming soon',
  'chat.placeholderBody': "Ask the AI tutor about anything you got wrong, right after a test.",

  'profile.noName': 'Add your name',
  'profile.myInfo': 'My info',
  'profile.language': 'Language',
  'profile.logout': 'Log out',
  'profile.editInfo': 'Edit info',
  'profile.mode': 'Appearance',
  'profile.modeDark': 'Dark',
  'profile.modeLight': 'Light',

  'field.fullName': 'Full name',
  'field.fullNamePlaceholder': 'Your full name',
  'field.phone': 'Phone',

  'common.saving': 'Saving…',
  'common.save': 'Save',

  'welcome.title': "You're in!",
  'welcome.titleNamed': 'Welcome, {name}!',
  'welcome.body': "Let's get you ready for your driving theory exam.",
} as const

export type TranslationKey = keyof typeof en
