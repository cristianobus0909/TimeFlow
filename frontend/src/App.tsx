import { BrowserRouter } from 'react-router-dom';
import { Providers } from '@app/providers/Providers';
import { AppRouter } from '@app/router/AppRouter';

export const App = () => {
  return (
    <Providers>
      <BrowserRouter>
        <AppRouter />
      </BrowserRouter>
    </Providers>
  );
};
export default App;
