import 'babel-polyfill'
import 'vanilla-tilt'
import * as Vibrant from 'node-vibrant'

const state = {
    clientId: '92xES1HxxuvjgmOoRMBswPvm6IaGGaQq',
    playlistId: '879162766',
    player: null,
    tracks: null,
    numberOfTracks: null,
    trackIndex: 0,
    overHourLongTrack: false,
    elements: {
        playButton: document.querySelector('#play-button'),
        playButtonPlayIcon: document.querySelector('#play-button .controls-icon[name="play"]'),
        playButtonPauseIcon: document.querySelector('#play-button .controls-icon[name="pause"]'),
        prevButton: document.querySelector('#prev-button'),
        nextButton: document.querySelector('#next-button'),
        artwork: document.querySelector('#artwork'),
        title: document.querySelector('#title'),
        elapsedTime: document.querySelector('#elapsed-time'),
        totalTime: document.querySelector('#total-time'),
        progressBar: document.querySelector("#progress-bar"),
        progress: document.querySelector('#progress')
    }
}

const shuffleArray = a => {
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        const temp = a[i]
        a[i] = a[j]
        a[j] = temp
    }
    return a
}

const getTimestamp = time => {
    const seconds = Math.floor(time / 1000) % 60
    const minutes = Math.floor(time / (1000 * 60)) % 60
    const hours = Math.floor(time / (1000 * 60 * 60))

    const timestamp =
        (state.overHourLongTrack ? ((hours ? hours : '0') + ':') : '') +
        (minutes < 10 ? (minutes < 1 ? '00' : '0' + minutes) : minutes) + ':' +
        (seconds < 10 ? (seconds < 1 ? '00' : '0' + seconds) : seconds)

    return timestamp
}

const initializePlayerForTrack = async index => {
    const track = state.tracks[index]
    state.player && state.player.kill()

    const newPlayer = (await SC.stream(`/tracks/${track.id}`))
        .on('state-change', newState => {
            const { playButtonPlayIcon, playButtonPauseIcon } = state.elements

            switch (newState) {
                case 'playing':
                    playButtonPlayIcon.style.display = 'none'
                    playButtonPauseIcon.style.display = 'inline-block'
                    break
                case 'paused':
                    playButtonPauseIcon.style.display = 'none'
                    playButtonPlayIcon.style.display = 'inline-block'
                    break
                case 'ended':
                    changeTrack(+1)
                    break
            }
        })
        .on('time', elapsedDuration => {
            state.elements.elapsedTime.innerText = getTimestamp(elapsedDuration)
            state.elements.progress.style.width = `${100 * elapsedDuration / track.duration}%`
        })

    state.player = newPlayer
}

const displayTrackInfo = index => {
    const { artwork_url, title, duration } = state.tracks[index]
    const artworkUrl = `${artwork_url.substring(0, artwork_url.length - 9)}t500x500.jpg`
    state.overHourLongTrack = duration >= 3600000

    Vibrant.from(artworkUrl).getPalette((err, palette) => {
        const progressColor = `rgba(${palette.Vibrant.rgb[0]}, ${palette.Vibrant.rgb[1]}, ${palette.Vibrant.rgb[2]}, 0.6)`
        const gradientColors = [
            `rgba(${palette.LightMuted.rgb[0]}, ${palette.LightMuted.rgb[1]}, ${palette.LightMuted.rgb[2]}, 0.35)`,
            `rgba(${palette.LightVibrant.rgb[0]}, ${palette.LightVibrant.rgb[1]}, ${palette.LightVibrant.rgb[2]}, 0.35)`
        ]
        state.elements.progress.style.background = progressColor
        document.body.style.background = `linear-gradient(135deg, ${gradientColors[0]}, ${gradientColors[1]})`
    })

    state.elements.artwork.src = artworkUrl
    state.elements.title.innerText = title
    state.elements.elapsedTime.innerText = getTimestamp(0)
    state.elements.totalTime.innerText = getTimestamp(duration)
    state.elements.progress.style.width = '0'
    document.title = 'Svarv - ' + title
}

const playButtonOnclickHandler = () => {
    const { player } = state
    player.isPlaying() ? player.pause() : player.play()
}

const changeTrack = async amount => {
    let { trackIndex, numberOfTracks } = state

    trackIndex += amount
    if (trackIndex < 0) {
        trackIndex = numberOfTracks - 1
    } else if (trackIndex > numberOfTracks - 1) {
        trackIndex = 0
    }
    state.trackIndex = trackIndex

    displayTrackInfo(trackIndex)
    await initializePlayerForTrack(trackIndex)
    state.player.play()
}

const seekInTrack = async shareOfTrack => {
        const { duration } = state.tracks[state.trackIndex]
        const timeInTrack = duration * shareOfTrack

        state.elements.progress.style.width = `${100 * shareOfTrack}%`
        state.elements.elapsedTime.innerText = getTimestamp(timeInTrack)
        state.player.seek(timeInTrack)
}

const progressBarOnclickHandler = e => {
    const { progressBar } = state.elements
    const progressBarWidth = progressBar.offsetWidth
    const progressBarClickPosition = e.clientX - progressBar.getBoundingClientRect().left
    const shareOfProgressBarClicked = progressBarClickPosition / progressBarWidth

    seekInTrack(shareOfProgressBarClicked)
}

const keypressHandler = e => {
    switch (e.code) {
        case 'ArrowRight':
            changeTrack(1)
            break
        case 'ArrowLeft':
            changeTrack(-1)
            break
        case 'Space':
            playButtonOnclickHandler()
            break
    }
}

const initialize = async () => {
    SC.initialize({
        client_id: state.clientId
    })

    const { tracks, track_count } = await SC.get(`/playlists/${state.playlistId}`)
    state.tracks = shuffleArray(tracks)
    state.numberOfTracks = track_count

    displayTrackInfo(state.trackIndex)
    await initializePlayerForTrack(state.trackIndex)

    state.elements.playButton.addEventListener('click', playButtonOnclickHandler)
    state.elements.prevButton.addEventListener('click', () => changeTrack(-1))
    state.elements.nextButton.addEventListener('click', () => changeTrack(+1))
    state.elements.progressBar.addEventListener('click', progressBarOnclickHandler)
    document.addEventListener('keyup', keypressHandler)
}

initialize()
