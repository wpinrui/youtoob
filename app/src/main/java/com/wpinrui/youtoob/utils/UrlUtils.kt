package com.wpinrui.youtoob.utils

private const val VIDEO_PATH = "/watch"

fun String.isVideoPageUrl(): Boolean = contains(VIDEO_PATH)
