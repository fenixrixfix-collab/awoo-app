import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/App.css';
import App from './App';
import OneSignal from 'react-onesignal';

OneSignal.init({
  appId: '1d88784a-2a8e-4a3b-9ca3-97be4c939d90',
  allowLocalhostAsSecureOrigin: true,
  notifyButton: {
    enable: false,
  },
  promptOptions: {
    slidedown: {
      prompts: [
        {
          type: 'push',
          autoPrompt: true,
          text: {
            actionMessage: 'Разрешите уведомления чтобы получать новости о потерянных животных',
            acceptButton: 'Разрешить',
            cancelButton: 'Нет',
          },
        },
      ],
    },
  },
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
