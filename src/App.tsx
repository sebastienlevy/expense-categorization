import { useEffect, useState } from 'react'
import './App.css'
import ExpenseCategorizer from './components/ExpenseCat';
import { CircleUserRound } from 'lucide-react';

// Discovery doc URL for APIs used by the quickstart
const DISCOVERY_DOC = 'https://sheets.googleapis.com/$discovery/rest?version=v4';
const SCOPES = 'https://www.googleapis.com/auth/spreadsheets.readonly';

function App() {
  const [, setGAPIInitiated] = useState(false)
  const [, setGIsInitiated] = useState(false)
  const [tokenClient, setTokenClient] = useState<any>()
  const [isReady, setIsReady] = useState(false)

  async function initializeGapiClient() {
    try {
      await window.gapi.client.init({
        apiKey: import.meta.env.VITE_GAPI_API_KEY,
        discoveryDocs: [DISCOVERY_DOC],
      });

      setGAPIInitiated(true)
    } catch (error) {
      console.error(error)
    }
  }

  function handleAuthClick() {
    if(tokenClient) {
      tokenClient.callback = async (resp: any) => {
        if (resp.error !== undefined) {
          throw (resp);
        }
        setIsReady(true)
      };

      if (window.gapi.client.getToken() === null) {
        // Prompt the user to select a Google Account and ask for consent to share their data
        // when establishing a new session.
        tokenClient.requestAccessToken({prompt: 'consent'});
      } else {
        // Skip display of account chooser and consent dialog for an existing session.
        tokenClient.requestAccessToken({prompt: ''});
      }
    }
  }

  useEffect(() => {
    if(window.gapi) {
      window.gapi.load('client', initializeGapiClient);
    }
  })

  useEffect(() => {
    if(window.google) {
      const token = window.google.accounts.oauth2.initTokenClient({
        client_id: import.meta.env.VITE_GAPI_CLIENT_ID,
        scope: SCOPES,
        callback: '', // defined later
      });
      setTokenClient(token)
      setGIsInitiated(true)
    }
  }, [])

  if(!isReady) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <button className='flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700' id="authorize_button" onClick={handleAuthClick}>
            <CircleUserRound />
            Authorize
          </button>
        </div>
      </div>
    )
  }

  return (
    <ExpenseCategorizer />
  )
}

export default App
