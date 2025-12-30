// =============================================================================
// Seek Bar Setup
// =============================================================================

const SEEK_BAR_PADDING = 6;

function setupSeekBar(video, controls) {
    const seekBar = document.getElementById('youtoob-seek-bar');
    const seekProgress = document.getElementById('youtoob-seek-progress');
    const seekBuffer = document.getElementById('youtoob-seek-buffer');
    const seekThumb = document.getElementById('youtoob-seek-thumb');
    const timeDisplay = document.getElementById('youtoob-time-display');

    let isSeeking = false;

    function getTrackWidth(element) {
        return element.offsetWidth - (SEEK_BAR_PADDING * 2);
    }

    function updateTimeDisplay() {
        const current = formatTime(video.currentTime);
        const duration = formatTime(video.duration);
        timeDisplay.textContent = `${current} / ${duration}`;
    }

    function updateProgress() {
        if (isSeeking) return;
        const percent = (video.currentTime / video.duration) * 100 || 0;
        const trackWidth = getTrackWidth(seekBar);
        const progressWidth = (percent / 100) * trackWidth;
        seekProgress.style.width = progressWidth + 'px';
        seekThumb.style.left = (SEEK_BAR_PADDING + progressWidth) + 'px';
        updateTimeDisplay();
    }

    function updateBuffer() {
        if (video.buffered.length > 0) {
            const bufferedEnd = video.buffered.end(video.buffered.length - 1);
            const percent = (bufferedEnd / video.duration) || 0;
            const trackWidth = getTrackWidth(seekBar);
            seekBuffer.style.width = (percent * trackWidth) + 'px';
        }
    }

    function seekToPosition(clientX) {
        const rect = seekBar.getBoundingClientRect();
        const trackWidth = rect.width - (SEEK_BAR_PADDING * 2);
        const relativeX = clientX - rect.left - SEEK_BAR_PADDING;
        const percent = Math.max(0, Math.min(1, relativeX / trackWidth));
        const time = percent * video.duration;
        video.currentTime = time;
        const progressWidth = percent * trackWidth;
        seekProgress.style.width = progressWidth + 'px';
        seekThumb.style.left = (SEEK_BAR_PADDING + progressWidth) + 'px';
        updateTimeDisplay();
    }

    // Touch events for seeking
    seekBar.addEventListener('touchstart', (e) => {
        e.stopPropagation();
        isSeeking = true;
        seekToPosition(e.touches[0].clientX);
        controls.show();
    });

    seekBar.addEventListener('touchmove', (e) => {
        if (isSeeking) {
            e.preventDefault();
            seekToPosition(e.touches[0].clientX);
        }
    });

    seekBar.addEventListener('touchend', () => {
        isSeeking = false;
    });

    // Mouse events (for testing on desktop)
    seekBar.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        isSeeking = true;
        seekToPosition(e.clientX);
        controls.show();
    });

    document.addEventListener('mousemove', (e) => {
        if (isSeeking) {
            seekToPosition(e.clientX);
        }
    });

    document.addEventListener('mouseup', () => {
        isSeeking = false;
    });

    // Click to seek
    seekBar.addEventListener('click', (e) => {
        e.stopPropagation();
        seekToPosition(e.clientX);
        controls.show();
    });

    // Video event listeners
    video.addEventListener('timeupdate', updateProgress);
    video.addEventListener('progress', updateBuffer);
    video.addEventListener('loadedmetadata', updateTimeDisplay);
    video.addEventListener('durationchange', updateTimeDisplay);

    // Initial update
    updateProgress();
    updateBuffer();
    updateTimeDisplay();
}
