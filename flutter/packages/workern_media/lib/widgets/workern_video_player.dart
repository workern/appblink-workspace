import 'package:flutter/material.dart';
import 'package:video_player/video_player.dart';
import 'package:chewie/chewie.dart';

class WorkernVideoPlayer extends StatefulWidget {
  final String videoUrl;
  final bool autoPlay;
  final bool looping;
  final bool showControls;
  final double? aspectRatio;
  final BoxFit fit;
  final Widget? placeholder;
  final ValueChanged<bool>? onPlayingChanged;
  final VoidCallback? onError;

  const WorkernVideoPlayer({
    super.key,
    required this.videoUrl,
    this.autoPlay = true,
    this.looping = false,
    this.showControls = true,
    this.aspectRatio,
    this.fit = BoxFit.contain,
    this.placeholder,
    this.onPlayingChanged,
    this.onError,
  });

  @override
  State<WorkernVideoPlayer> createState() => _WorkernVideoPlayerState();
}

class _WorkernVideoPlayerState extends State<WorkernVideoPlayer> {
  late VideoPlayerController _videoController;
  ChewieController? _chewieController;
  bool _isInitialized = false;
  bool _hasError = false;
  String? _errorMessage;

  /// Pause the video
  void pause() {
    if (_isInitialized && _videoController.value.isPlaying) {
      debugPrint('🎬 WorkernVideoPlayer: Pausing video');
      _videoController.pause();
    }
  }

  @override
  void initState() {
    super.initState();
    _initializeVideo();
  }

  Future<void> _initializeVideo() async {
    try {
      debugPrint(
        '🎬 WorkernVideoPlayer: Initializing video from ${widget.videoUrl}',
      );

      _videoController = VideoPlayerController.networkUrl(
        Uri.parse(widget.videoUrl),
      );

      debugPrint('🎬 WorkernVideoPlayer: Starting video initialization...');
      await _videoController.initialize();
      debugPrint('🎬 WorkernVideoPlayer: Video initialized successfully');

      if (mounted) {
        // Add listener to track playing state
        _videoController.addListener(_videoListener);

        // Add error listener to track video playback errors
        _videoController.addListener(() {
          if (_videoController.value.hasError) {
            debugPrint(
              '❌ WorkernVideoPlayer: Video playback error: ${_videoController.value.errorDescription}',
            );
          }
        });

        _chewieController = ChewieController(
          videoPlayerController: _videoController,
          autoPlay: widget.autoPlay,
          looping: widget.looping,
          showControls: widget.showControls,
          aspectRatio: widget.aspectRatio ?? _videoController.value.aspectRatio,
          errorBuilder: (context, errorMessage) {
            debugPrint(
              '❌ WorkernVideoPlayer: Chewie error builder called: $errorMessage',
            );
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.error_outline, color: Colors.red, size: 48),
                  const SizedBox(height: 16),
                  const Text(
                    'Failed to load video',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.w500),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    errorMessage,
                    style: const TextStyle(fontSize: 12, color: Colors.grey),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            );
          },
        );

        setState(() {
          _isInitialized = true;
        });

        debugPrint(
          '🎬 WorkernVideoPlayer: Chewie controller created, autoPlay: ${widget.autoPlay}',
        );

        if (widget.autoPlay) {
          debugPrint(
            '🎬 WorkernVideoPlayer: Auto-play enabled, checking playback status...',
          );
          // Check if video actually started playing after a brief delay
          Future.delayed(const Duration(milliseconds: 500), () {
            if (mounted && !_videoController.value.isPlaying) {
              debugPrint(
                '⚠️ WorkernVideoPlayer: Video did not start playing automatically',
              );
              debugPrint(
                '   - Is buffering: ${_videoController.value.isBuffering}',
              );
              debugPrint('   - Has error: ${_videoController.value.hasError}');
              debugPrint(
                '   - Is initialized: ${_videoController.value.isInitialized}',
              );
              debugPrint('   - Duration: ${_videoController.value.duration}');
            } else if (mounted) {
              debugPrint('✅ WorkernVideoPlayer: Video is playing successfully');
            }
          });
        }
      }
    } catch (e, stackTrace) {
      debugPrint('❌ WorkernVideoPlayer: Failed to initialize video');
      debugPrint('   URL: ${widget.videoUrl}');
      debugPrint('   Error: $e');
      debugPrint('   StackTrace: $stackTrace');

      if (mounted) {
        setState(() {
          _hasError = true;
          _errorMessage = e.toString();
        });
        widget.onError?.call();
      }
    }
  }

  void _videoListener() {
    if (widget.onPlayingChanged != null && mounted) {
      final isPlaying =
          _videoController.value.isPlaying &&
          !_videoController.value.isBuffering;
      widget.onPlayingChanged!(isPlaying);

      // Log state changes for debugging
      if (_videoController.value.isPlaying != (_lastPlayingState ?? false)) {
        debugPrint(
          '🎬 WorkernVideoPlayer: Playing state changed to ${_videoController.value.isPlaying}',
        );
        _lastPlayingState = _videoController.value.isPlaying;
      }
    }
  }

  bool? _lastPlayingState;

  @override
  void dispose() {
    _videoController.removeListener(_videoListener);
    _chewieController?.dispose();
    _videoController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (_hasError) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline, color: Colors.red, size: 48),
            const SizedBox(height: 16),
            const Text(
              'Failed to load video',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.w500),
            ),
            const SizedBox(height: 8),
            Text(
              _errorMessage ?? 'Unknown error',
              style: const TextStyle(fontSize: 12, color: Colors.grey),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      );
    }

    if (!_isInitialized || _chewieController == null) {
      return Stack(
        fit: StackFit.expand,
        children: [
          if (widget.placeholder != null) widget.placeholder!,
          const Center(child: CircularProgressIndicator()),
        ],
      );
    }

    return Chewie(controller: _chewieController!);
  }
}
