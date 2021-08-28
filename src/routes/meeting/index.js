import { groupBy, omit } from 'lodash';
import { h, createRef } from 'preact';
import { useEffect, useState } from "preact/hooks";
import style from './style.css';
import Header from '../../components/header';

const Meeting = ({ code }) => {
	const [times, setTimes] = useState(false)
	const [indexedTimes, setIndexedTimes] = useState(false)
	const [inviter, setInviter] = useState('Anonymous')
	const [iOSAppLink, setiOSAppLink] = useState(false)

	const [dataStored, setDataStored] = useState(false)
	const [email, setEmail] = useState(window.localStorage.getItem('sama_email') || "")

	const [selectedTime, setSelectedTime] = useState(false)

	const [emailError, setEmailError] = useState(false)

	const [loadError, setLoadError] = useState(false)
	const [postLoading, setPostLoading] = useState(false)
	const [postSuccess, setPostSuccess] = useState(false)
	const [postError, setPostError] = useState(false)

	const inputRef = createRef()

	const locale = (navigator.languages && navigator.languages.length)
		? navigator.languages[0] : navigator.language

	useEffect(async () => {
		try {
			let response = await fetch(process.env.PREACT_APP_API + 'meeting/by-code/' + code)

			if (response.ok) {
				let data = await response.json()
				// setInviter(data.initiator.fullName)
				// sort
				let sortedSlots = data.proposedSlots.sort(function (a, b) {
					// Turn your strings into dates, and then subtract them
					// to get a value that is either negative, positive, or zero.
					return new Date(a.startDateTime) - new Date(b.startDateTime);
				});
				let indexedSlots = sortedSlots.map((slot, index) => { return { ...slot, index } })
				setIndexedTimes(indexedSlots)

				// chunk into ranges
				let slotChunks = []
				let lastSlot = new Date(indexedSlots[0].startDateTime)
				let chunk = []
				for (const slot of indexedSlots) {
					let slotDate = new Date(slot.startDateTime)
					if (slotDate - lastSlot > 15 * 60 * 1000) {
						slotChunks.push(chunk.slice(0))
						chunk = []
					}
					chunk.push(slot)
					lastSlot = slotDate
				}
				if (chunk.length > 0) {
					slotChunks.push(chunk)
				}

				// group into days
				let groupedChunks = groupBy(slotChunks, (chunk) => {
					const firstDate = new Date(chunk[0].startDateTime)
					return firstDate.toLocaleDateString(locale, {
						month: 'long', day: 'numeric'
					})
				})

				setTimes(groupedChunks)
				setInviter(data.initiator.fullName)
				if (data.appLinks && data.appLinks.iosAppDownloadLink) {
					setiOSAppLink(data.appLinks.iosAppDownloadLink)
				}
			} else {
				console.log('Meeting load error')
				setLoadError(response.status)
			}
		} catch (error) {
			console.log('Connection error', error)
			setLoadError(500)
		}
	}, []);

	useEffect(() => {
		if (inputRef.current) {
			inputRef.current.focus()
		}
	}, [selectedTime])

	useEffect(() => {
		const lsEmail = window.localStorage.getItem('sama_email');
		if (lsEmail) {
			setDataStored(isEmailValid(lsEmail))
			setEmail(lsEmail)
			checkEmailInput()
		}
	}, []);

	async function postData(url = '', data = {}) {
		const response = await fetch(url, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(data)
		});
		return response;
	}

	const onSubmit = e => {
		e.preventDefault();
		if (email === '' || !isEmailValid(email)) return false;
		if (postLoading || postSuccess || postError) return false;
		let slot = omit(indexedTimes[selectedTime], 'index')

		setPostLoading(true)
		postData(process.env.PREACT_APP_API + 'meeting/by-code/' + code + '/confirm', {
			slot,
			recipientEmail: email
		})
			.then(data => {
				setPostLoading(false)
				// let json = await data.json()
				// console.log(json)
				if (data.status === 200 || data.status === 410) {
					setPostSuccess(true)
				} else {
					setPostError(true)
				}
			});
	}

	const onEmailInput = e => {
		const { value } = e.target;
		setEmail(value)
		window.localStorage.setItem('sama_email', value)
		if (emailError && value !== '' && isEmailValid(value)) setEmailError(false)
	}

	const selectTime = e => {
		const { value } = e.target;
		if (selectedTime && inputRef.current) {
			inputRef.current.focus()
		}
		setSelectedTime(value)
	}

	const sameDay = (d1, d2) => {
		return d1.getFullYear() === d2.getFullYear() &&
			d1.getMonth() === d2.getMonth() &&
			d1.getDate() === d2.getDate()
	}


	const formatSlot = slot => {
		const startDate = new Date(slot.startDateTime)
		const endDate = new Date(slot.endDateTime)
		// const isSameDay = sameDay(startDate, endDate)

		// const startDateString = startDate.toLocaleDateString(locale, {
		// 	month: 'short', day: 'numeric'
		// })
		// const endDateString = endDate.toLocaleDateString(locale, {
		// 	month: 'short', day: 'numeric'
		// })
		const startTimeString = startDate.toLocaleTimeString(locale, {
			hour: 'numeric', minute: '2-digit'
		})
		const endTimeString = endDate.toLocaleTimeString(locale, {
			hour: 'numeric', minute: '2-digit'
		})
		// let returnString = 
		// if (!isSameDay) returnString += endDateString + ' '
		// returnString += endTimeString
		return startTimeString + ' - ' + endTimeString
	}

	const isEmailValid = name => /(.+)@(.+){2,}\.(.+){2,}/.test(name)
	const checkEmailInput = () => setEmailError(email !== '' && !isEmailValid(email))

	const enableForm = e => {
		e.preventDefault()
		setDataStored(false)
	}

	return (
		<>
			<Header />
			<form class={style.meeting} onSubmit={onSubmit}>
				<div class="wrap">
					{!times && loadError === false && <div className="loading">
						Loading…
					</div>
					}
					{loadError === 500 && <div className="load-error">
						Couldn't load the meeting.
					</div>
					}
					{loadError === 404 && <div className="load-error">
						This meeting does not exist or has expired.
					</div>
					}
					{loadError === 410 && <div className="load-error">
						Time for this meeting has already been confirmed.
					</div>
					}
					{times && <div class={style.times}>
						<p><strong>{inviter}</strong> would like to find time for a meeting. Select the time that works best for you.</p>
						<p class={style.small}>All times are shown in your timezone.</p>
						{
							iOSAppLink &&
							<a class={style.appButton} href={iOSAppLink}>
								<p><strong>Download Sama iOS app</strong> to view in your calendar</p>
							</a>
						}

						{Object.keys(times).map((day) => (
							<>
								<h3>{day}</h3>
								{times[day].map((chunk, index) => (
									<>
										{index !== 0 && <hr />}
										{chunk.map((time) => (
											<div class={style.time}>
												<input type="radio" name="selectedTime" value={time.index} id={'slot-' + time.index} onClick={selectTime} />
												<label htmlFor={'slot-' + time.index}>{formatSlot(time)}</label>
											</div>
										))}
									</>
								))}
							</>
						))}
					</div>}
				</div>
				{
					selectedTime !== false &&
					<div class={style.panel}>
						{
							!postSuccess && !postError && !postLoading &&
							<>
								<div class="input-block">
									<label htmlFor="email">Which email should Sama send the invite to?</label>
									<input id="email" type="email" value={email} onInput={onEmailInput} onBlur={checkEmailInput} placeholder="your@email.com" ref={inputRef} />
									{emailError && <p class={style.errorLabel}>Please enter a correct email</p>}
								</div>
								<input type="submit" value="Confirm" disabled={email === '' || emailError} onClick={onSubmit} />
							</>
						}
						{
							postLoading &&
							<h3>Confirming…</h3>
						}
						{
							postSuccess &&
							<>
								<h3>Time confirmed</h3>
								<p class={style.small}>Meeting invite is sent to you on {inviter} behalf.</p>
							</>
						}
						{
							postError &&
							<h3>Error</h3>
							// <>
							// 	<h3>Time confirmed</h3>
							// 	<p class={style.small}>Meeting invite is sent to you on {inviter} behalf.</p>
							// </>
						}
					</div>
				}
			</form>
		</>
	);
}

export default Meeting;
