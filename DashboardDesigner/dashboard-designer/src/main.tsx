import React from 'react';
import ReactDOM from 'react-dom/client';
import Editor from './Editor';
import './index.css';
import ModalHost from './components/ui/ModalHost';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ModalHost>
      <Editor />
    </ModalHost>
  </React.StrictMode>
);
