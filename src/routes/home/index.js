import { h } from 'preact';
import style from './style.css';
import Header from '../../components/header';

const Home = () => (
	<div class={style.home}>
		<Header />
		{/* <h1>Home</h1> */}
		<p>Invalid meeting link.</p>
	</div>
);

export default Home;
