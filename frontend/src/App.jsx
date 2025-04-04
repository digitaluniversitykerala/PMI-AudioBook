import { Router, RouterProvider } from 'react-router-dom';
import { Home } from '@/pages'
import router from './routes/router';

function App() {
	console.log('r')
	return (
		<RouterProvider router={router} />
	);
}

export default App;