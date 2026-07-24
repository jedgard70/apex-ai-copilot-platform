import '../env.mjs'

function hasEnv(name) {
  return Boolean(process.env[name])
}

function anyEnv(names) {
  return names.some(hasEnv)
}

export function getFirebaseMessagingStatus() {
  const clientConfigured = hasEnv('VITE_FIREBASE_API_KEY')
    && hasEnv('VITE_FIREBASE_PROJECT_ID')
    && hasEnv('VITE_FIREBASE_MESSAGING_SENDER_ID')
    && hasEnv('VITE_FIREBASE_APP_ID')
  const vapidConfigured = hasEnv('VITE_FIREBASE_VAPID_KEY')
  const serverConfigured = anyEnv(['FIREBASE_SERVICE_ACCOUNT_JSON', 'FIREBASE_CLIENT_EMAIL'])
    && anyEnv(['FIREBASE_PRIVATE_KEY', 'FIREBASE_SERVICE_ACCOUNT_JSON'])
    && anyEnv(['FIREBASE_PROJECT_ID', 'VITE_FIREBASE_PROJECT_ID'])
  const configured = clientConfigured && vapidConfigured && serverConfigured

  return {
    id: 'firebase_messaging',
    label: 'Firebase Cloud Messaging',
    status: configured ? 'configured' : clientConfigured || vapidConfigured || serverConfigured ? 'partial' : 'missing_configuration',
    configured,
    clientConfigured,
    vapidConfigured,
    serverConfigured,
    capability: configured ? 'app_push_notifications_available' : 'app_push_notifications_connector_ready_requires_env',
    unavailableReason: configured ? '' : 'Configure Firebase client config, VAPID key and service account env vars to enable real app push notifications.',
    nextRequired: configured ? '' : 'Set VITE_FIREBASE_API_KEY, VITE_FIREBASE_PROJECT_ID, VITE_FIREBASE_MESSAGING_SENDER_ID, VITE_FIREBASE_APP_ID, VITE_FIREBASE_VAPID_KEY and server service-account env vars.',
    secretsExposed: false,
  }
}
