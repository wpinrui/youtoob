package com.wpinrui.youtoob.media

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.graphics.Bitmap
import android.os.Build
import android.os.IBinder
import android.support.v4.media.MediaMetadataCompat
import android.support.v4.media.session.MediaSessionCompat
import android.support.v4.media.session.PlaybackStateCompat
import android.util.Log
import androidx.core.app.NotificationCompat
import androidx.media.app.NotificationCompat.MediaStyle
import com.wpinrui.youtoob.MainActivity
import com.wpinrui.youtoob.R

class AudioPlaybackService : Service() {

    private lateinit var mediaSession: MediaSessionCompat
    private lateinit var notificationManager: NotificationManager

    private var currentTitle: String = "Playing"
    private var currentArtist: String = "YouToob"
    private var currentArtwork: Bitmap? = null
    private var isPlaying: Boolean = true

    override fun onCreate() {
        super.onCreate()
        notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        createNotificationChannel()
        setupMediaSession()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_START -> {
                currentTitle = intent.getStringExtra(EXTRA_TITLE) ?: "Playing"
                currentArtist = intent.getStringExtra(EXTRA_ARTIST) ?: "YouToob"
                isPlaying = true
                startForegroundService()
            }
            ACTION_UPDATE_METADATA -> {
                currentTitle = intent.getStringExtra(EXTRA_TITLE) ?: currentTitle
                currentArtist = intent.getStringExtra(EXTRA_ARTIST) ?: currentArtist
                updateNotification()
                updateMediaSessionMetadata()
            }
            ACTION_PLAY -> {
                isPlaying = true
                updatePlaybackState()
                updateNotification()
            }
            ACTION_PAUSE -> {
                isPlaying = false
                updatePlaybackState()
                updateNotification()
            }
            ACTION_STOP -> {
                stopForeground(STOP_FOREGROUND_REMOVE)
                stopSelf()
            }
        }
        return START_STICKY
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onDestroy() {
        mediaSession.release()
        super.onDestroy()
    }

    private fun createNotificationChannel() {
        val channel = NotificationChannel(
            CHANNEL_ID,
            "Media Playback",
            NotificationManager.IMPORTANCE_LOW
        ).apply {
            description = "Shows media playback controls"
            setShowBadge(false)
        }
        notificationManager.createNotificationChannel(channel)
    }

    private fun setupMediaSession() {
        mediaSession = MediaSessionCompat(this, "YouToobMediaSession").apply {
            setCallback(object : MediaSessionCompat.Callback() {
                override fun onPlay() {
                    sendBroadcast(Intent(BROADCAST_PLAY))
                }

                override fun onPause() {
                    sendBroadcast(Intent(BROADCAST_PAUSE))
                }

                override fun onStop() {
                    sendBroadcast(Intent(BROADCAST_STOP))
                }

                override fun onSeekTo(pos: Long) {
                    sendBroadcast(Intent(BROADCAST_SEEK).putExtra(EXTRA_POSITION, pos))
                }
            })
            isActive = true
        }
        updateMediaSessionMetadata()
        updatePlaybackState()
    }

    private fun updateMediaSessionMetadata() {
        val metadata = MediaMetadataCompat.Builder()
            .putString(MediaMetadataCompat.METADATA_KEY_TITLE, currentTitle)
            .putString(MediaMetadataCompat.METADATA_KEY_ARTIST, currentArtist)
            .apply {
                currentArtwork?.let {
                    putBitmap(MediaMetadataCompat.METADATA_KEY_ALBUM_ART, it)
                }
            }
            .build()
        mediaSession.setMetadata(metadata)
    }

    private fun updatePlaybackState() {
        val state = if (isPlaying) {
            PlaybackStateCompat.STATE_PLAYING
        } else {
            PlaybackStateCompat.STATE_PAUSED
        }

        val playbackState = PlaybackStateCompat.Builder()
            .setActions(
                PlaybackStateCompat.ACTION_PLAY or
                PlaybackStateCompat.ACTION_PAUSE or
                PlaybackStateCompat.ACTION_STOP or
                PlaybackStateCompat.ACTION_SEEK_TO
            )
            .setState(state, PlaybackStateCompat.PLAYBACK_POSITION_UNKNOWN, 1f)
            .build()
        mediaSession.setPlaybackState(playbackState)
    }

