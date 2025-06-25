import {createBrowserRouter, RouterProvider} from 'react-router-dom';
import '@mantine/core/styles.css';
import { MantineProvider } from '@mantine/core';

import Home from '@/screens/home';
import ErrorBoundary from '@/components/ErrorBoundary';

// Order matters - index.css first, then draggable-fix.css to override
import '@/index.css';
import '@/draggable-fix.css'; // Import draggable CSS fixes last to take precedence

// Import MathJax types
import '@/types/mathjax';

const paths = [
    {
        path: '/',
        element: (
          <ErrorBoundary>
            <Home/>
          </ErrorBoundary>
        ),
    },
];

const BrowserRouter = createBrowserRouter(paths);

const App = () => {
    return (
    <MantineProvider>
      <ErrorBoundary>
        <RouterProvider router={BrowserRouter}/>
      </ErrorBoundary>
    </MantineProvider>
    )
};

export default App;
