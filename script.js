const state = {
    player: null,
    tracks: null,
    numberOfTracks: null,
    trackIndex: 0,
    playButton: document.querySelector('#play-button'),
    playButtonIcon: document.querySelector('#play-button i'),
    prevButton: document.querySelector('#prev-button'),
    nextButton: document.querySelector('#next-button'),
    artwork: document.querySelector('#artwork')
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

const displayArtwork = url => {
    artwork.src = url
}

const displayInfo = (artist, title) => {
    const infoContainer = document.querySelector('#info')
    const titleElement = infoContainer.querySelector('#title')
    const artistElement = infoContainer.querySelector('#artist')
    artistElement.innerText = artist
    titleElement.innerText = title
}

const playTrack = index => {
    const track = state.tracks[index]
    const { artwork_url, title, user, id } = track
    const artworkUrl = `${artwork_url.substring(0, artwork_url.length - 9)}t500x500.jpg`
    const artist = user.username

    displayArtwork(artworkUrl)
    displayInfo(artist, title)

    SC.stream(`/tracks/${id}`).then(player => {
        state.player = player

        state.player.play().then(() => {
            console.log('ok')
        }).catch(e => {
            console.log('nä', e)
            console.dir(e)
        })
    })
}

const playButtonOnclickHandler = () => {
    const { classList } = state.playButtonIcon

    if (state.player.isPlaying()) {
        classList.remove('fa-pause')
        classList.add('fa-play')
        state.player.pause()
    } else {
        classList.remove('fa-play')
        classList.add('fa-pause')
        state.player.play()
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

    playTrack(trackIndex)
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

        playTrack(state.trackIndex)
    })

    state.playButton.addEventListener('click', playButtonOnclickHandler)
    state.prevButton.addEventListener('click', () => changeTrack(-1))
    state.nextButton.addEventListener('click', () => changeTrack(+1))
}

initialize()
