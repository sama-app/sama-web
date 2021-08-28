import { h } from 'preact';
import { Router } from 'preact-router';

// Code-splitting is automated for `routes` directory
import Home from '../routes/home';
import Meeting from '../routes/meeting';

const App = () => (
	<div id="app">
		<Router>
			<Home path="/" />
			<Meeting path="/:code" />
		</Router>
	</div>
)

export default App;
