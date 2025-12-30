package com.wpinrui.youtoob.player

import org.mozilla.geckoview.GeckoSession

/**
 * Controls YouTube video playback through JavaScript injection.
 * Communicates with the HTML5 video element in the YouTube mobile page.
 */
class VideoController(private val session: GeckoSession) {

    fun play() {
        executeVideoCommand("play()")
    }

    fun pause() {
        executeVideoCommand("pause()")
    }

    fun togglePlayPause() {
        executeJs("""
            (function() {
                var video = document.querySelector('video');
                if (video) {
                    if (video.paused) {
                        video.play();
                    } else {
                        video.pause();
                    }
                }
            })();
        """.trimIndent())
    }

    fun seekForward(seconds: Int = 10) {
        executeJs("""
            (function() {
                var video = document.querySelector('video');
                if (video) {
                    video.currentTime = Math.min(video.currentTime + $seconds, video.duration);
                }
            })();
        """.trimIndent())
    }

    fun seekBackward(seconds: Int = 10) {
        executeJs("""
            (function() {
                var video = document.querySelector('video');
                if (video) {
                    video.currentTime = Math.max(video.currentTime - $seconds, 0);
                }
            })();
        """.trimIndent())
    }

    fun setPlaybackSpeed(speed: Float) {
        executeJs("""
            (function() {
                var video = document.querySelector('video');
                if (video) {
                    video.playbackRate = $speed;
                }
            })();
        """.trimIndent())
    }

    fun toggleLoop() {
        executeJs("""
            (function() {
                var video = document.querySelector('video');
                if (video) {
                    video.loop = !video.loop;
                }
            })();
        """.trimIndent())
    }

    fun clickLikeButton() {
        clickYouTubeButton("like-button")
    }

    fun clickDislikeButton() {
        clickYouTubeButton("dislike-button")
    }

    fun clickSaveButton() {
        executeJs("""
            (function() {
                var saveBtn = document.querySelector('ytm-button-renderer[button-next=""]');
                if (saveBtn) saveBtn.click();
            })();
        """.trimIndent())
    }

    fun clickShareButton() {
        executeJs("""
            (function() {
                var shareBtn = document.querySelector('ytm-slim-video-action-bar-renderer button[aria-label*="Share"]');
                if (!shareBtn) {
                    shareBtn = document.querySelector('[aria-label*="Share"]');
                }
                if (shareBtn) shareBtn.click();
            })();
        """.trimIndent())
    }

    fun openQualitySettings() {
        executeJs("""
            (function() {
                var settingsBtn = document.querySelector('.ytp-settings-button');
                if (!settingsBtn) {
                    settingsBtn = document.querySelector('[aria-label*="Settings"]');
                }
                if (settingsBtn) settingsBtn.click();
            })();
        """.trimIndent())
    }

    fun toggleCaptions() {
        executeJs("""
            (function() {
                var ccBtn = document.querySelector('.ytp-subtitles-button');
                if (!ccBtn) {
                    ccBtn = document.querySelector('[aria-label*="Captions"]');
                }
                if (ccBtn) ccBtn.click();
            })();
        """.trimIndent())
    }

    private fun clickYouTubeButton(buttonType: String) {
        executeJs("""
            (function() {
                var btn = document.querySelector('ytm-slim-video-action-bar-renderer #$buttonType button');
                if (!btn) {
                    btn = document.querySelector('#$buttonType button');
                }
                if (btn) btn.click();
            })();
        """.trimIndent())
    }

    private fun executeVideoCommand(command: String) {
        executeJs("""
            (function() {
                var video = document.querySelector('video');
                if (video) {
                    video.$command;
                }
            })();
        """.trimIndent())
    }

    private fun executeJs(script: String) {
        session.loadUri("javascript:$script")
    }
}
