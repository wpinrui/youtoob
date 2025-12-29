# GeckoView Extension API Research

Research findings for implementing Firefox extension support in YouToob.

## Executive Summary

GeckoView fully supports loading and running Firefox WebExtensions. All three target extensions (uBlock Origin, SponsorBlock, YouTube HD) are compatible with Firefox for Android and will work in our GeckoView implementation. The recommended approach is to use **built-in extensions** bundled in the APK's assets folder, which avoids Mozilla signing requirements and provides native messaging capabilities.

## 1. Extension Loading Methods

GeckoView provides two primary ways to load extensions:

### Method A: Built-in Extensions (Recommended)

Bundle extensions in `/assets/` and load via `resource://android/` URI.

```kotlin
runtime.webExtensionController
    .ensureBuiltIn(
        "resource://android/assets/extensions/ublock-origin/",
        "uBlock0@raymondhill.net"
    )
    .accept({ extension ->
        Log.d("Extensions", "uBlock Origin loaded: ${extension?.id}")
    }, { error ->
        Log.e("Extensions", "Failed to load uBlock Origin", error)
    })
```

**Advantages:**
- No Mozilla signature required
- Extensions bundled with APK (offline support)
- Access to native messaging APIs
- `ensureBuiltIn` prevents redundant re-installs

**Disadvantages:**
- Manual update process (new APK release)
- Increases APK size

### Method B: Remote Installation

Install signed extensions from `addons.mozilla.org` or custom URLs.

```kotlin
runtime.webExtensionController
    .install("https://addons.mozilla.org/android/downloads/file/xxx/ublock_origin.xpi")
    .accept({ extension ->
        // Handle success
    }, { error ->
        // Handle failure
    })
```

**Advantages:**
- Smaller APK size
- Extensions can update independently

**Disadvantages:**
- Requires Mozilla-signed extensions
- Needs network connectivity
- Permission prompt shown to user

## 2. Required Manifest Permissions

Extensions must include these permissions in `manifest.json` to work with GeckoView:

```json
{
  "permissions": [
    "nativeMessaging",
    "nativeMessagingFromContent",
    "geckoViewAddons"
  ],
  "browser_specific_settings": {
    "gecko": {
      "id": "extension@example.com",
      "strict_min_version": "113.0"
    }
  }
}
```

| Permission | Purpose |
|------------|---------|
| `geckoViewAddons` | Required for all GeckoView-specific APIs |
| `nativeMessaging` | Allows background script to send messages to app |
| `nativeMessagingFromContent` | Allows content scripts to send messages to app |

## 3. App-to-Extension Messaging

### One-off Messages

**Extension side (background.js):**
```javascript
browser.runtime.sendNativeMessage("browser", { action: "getSettings" })
    .then(response => console.log("Settings:", response));
```

**App side (Kotlin):**
```kotlin
val messageDelegate = object : WebExtension.MessageDelegate {
    override fun onMessage(
        nativeApp: String,
        message: Any,
        sender: WebExtension.MessageSender
    ): GeckoResult<Any>? {
        val json = message as? JSONObject ?: return null
        return when (json.optString("action")) {
            "getSettings" -> GeckoResult.fromValue(getAppSettings())
            else -> null
        }
    }
}

extension.setMessageDelegate(messageDelegate, "browser")
```

### Connection-based Messaging (Bidirectional)

**Extension side:**
```javascript
const port = browser.runtime.connectNative("browser");
port.onMessage.addListener(msg => handleMessage(msg));
port.postMessage({ type: "init" });
```

**App side:**
```kotlin
override fun onConnect(port: WebExtension.Port) {
    port.setDelegate(object : WebExtension.PortDelegate {
        override fun onPortMessage(message: Any, port: WebExtension.Port) {
            // Handle incoming messages
        }
    })
    port.postMessage(JSONObject().put("status", "connected"))
}
```

## 4. Extension Lifecycle Management

### Available APIs

| Method | Description |
|--------|-------------|
| `ensureBuiltIn(uri, id)` | Install if not present (idempotent) |
| `installBuiltIn(uri)` | Install built-in extension |
| `install(uri)` | Install signed extension from URL |
| `list()` | Get all installed extensions |
| `enable(ext, source)` | Enable a disabled extension |
| `disable(ext, source)` | Disable an extension |
| `uninstall(ext)` | Remove extension and its data |
| `update(ext)` | Check and apply updates |

### Extension Persistence

Extensions persist across app restarts. The `ensureBuiltIn` method handles version checking:
- If extension not installed → installs it
- If same version installed → no-op
- If different version → updates it

## 5. Target Extension Compatibility Assessment

### uBlock Origin

| Aspect | Status | Notes |
|--------|--------|-------|
| Firefox Android Support | Officially supported | Part of Mozilla's Recommended Extensions |
| GeckoView Compatibility | Full | Works on Gecko-based browsers |
| Content Script APIs | Supported | Content blocking works |
| Storage API | Supported | Filter lists persist |
| Network Request Blocking | Supported | Core functionality works |

