package com.wpinrui.youtoob.gecko

import android.content.Context
import org.mozilla.geckoview.GeckoRuntime
import org.mozilla.geckoview.GeckoRuntimeSettings

object GeckoRuntimeProvider {
    @Volatile
    private var runtime: GeckoRuntime? = null

    fun getRuntime(context: Context): GeckoRuntime {
        return runtime ?: synchronized(this) {
            runtime ?: createRuntime(context).also {
                runtime = it
            }
        }
    }

    private fun createRuntime(context: Context): GeckoRuntime {
        val settings = GeckoRuntimeSettings.Builder()
            .autoplayDefault(GeckoRuntimeSettings.AUTOPLAY_DEFAULT_ALLOWED)
            .build()
        return GeckoRuntime.create(context.applicationContext, settings)
    }

    fun shutdown() {
        runtime?.shutdown()
        runtime = null
    }
}
