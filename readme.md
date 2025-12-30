# YouToob

A premium YouTube experience for Android using GeckoView with Firefox extensions.

## What is YouToob?

YouToob wraps YouTube's mobile site in Firefox's GeckoView engine, enabling Firefox extensions like uBlock Origin and SponsorBlock to work natively. This provides an ad-free, sponsor-free YouTube experience with enhanced controls and customization.

## Why YouToob?

- **Ad-free**: uBlock Origin blocks all YouTube ads
- **Sponsor-free**: SponsorBlock automatically skips sponsor segments
- **Better quality**: Force HD video quality by default
- **Custom controls**: Gestures, background playback, PiP mode
- **Download support**: Built-in video download manager

## Development Roadmap

### Phase 1: Core Foundation ✅ (Complete)
**Goal**: Get basic GeckoView wrapper working with YouTube

- [x] Set up Android project structure
- [x] Integrate GeckoView dependency
- [x] Create basic Activity with GeckoView
- [x] Load YouTube mobile site successfully
- [x] Test basic video playback
- [x] Handle WebView permissions (audio, video, storage)

**Estimated**: 1-2 weeks

### Phase 2: Extension Integration ✅ (Complete)
**Goal**: Get Firefox extensions working

- [x] Research GeckoView extension API
- [x] Bundle uBlock Origin extension
- [x] Bundle SponsorBlock extension
- [x] Bundle YouTube HD extension
- [x] Create extension manager system
- [x] Test extension loading and functionality

**Estimated**: 2-3 weeks

### Phase 3: Custom UI & Controls 🔄 (Current Phase)
**Goal**: Improve UX beyond basic browser wrapper

- [x] Design custom bottom navigation
- [ ] Implement gesture controls (swipe for volume/brightness)
- [ ] Add custom playback controls
- [x] Hide unnecessary YouTube UI elements (via CSS injection)
- [ ] Create settings screen for app customization
- [ ] Implement custom theming

**Estimated**: 2 weeks

### Phase 4: Download Manager 📋
**Goal**: Integrate yt-dlp for video downloads

- [ ] Research yt-dlp Android integration options
- [ ] Create download manager UI
- [ ] Implement download queue system
- [ ] Add download quality selection
- [ ] Handle storage permissions
- [ ] Add download progress notifications
- [ ] Create downloaded videos library

**Estimated**: 2-3 weeks

### Phase 5: Advanced Features 📋
**Goal**: Match or exceed native app experience

- [ ] Background audio playback
- [ ] Picture-in-Picture (PiP) mode
- [ ] Media session integration (lock screen controls)
- [ ] Share intent handling
- [ ] Custom subscription management
- [ ] Watch history tracking
- [ ] Playlist management

**Estimated**: 3-4 weeks

### Phase 6: Performance & Polish 📋
**Goal**: Optimize and refine

- [ ] Memory optimization for GeckoView
- [ ] Battery usage optimization
- [ ] Aggressive caching strategies
- [ ] Preloading optimizations
- [ ] UI/UX refinements based on testing
- [ ] Comprehensive error handling
- [ ] Crash reporting setup
- [ ] Handle extension updates

**Estimated**: 2 weeks

### Phase 7: Release Preparation 📋
**Goal**: Prepare for distribution

- [ ] Comprehensive testing on various devices
- [ ] Write user documentation
- [ ] Create app store listing materials
- [ ] Legal review (ToS, privacy policy)
- [ ] F-Droid submission preparation
- [ ] GitHub Releases setup
- [ ] Community guidelines

**Estimated**: 1-2 weeks

## Tech Stack

- **Language**: Kotlin
- **Min SDK**: 29 (Android 10)
- **Target SDK**: 36 (Android 16)
- **Rendering**: GeckoView
- **Architecture**: MVVM + Repository pattern
- **DI**: Dagger Hilt
- **Async**: Coroutines + Flow
- **Networking**: Retrofit (for yt-dlp integration)

## Build & Run

```bash
# Clone the repository
git clone https://github.com/yourusername/youtoob.git
cd youtoob

# Build the project
./gradlew build

# Install on device
./gradlew installDebug

# Run tests
./gradlew test
```

## Roadmap Status

- **Current Phase**: Phase 3 (Custom UI & Controls)
- **Next Milestone**: Complete gesture controls and custom playback
- **Total Progress**: ~30% (Phases 1-2 complete!)