**Verdict:** Fully compatible. No modifications needed.

### SponsorBlock

| Aspect | Status | Notes |
|--------|--------|-------|
| Firefox Android Support | Officially supported | 682k+ users, 4.8 rating |
| GeckoView Compatibility | Full | Works with m.youtube.com |
| Content Script APIs | Supported | Video segment detection works |
| Storage API | Supported | User preferences persist |
| API Communication | Supported | Crowdsourced data fetching works |

**Verdict:** Fully compatible. Works on mobile YouTube (`m.youtube.com`).

### YouTube High Definition

| Aspect | Status | Notes |
|--------|--------|-------|
| Firefox Android Support | Officially supported | 158k+ users |
| GeckoView Compatibility | Full | Auto quality selection works |
| Content Script APIs | Supported | Video player manipulation works |
| Known Issues | Minor | May affect Shorts comments (clickability) |

**Verdict:** Compatible with minor known issues. Core HD functionality works.

## 6. Recommended Architecture

### Project Structure

```
app/src/main/
├── assets/
│   └── extensions/
│       ├── ublock-origin/
│       │   ├── manifest.json
│       │   ├── background.js
│       │   └── ...
│       ├── sponsorblock/
│       │   └── ...
│       └── youtube-hd/
│           └── ...
└── java/com/wpinrui/youtoob/
    └── extensions/
        ├── ExtensionManager.kt       # Coordinates all extensions
        ├── ExtensionConfig.kt        # Extension metadata/settings
        └── ExtensionMessageHandler.kt # Native messaging bridge
```

### ExtensionManager Design

```kotlin
class ExtensionManager(
    private val runtime: GeckoRuntime
) {
    private val controller = runtime.webExtensionController
    private val installedExtensions = mutableMapOf<String, WebExtension>()

    suspend fun initializeExtensions() {
        BUNDLED_EXTENSIONS.forEach { config ->
            controller.ensureBuiltIn(config.assetUri, config.id)
                .await()
                ?.let { ext ->
                    installedExtensions[ext.id] = ext
                    setupMessageDelegate(ext, config)
                }
        }
    }

    companion object {
        val BUNDLED_EXTENSIONS = listOf(
            ExtensionConfig(
                id = "uBlock0@raymondhill.net",
                name = "uBlock Origin",
                assetPath = "extensions/ublock-origin"
            ),
            ExtensionConfig(
                id = "sponsorBlocker@ajay.app",
                name = "SponsorBlock",
                assetPath = "extensions/sponsorblock"
            ),
            ExtensionConfig(
                id = "pinkrui@nicememe.com", // actual ID TBD
                name = "YouTube HD",
                assetPath = "extensions/youtube-hd"
            )
        )
    }
}
```

## 7. Implementation Steps

1. **Download extensions** - Get .xpi files from addons.mozilla.org
2. **Extract to assets** - Unzip into `app/src/main/assets/extensions/`
3. **Create ExtensionManager** - Singleton to manage extension lifecycle
4. **Initialize on startup** - Load extensions when GeckoRuntime initializes
5. **Set up messaging** - Configure message delegates for app communication
6. **Test functionality** - Verify ad-blocking, sponsor skipping, HD quality

## 8. Known Limitations

1. **Extension Updates** - Built-in extensions require APK updates
2. **Extension Settings UI** - GeckoView doesn't provide built-in settings UI; must build custom
3. **Browser Action** - No address bar; need custom UI for extension actions
4. **Signing for Remote** - Remote installations require Mozilla-signed extensions
5. **Storage Isolation** - Each extension has isolated storage

## 9. Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Extension breaks on GeckoView update | High | Pin GeckoView version, test before updates |
| Extension API deprecated | Medium | Monitor Mozilla release notes |
| YouTube changes break extensions | High | Extensions maintained by community; monitor updates |
| APK size bloat | Low | Extensions are ~2-5MB each; acceptable |

## References

- [GeckoView WebExtension Documentation](https://firefox-source-docs.mozilla.org/mobile/android/geckoview/consumer/web-extensions.html)
- [WebExtensionController API](https://mozilla.github.io/geckoview/javadoc/mozilla-central/org/mozilla/geckoview/WebExtensionController.html)
- [WebExtension API](https://mozilla.github.io/geckoview/javadoc/mozilla-central/org/mozilla/geckoview/WebExtension.html)
- [uBlock Origin GitHub](https://github.com/gorhill/uBlock)
- [SponsorBlock Android Wiki](https://github.com/ajayyy/SponsorBlock/wiki/Android)
- [YouTube HD Firefox Add-on](https://addons.mozilla.org/en-US/android/addon/youtube-high-definition/)
