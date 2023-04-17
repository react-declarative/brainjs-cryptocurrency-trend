import { createRoot } from 'react-dom/client';

import { ThemeProvider } from '@mui/material/styles';
import { CacheProvider } from "@emotion/react";
import { TssCacheProvider } from "tss-react";

import createCache from "@emotion/cache";

import { ErrorBoundary } from "react-declarative";

import history from './history';

import App from "./components/App";

import THEME_DARK from "./config/theme";

const container = document.getElementById('root')!;

const muiCache = createCache({
  "key": "mui",
  "prepend": true
});

const tssCache = createCache({
  "key": "tss"
});

const handleGlobalError = (error: any) => {
  console.warn('Error caught', { error })
  history.push('/error-page');
};

window.addEventListener('unhandledrejection', () => {
  history.push('/error-page');
});

const wrappedApp = (
  <ErrorBoundary history={history} onError={handleGlobalError}>
    <CacheProvider value={muiCache}>
      <TssCacheProvider value={tssCache}> 
        <ThemeProvider theme={THEME_DARK}>
          <App />
        </ThemeProvider>
      </TssCacheProvider>
    </CacheProvider>
  </ErrorBoundary>
);

const root = createRoot(container);

root.render(wrappedApp);