    private fun startForegroundService() {
        val notification = buildNotification()
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK)
        } else {
            startForeground(NOTIFICATION_ID, notification)
        }
    }

    private fun updateNotification() {
        notificationManager.notify(NOTIFICATION_ID, buildNotification())
    }

    private fun buildNotification(): Notification {
        val contentIntent = PendingIntent.getActivity(
            this,
            0,
            Intent(this, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_SINGLE_TOP
            },
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val playPauseAction = if (isPlaying) {
            NotificationCompat.Action(
                R.drawable.ic_pause,
                "Pause",
                getPendingIntent(ACTION_PAUSE)
            )
        } else {
            NotificationCompat.Action(
                R.drawable.ic_play,
                "Play",
                getPendingIntent(ACTION_PLAY)
            )
        }

        val stopAction = NotificationCompat.Action(
            R.drawable.ic_stop,
            "Stop",
            getPendingIntent(ACTION_STOP)
        )

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_notification)
            .setContentTitle(currentTitle)
            .setContentText(currentArtist)
            .setContentIntent(contentIntent)
            .setOngoing(true)
            .setShowWhen(false)
            .addAction(playPauseAction)
            .addAction(stopAction)
            .setStyle(
                MediaStyle()
                    .setMediaSession(mediaSession.sessionToken)
                    .setShowActionsInCompactView(0, 1)
            )
            .apply {
                currentArtwork?.let { setLargeIcon(it) }
            }
            .build()
    }

    private fun getPendingIntent(action: String): PendingIntent {
        val intent = Intent(this, AudioPlaybackService::class.java).apply {
            this.action = action
        }
        return PendingIntent.getService(
            this,
            action.hashCode(),
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
    }

    companion object {
        private const val TAG = "YTB_AudioService"
        private const val CHANNEL_ID = "youtoob_playback"
        private const val NOTIFICATION_ID = 1

        const val ACTION_START = "com.wpinrui.youtoob.START"
        const val ACTION_UPDATE_METADATA = "com.wpinrui.youtoob.UPDATE_METADATA"
        const val ACTION_PLAY = "com.wpinrui.youtoob.PLAY"
        const val ACTION_PAUSE = "com.wpinrui.youtoob.PAUSE"
        const val ACTION_STOP = "com.wpinrui.youtoob.STOP"

        const val EXTRA_TITLE = "title"
        const val EXTRA_ARTIST = "artist"
        const val EXTRA_POSITION = "position"

        const val BROADCAST_PLAY = "com.wpinrui.youtoob.BROADCAST_PLAY"
        const val BROADCAST_PAUSE = "com.wpinrui.youtoob.BROADCAST_PAUSE"
        const val BROADCAST_STOP = "com.wpinrui.youtoob.BROADCAST_STOP"
        const val BROADCAST_SEEK = "com.wpinrui.youtoob.BROADCAST_SEEK"

        fun start(context: Context, title: String? = null, artist: String? = null) {
            val intent = Intent(context, AudioPlaybackService::class.java).apply {
                action = ACTION_START
                title?.let { putExtra(EXTRA_TITLE, it) }
                artist?.let { putExtra(EXTRA_ARTIST, it) }
            }
            context.startForegroundService(intent)
        }

        fun updateMetadata(context: Context, title: String?, artist: String?) {
            val intent = Intent(context, AudioPlaybackService::class.java).apply {
                action = ACTION_UPDATE_METADATA
                title?.let { putExtra(EXTRA_TITLE, it) }
                artist?.let { putExtra(EXTRA_ARTIST, it) }
            }
            context.startService(intent)
        }

        fun stop(context: Context) {
            val intent = Intent(context, AudioPlaybackService::class.java).apply {
                action = ACTION_STOP
            }
            context.startService(intent)
        }
    }
}
