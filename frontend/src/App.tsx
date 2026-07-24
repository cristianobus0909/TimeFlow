import { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Providers } from '@app/providers/Providers';
import { AppRouter } from '@app/router/AppRouter';
import { currencyStore } from '@/store/currencyStore';

export const App = () => {
  useEffect(() => {
    currencyStore.getState().fetchRates();
  }, []);

  return (
    <Providers>
      <BrowserRouter>
        <AppRouter />
      </BrowserRouter>
    </Providers>
  );
};
export default App;
