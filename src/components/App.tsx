import { Switch } from 'react-declarative';
import { Container, CssBaseline } from '@mui/material';

import routes from '../config/routes';

import history from '../history';

const Fragment = () => <></>;

export const App = () => (
  <Container>
    <CssBaseline />
    <Switch
      animation='slideDown'
      Loader={Fragment}
      history={history}
      items={routes}
      throwError
    />
  </Container>
);

export default App;
