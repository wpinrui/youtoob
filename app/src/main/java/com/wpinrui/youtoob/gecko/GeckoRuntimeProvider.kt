package com.wpinrui.youtoob.gecko

import android.content.Context
import org.mozilla.geckoview.GeckoRuntime

object GeckoRuntimeProvider {
    @Volatile
    private var runtime: GeckoRuntime? = null

    fun getRuntime(context: Context): GeckoRuntime {
        return runtime ?: synchronized(this) {
            runtime ?: GeckoRuntime.create(context.applicationContext).also {
                runtime = it
            }
        }
    }

    fun shutdown() {
        runtime?.shutdown()
        runtime = null
    }
}
