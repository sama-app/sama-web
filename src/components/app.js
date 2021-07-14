import { h } from 'preact';
import { Router } from 'preact-router';

import Header from './header';

// Code-splitting is automated for `routes` directory
import Home from '../routes/home';
import Meeting from '../routes/meeting';

const App = () => (
	<div id="app">
		<Header />
		<Router>
			<Home path="/" />
			<Meeting path="/:code" />
		</Router>
	</div>
)

export default App;
