// Bluemania — Music Player
(function () {
  'use strict';

  let albums = [];
  let currentAlbum = null;
  let currentTrackIdx = -1;
  let isPlaying = false;

  const audio = new Audio();
  audio.volume = 0.8;

  // DOM refs
  const albumGrid = document.getElementById('album-grid');
  const albumsSection = document.querySelector('.albums');
  const detailSection = document.getElementById('album-detail');
  const albumHeader = document.getElementById('album-header');
  const tracklist = document.getElementById('tracklist');
  const backBtn = document.getElementById('back-btn');
  const player = document.getElementById('player');
  const playerArt = document.getElementById('player-art');
  const playerTitle = document.getElementById('player-title');
  const playerAlbum = document.getElementById('player-album');
  const playerToggle = document.getElementById('player-toggle');
  const playerPrev = document.getElementById('player-prev');
  const playerNext = document.getElementById('player-next');
  const playerSeek = document.getElementById('player-seek');
  const playerTime = document.getElementById('player-time');
  const playerDuration = document.getElementById('player-duration');
  const playerVol = document.getElementById('player-vol');

  function fmt(s) {
    if (!s || isNaN(s)) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return m + ':' + (sec < 10 ? '0' : '') + sec;
  }

  // Load albums
  async function init() {
    try {
      const resp = await fetch('albums.json');
      albums = await resp.json();
      renderGrid();
    } catch (e) {
      console.warn('No albums.json found — site is ready, waiting for music.');
      albumGrid.innerHTML = '<p style="color:var(--text-dim);grid-column:1/-1;text-align:center;padding:3rem 0;">Music coming soon.</p>';
    }
  }

  function renderGrid() {
    if (!albums.length) {
      albumGrid.innerHTML = '<p style="color:var(--text-dim);grid-column:1/-1;text-align:center;padding:3rem 0;">Music coming soon.</p>';
      return;
    }
    albumGrid.innerHTML = albums.map((a, i) => `
      <div class="album-card" data-idx="${i}">
        <div class="art">
          ${a.art ? `<img src="${a.art}" alt="${a.title}">` : '<div class="placeholder">♫</div>'}
        </div>
        <div class="info">
          <div class="album-title">${a.title}</div>
          <div class="album-meta">${a.year || ''}${a.year && a.tracks ? ' · ' : ''}${a.tracks ? a.tracks.length + ' tracks' : ''}</div>
        </div>
      </div>
    `).join('');

    albumGrid.querySelectorAll('.album-card').forEach(card => {
      card.addEventListener('click', () => showAlbum(parseInt(card.dataset.idx)));
    });
  }

  function showAlbum(idx) {
    currentAlbum = albums[idx];
    albumsSection.style.display = 'none';
    document.querySelector('.about').style.display = 'none';
    detailSection.style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });

    albumHeader.innerHTML = `
      <div class="detail-art">
        ${currentAlbum.art ? `<img src="${currentAlbum.art}" alt="${currentAlbum.title}">` : ''}
      </div>
      <div class="detail-info">
        <h3>${currentAlbum.title}</h3>
        <div class="detail-year">${currentAlbum.year || ''}</div>
        <div class="detail-desc">${currentAlbum.description || ''}</div>
      </div>
    `;

    tracklist.innerHTML = (currentAlbum.tracks || []).map((t, i) => `
      <div class="track${currentTrackIdx === i && currentAlbum === albums[idx] ? ' playing' : ''}" data-idx="${i}">
        <span class="track-num">${i + 1}</span>
        <span class="track-title">${t.title}</span>
        <span class="track-duration">${t.duration || ''}</span>
      </div>
    `).join('');

    tracklist.querySelectorAll('.track').forEach(tr => {
      tr.addEventListener('click', () => playTrack(parseInt(tr.dataset.idx)));
    });
  }

  function showGrid() {
    detailSection.style.display = 'none';
    albumsSection.style.display = '';
    document.querySelector('.about').style.display = '';
  }

  backBtn.addEventListener('click', showGrid);

  function playTrack(idx) {
    if (!currentAlbum || !currentAlbum.tracks || !currentAlbum.tracks[idx]) return;
    const track = currentAlbum.tracks[idx];
    currentTrackIdx = idx;

    audio.src = track.src;
    audio.play();
    isPlaying = true;
    playerToggle.textContent = '⏸';
    player.style.display = 'flex';

    playerTitle.textContent = track.title;
    playerAlbum.textContent = currentAlbum.title;
    playerArt.src = currentAlbum.art || '';

    // Highlight current track
    tracklist.querySelectorAll('.track').forEach((tr, i) => {
      tr.classList.toggle('playing', i === idx);
    });
  }

  playerToggle.addEventListener('click', () => {
    if (!audio.src) return;
    if (isPlaying) { audio.pause(); playerToggle.textContent = '▶'; }
    else { audio.play(); playerToggle.textContent = '⏸'; }
    isPlaying = !isPlaying;
  });

  playerPrev.addEventListener('click', () => {
    if (currentTrackIdx > 0) playTrack(currentTrackIdx - 1);
  });

  playerNext.addEventListener('click', () => {
    if (currentAlbum && currentTrackIdx < currentAlbum.tracks.length - 1) playTrack(currentTrackIdx + 1);
  });

  audio.addEventListener('timeupdate', () => {
    playerTime.textContent = fmt(audio.currentTime);
    if (audio.duration) {
      playerSeek.value = (audio.currentTime / audio.duration) * 100;
    }
  });

  audio.addEventListener('loadedmetadata', () => {
    playerDuration.textContent = fmt(audio.duration);
  });

  audio.addEventListener('ended', () => {
    if (currentAlbum && currentTrackIdx < currentAlbum.tracks.length - 1) {
      playTrack(currentTrackIdx + 1);
    } else {
      isPlaying = false;
      playerToggle.textContent = '▶';
    }
  });

  playerSeek.addEventListener('input', () => {
    if (audio.duration) audio.currentTime = (playerSeek.value / 100) * audio.duration;
  });

  playerVol.addEventListener('input', () => {
    audio.volume = playerVol.value / 100;
  });

  init();
})();
