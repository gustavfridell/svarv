const state = {
    player: null,
    tracks: null,
    numberOfTracks: null,
    trackIndex: 0,
    elements: {
        playButton: document.querySelector('#play-button'),
        playButtonIcon: document.querySelector('#play-button i'),
        prevButton: document.querySelector('#prev-button'),
        nextButton: document.querySelector('#next-button'),
        artwork: document.querySelector('#artwork'),
        title: document.querySelector('#title'),
        artist: document.querySelector('#artist')
    }
}

const shuffleArray = array =>  {
  let currentIndex = array.length, temporaryValue, randomIndex

  while (0 !== currentIndex) {
    randomIndex = Math.floor(Math.random() * currentIndex)
    currentIndex -= 1
    temporaryValue = array[currentIndex]
    array[currentIndex] = array[randomIndex]
    array[randomIndex] = temporaryValue
  }

  return array
}

const startStream = index => {
    const track = state.tracks[index]

    SC.stream(`/tracks/${track.id}`).then(player => {
        state.player = player
        state.player.play()
    })
}

const displayTrackInfo = index => {
    const track = state.tracks[index]
    const { artwork_url, title, user, id } = track
    const artworkUrl = `${artwork_url.substring(0, artwork_url.length - 9)}t500x500.jpg`
    const artist = user.username

    state.elements.artwork.src = artworkUrl
    // state.elements.artist.innerText = artist
    state.elements.title.innerText = title
}

const togglePlayIcon = toPlay => {
    const { classList } = state.elements.playButtonIcon

    if (toPlay) {
        classList.remove('fa-play')
        classList.add('fa-pause')
    } else {
        classList.remove('fa-pause')
        classList.add('fa-play')
    }
}

const playButtonOnclickHandler = () => {
    if (state.player && state.player.isPlaying()) {
        togglePlayIcon(false)
        state.player.pause()
    } else {
        togglePlayIcon(true)
        if (state.player) {
            state.player.play()
        } else {
            startStream(state.trackIndex)
        }
    }
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

    togglePlayIcon(true)
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
