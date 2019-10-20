const state = {
    player: null,
    tracks: null,
    numberOfTracks: null,
    trackIndex: 0
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
    const artworkContainer = document.querySelector('#artwork-container')
    const artworkElement = document.createElement('img')
    artworkElement.src = url
    artworkContainer.appendChild(artworkElement)
}

const displayInfo = (artist, title) => {
    const infoContainer = document.querySelector('#info-container')
    const artistElement = document.createElement('span')
    const titleElement = document.createElement('h1')
    artistElement.innerText = artist
    titleElement.innerText = title
    infoContainer.appendChild(titleElement)
    infoContainer.appendChild(artistElement)
}

const playTrack = index => {
    const track = state.tracks[index]
    const { artwork_url, title, user } = track
    const artworkUrl = `${artwork_url.substring(0, artwork_url.length - 9)}t500x500.jpg`
    const artist = user.username

    displayArtwork(artworkUrl)
    displayInfo(artist, title)

    SC.stream(`/tracks/${id}`).then(player => {
        player.play().then(() => {
            console.log('ok')
        }).catch(e => {
            console.log('nä', e)
            console.dir(e)
        })
    })
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
}

initialize()
