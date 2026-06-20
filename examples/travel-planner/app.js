import { initializeApp } from 'firebase/app'
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from 'firebase/auth'
import { getFirestore, collection, addDoc, query, where, orderBy, onSnapshot } from 'firebase/firestore'
import { getAI, getGenerativeModel, GoogleAIBackend } from 'firebase/ai'

const firebaseConfig = {
  apiKey: 'AIzaSyCE6VOh-zcDo9EiSmmoK0GPznNWPg0owc4',
  authDomain: 'apex-ai-copilot-platform.firebaseapp.com',
  projectId: 'apex-ai-copilot-platform',
  storageBucket: 'apex-ai-copilot-platform.firebasestorage.app',
  messagingSenderId: '429362775436',
  appId: '1:429362775436:web:929a7435ce0d5979fe42a9',
}

const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = getFirestore(app)
const ai = getAI(app, { backend: new GoogleAIBackend() })
const model = getGenerativeModel(ai, { model: 'gemini-2.5-flash' })

const provider = new GoogleAuthProvider()

let currentUser = null

onAuthStateChanged(auth, (user) => {
  currentUser = user
  if (user) {
    document.getElementById('login-btn').classList.add('hidden')
    document.getElementById('user-info').classList.remove('hidden')
    document.getElementById('user-name').textContent = user.displayName
    document.getElementById('user-avatar').src = user.photoURL || ''
    document.getElementById('main-content').classList.remove('hidden')
    loadSavedTrips()
  } else {
    document.getElementById('login-btn').classList.remove('hidden')
    document.getElementById('user-info').classList.add('hidden')
    document.getElementById('main-content').classList.add('hidden')
  }
})

document.getElementById('login-btn').addEventListener('click', () => {
  signInWithPopup(auth, provider).catch(console.error)
})

document.getElementById('logout-btn').addEventListener('click', () => {
  signOut(auth)
})

document.getElementById('trip-form').addEventListener('submit', async (e) => {
  e.preventDefault()

  const destination = document.getElementById('destination').value.trim()
  const startDate = document.getElementById('start-date').value
  const endDate = document.getElementById('end-date').value
  const budget = document.getElementById('budget').value
  const interests = document.getElementById('interests').value
  const photoFile = document.getElementById('photo-input').files[0]

  if (!destination || !startDate || !endDate) return

  document.getElementById('loading').classList.remove('hidden')

  try {
    let prompt = `Create a detailed ${budget} travel itinerary for ${destination} from ${startDate} to ${endDate}. Focus on ${interests} activities. Include daily breakdown with morning, afternoon, and evening plans. Recommend local restaurants, attractions, and transportation tips. Use markdown formatting with ## for days.`

    let parts = [{ text: prompt }]

    if (photoFile) {
      const base64 = await fileToBase64(photoFile)
      parts.push({
        inlineData: { data: base64, mimeType: photoFile.type },
      })
    }

    const result = await model.generateContent(parts)
    const text = result.response.text()

    document.getElementById('itinerary-content').innerHTML = formatItinerary(text)
    document.getElementById('itinerary-result').classList.remove('hidden')
    document.getElementById('itinerary-result').dataset.markdown = text
  } catch (err) {
    document.getElementById('itinerary-content').textContent = `Error: ${err.message}`
    document.getElementById('itinerary-result').classList.remove('hidden')
  } finally {
    document.getElementById('loading').classList.add('hidden')
  }
})

document.getElementById('save-trip-btn').addEventListener('click', async () => {
  if (!currentUser) return

  const destination = document.getElementById('destination').value.trim()
  const startDate = document.getElementById('start-date').value
  const endDate = document.getElementById('end-date').value
  const markdown = document.getElementById('itinerary-result').dataset.markdown

  try {
    await addDoc(collection(db, 'trips'), {
      userId: currentUser.uid,
      destination,
      startDate,
      endDate,
      itinerary: markdown,
      createdAt: new Date().toISOString(),
    })
    alert('Trip saved!')
  } catch (err) {
    alert(`Error saving: ${err.message}`)
  }
})

function loadSavedTrips() {
  if (!currentUser) return
  const q = query(
    collection(db, 'trips'),
    where('userId', '==', currentUser.uid),
    orderBy('createdAt', 'desc')
  )
  onSnapshot(q, (snapshot) => {
    const container = document.getElementById('trips-list')
    container.innerHTML = snapshot.docs.map((doc) => {
      const data = doc.data()
      return `
        <div class="trip-card" data-id="${doc.id}">
          <h3>${escapeHtml(data.destination)}</h3>
          <p>${data.startDate} to ${data.endDate}</p>
        </div>
      `
    }).join('')
  })
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result.split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function formatItinerary(text) {
  return text
    .replace(/### (.+)/g, '<h3>$1</h3>')
    .replace(/## (.+)/g, '<h2 style="color:#60a5fa;margin-top:20px">$1</h2>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>')
}

function escapeHtml(str) {
  const div = document.createElement('div')
  div.textContent = str
  return div.innerHTML
}
