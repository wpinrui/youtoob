package com.wpinrui.youtoob.extensions

import org.json.JSONObject
import org.mozilla.geckoview.WebExtension

interface ExtensionMessageHandler {
    fun onMessage(extension: WebExtension, message: JSONObject): JSONObject?
}
