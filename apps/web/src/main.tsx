import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import { App } from './App';
import { PrefsProvider } from './shell/prefs';
import { LocalStoreProvider } from './store/localStore';
import './index.css';

const root = document.getElementById('root');
if (!root) throw new Error('index.html has no #root');

createRoot(root).render(
  <StrictMode>
    <PrefsProvider>
      {/* TODO(S4): swap for the RemoteStore once the server is live. */}
      <LocalStoreProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </LocalStoreProvider>
    </PrefsProvider>
  </StrictMode>,
);
