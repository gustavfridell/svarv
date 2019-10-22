import 'vanilla-tilt'
import * as Vibrant from 'node-vibrant'

const state = {
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

const startStream = index => {
    const track = state.tracks[index]

    state.player && state.player.kill()
    state.elements.progress.style.width = '0'

    SC.stream(`/tracks/${track.id}`).then(player => {
        state.player = player

        state.player
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
                }
            })
            .on('time', elapsedDuration => {
                state.elements.elapsedTime.innerText = getTimestamp(elapsedDuration)
                state.elements.progress.style.width = `${100 * elapsedDuration / track.duration}%`
            })
            .play()
    })
}

const displayTrackInfo = index => {
    const track = state.tracks[index]
    const { artwork_url, title } = track
    const artworkUrl = `${artwork_url.substring(0, artwork_url.length - 9)}t500x500.jpg`
    state.overHourLongTrack = track.duration >= 3600000
    const totalTime = getTimestamp(track.duration)

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
    state.elements.totalTime.innerText = totalTime
}

const playButtonOnclickHandler = () => {
    const { player } = state

    if (player) {
        player.isPlaying() ? player.pause() : player.play()
    } else startStream(state.trackIndex)
}

const changeTrack = amount => {
    let { trackIndex, numberOfTracks } = state

    trackIndex += amount
    if (trackIndex < 0) {
        trackIndex = numberOfTracks - 1
    } else if (trackIndex > numberOfTracks - 1) {
        trackIndex = 0
    }
    state.trackIndex = trackIndex

    displayTrackInfo(trackIndex)
    startStream(trackIndex)
}

const initialize = () => {
    SC.initialize({
        client_id: '92xES1HxxuvjgmOoRMBswPvm6IaGGaQq'
    })

    SC.get('/playlists/879162766').then(playlist => {
        const { track_count, tracks } = playlist

        Object.assign(state, {
            tracks: shuffleArray(tracks),
            numberOfTracks: track_count
        })

        displayTrackInfo(state.trackIndex)
    })

    state.elements.playButton.addEventListener('click', playButtonOnclickHandler)
    state.elements.prevButton.addEventListener('click', () => changeTrack(-1))
    state.elements.nextButton.addEventListener('click', () => changeTrack(+1))
}

initialize()
