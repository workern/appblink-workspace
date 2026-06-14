import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:firebase_storage/firebase_storage.dart';
import 'package:workern_models/workern_models.dart';
import 'dart:io';

/// A reusable document upload tile widget
/// Handles image picking, uploading to Firebase Storage, and state management
class DocumentUploadTile extends StatefulWidget {
  /// The title/label for the document type
  final String title;

  /// The document type identifier (used for file naming)
  final KycDocumentType documentType;

  /// The Firebase Storage path where the document should be uploaded
  final String storagePath;

  /// Current document URL if already uploaded
  final String? currentUrl;

  /// Callback when document is successfully uploaded
  final Function(String downloadUrl) onUploadSuccess;

  /// Callback when upload fails
  final Function(String error)? onUploadError;

  /// Optional subtitle text (defaults to "Optional" or "Uploaded ✓")
  final String? subtitle;

  /// Primary color for styling (optional)
  final Color? primaryColor;

  /// Verification status for the document
  final VerificationStatus? verificationStatus;

  /// Whether to show verification status badge
  final bool showVerificationStatus;

  /// Whether the document is optional (shows "Optional" in subtitle)
  final bool isOptional;

  const DocumentUploadTile({
    super.key,
    required this.title,
    required this.documentType,
    required this.storagePath,
    required this.onUploadSuccess,
    this.currentUrl,
    this.onUploadError,
    this.subtitle,
    this.primaryColor,
    this.verificationStatus,
    this.showVerificationStatus = false,
    this.isOptional = true,
  });

  @override
  State<DocumentUploadTile> createState() => _DocumentUploadTileState();
}

class _DocumentUploadTileState extends State<DocumentUploadTile> {
  File? _selectedFile;
  bool _isUploading = false;
  String? _uploadedUrl;

  @override
  void initState() {
    super.initState();
    _uploadedUrl = widget.currentUrl;
  }

  @override
  void didUpdateWidget(DocumentUploadTile oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.currentUrl != widget.currentUrl) {
      _uploadedUrl = widget.currentUrl;
    }
  }

  bool get _isUploaded => _uploadedUrl != null && _uploadedUrl!.isNotEmpty;

  Color get _primaryColor =>
      widget.primaryColor ?? Theme.of(context).primaryColor;

  Future<void> _pickAndUploadDocument() async {
    if (_isUploading) return;

    final ImagePicker picker = ImagePicker();

    final XFile? image = await picker.pickImage(
      source: ImageSource.gallery,
      maxWidth: 1920,
      maxHeight: 1080,
      imageQuality: 85,
    );

    if (image == null) return;

    final file = File(image.path);
    setState(() {
      _selectedFile = file;
      _isUploading = true;
    });

    await _uploadDocument(file);
  }

  Future<void> _uploadDocument(File file) async {
    try {
      // Generate file name with timestamp
      final timestamp = DateTime.now().millisecondsSinceEpoch;
      final fileExtension = file.path.split('.').last;
      final fileName = '${widget.documentType}_$timestamp.$fileExtension';

      // Create storage reference with the provided path
      final storageRef = FirebaseStorage.instance
          .ref(widget.storagePath)
          .child(fileName);

      // Upload file
      await storageRef.putFile(file);
      final downloadUrl = await storageRef.getDownloadURL();

      setState(() {
        _uploadedUrl = downloadUrl;
        _isUploading = false;
      });

      // Notify parent widget
      widget.onUploadSuccess(downloadUrl);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('${widget.title} uploaded successfully!'),
            backgroundColor: Colors.green,
          ),
        );
      }
    } catch (e) {
      setState(() {
        _isUploading = false;
      });

      final errorMessage = 'Error uploading ${widget.title}: $e';

      if (widget.onUploadError != null) {
        widget.onUploadError!(errorMessage);
      }

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(errorMessage), backgroundColor: Colors.red),
        );
      }
    }
  }

  IconData _getStatusIcon() {
    switch (widget.verificationStatus) {
      case VerificationStatus.verified:
        return Icons.check_circle;
      case VerificationStatus.rejected:
        return Icons.cancel;
      case VerificationStatus.pending:
      case VerificationStatus.notStarted:
      default:
        return Icons.pending;
    }
  }

  Color _getStatusColor() {
    switch (widget.verificationStatus) {
      case VerificationStatus.verified:
        return Colors.green;
      case VerificationStatus.rejected:
        return Colors.red;
      case VerificationStatus.pending:
      case VerificationStatus.notStarted:
      default:
        return Colors.orange;
    }
  }

  String _getStatusText() {
    switch (widget.verificationStatus) {
      case VerificationStatus.verified:
        return 'Verified';
      case VerificationStatus.rejected:
        return 'Rejected';
      case VerificationStatus.pending:
        return 'Pending Verification';
      case VerificationStatus.notStarted:
      default:
        return 'Pending Verification';
    }
  }

  Widget _buildUploadTile(BuildContext context) {
    return GestureDetector(
      onTap: _pickAndUploadDocument,
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          border: Border.all(color: Colors.grey.shade300),
          borderRadius: BorderRadius.circular(6),
        ),
        child: Row(
          children: [
            if (_isUploading)
              SizedBox(
                width: 24,
                height: 24,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  valueColor: AlwaysStoppedAnimation<Color>(_primaryColor),
                ),
              )
            else
              Icon(Icons.cloud_upload, color: Colors.grey.shade500, size: 24),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Text(
                        widget.title,
                        style: Theme.of(context).textTheme.labelSmall?.copyWith(
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      if (!widget.isOptional)
                        Text(
                          ' *',
                          style: Theme.of(context).textTheme.labelSmall
                              ?.copyWith(
                                fontWeight: FontWeight.w600,
                                color: Colors.red,
                              ),
                        ),
                    ],
                  ),
                  Text(
                    _isUploading
                        ? 'Uploading...'
                        : widget.subtitle ??
                              (widget.isOptional
                                  ? 'Optional'
                                  : 'Tap to upload'),
                    style: Theme.of(context).textTheme.labelSmall?.copyWith(
                      color: _isUploading
                          ? _primaryColor
                          : Colors.grey.shade600,
                    ),
                  ),
                ],
              ),
            ),
            Icon(
              Icons.arrow_forward_ios,
              size: 14,
              color: Colors.grey.shade400,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPreview(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        border: Border.all(color: _primaryColor),
        borderRadius: BorderRadius.circular(6),
        color: _primaryColor.withValues(alpha: 0.05),
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Image preview
          Stack(
            children: [
              GestureDetector(
                onTap: () => _openFullScreen(context),
                child: SizedBox(
                  height: 160,
                  width: double.infinity,
                  child: _selectedFile != null
                      ? Image.file(
                          _selectedFile!,
                          fit: BoxFit.cover,
                          errorBuilder: (_, _, _) => _placeholderPreview(),
                        )
                      : Image.network(
                          _uploadedUrl!,
                          fit: BoxFit.cover,
                          loadingBuilder: (context, child, progress) =>
                              progress == null
                              ? child
                              : Center(
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                    valueColor: AlwaysStoppedAnimation<Color>(
                                      _primaryColor,
                                    ),
                                  ),
                                ),
                          errorBuilder: (_, _, _) => _placeholderPreview(),
                        ),
                ),
              ),
              // Expand icon hint
              if (!_isUploading)
                Positioned(
                  top: 8,
                  right: 8,
                  child: GestureDetector(
                    onTap: () => _openFullScreen(context),
                    child: Container(
                      padding: const EdgeInsets.all(4),
                      decoration: BoxDecoration(
                        color: Colors.black45,
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: const Icon(
                        Icons.fullscreen,
                        color: Colors.white,
                        size: 18,
                      ),
                    ),
                  ),
                ),
              if (_isUploading)
                Positioned.fill(
                  child: Container(
                    color: Colors.black38,
                    child: const Center(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          CircularProgressIndicator(
                            strokeWidth: 2,
                            valueColor: AlwaysStoppedAnimation<Color>(
                              Colors.white,
                            ),
                          ),
                          SizedBox(height: 8),
                          Text(
                            'Uploading...',
                            style: TextStyle(color: Colors.white, fontSize: 12),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
            ],
          ),
          // Footer row: title + change button
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            child: Row(
              children: [
                Icon(Icons.check_circle, color: _primaryColor, size: 16),
                const SizedBox(width: 8),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Text(
                            widget.title,
                            style: Theme.of(context).textTheme.labelSmall
                                ?.copyWith(fontWeight: FontWeight.w600),
                          ),
                          if (!widget.isOptional)
                            Text(
                              ' *',
                              style: Theme.of(context).textTheme.labelSmall
                                  ?.copyWith(
                                    fontWeight: FontWeight.w600,
                                    color: Colors.red,
                                  ),
                            ),
                        ],
                      ),
                      Text(
                        'Uploaded ✓',
                        style: Theme.of(
                          context,
                        ).textTheme.labelSmall?.copyWith(color: _primaryColor),
                      ),
                    ],
                  ),
                ),
                OutlinedButton.icon(
                  onPressed: _isUploading ? null : _pickAndUploadDocument,
                  icon: const Icon(Icons.camera_alt_outlined, size: 14),
                  label: const Text('Change'),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: _primaryColor,
                    side: BorderSide(color: _primaryColor),
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 4,
                    ),
                    textStyle: const TextStyle(fontSize: 12),
                    minimumSize: Size.zero,
                    tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _placeholderPreview() => Container(
    height: 160,
    color: Colors.grey.shade100,
    child: Center(
      child: Icon(
        Icons.image_not_supported_outlined,
        size: 40,
        color: Colors.grey.shade400,
      ),
    ),
  );

  void _openFullScreen(BuildContext context) {
    final ImageProvider imageProvider = _selectedFile != null
        ? FileImage(_selectedFile!) as ImageProvider
        : NetworkImage(_uploadedUrl!);

    showDialog<void>(
      context: context,
      barrierColor: Colors.black87,
      builder: (_) => Dialog.fullscreen(
        backgroundColor: Colors.black,
        child: Stack(
          children: [
            Center(
              child: InteractiveViewer(
                minScale: 0.5,
                maxScale: 5.0,
                child: Image(image: imageProvider, fit: BoxFit.contain),
              ),
            ),
            Positioned(
              top: 0,
              left: 0,
              right: 0,
              child: SafeArea(
                child: Padding(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 4,
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        widget.title,
                        style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.w600,
                          fontSize: 16,
                        ),
                      ),
                      IconButton(
                        onPressed: () => Navigator.of(context).pop(),
                        icon: const Icon(
                          Icons.close,
                          color: Colors.white,
                          size: 24,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        if (_isUploaded) _buildPreview(context) else _buildUploadTile(context),
        if (widget.showVerificationStatus &&
            _isUploaded &&
            widget.verificationStatus != null)
          Padding(
            padding: const EdgeInsets.only(top: 8, left: 16),
            child: Row(
              children: [
                Icon(_getStatusIcon(), size: 16, color: _getStatusColor()),
                const SizedBox(width: 6),
                Text(
                  _getStatusText(),
                  style: TextStyle(
                    fontSize: 12,
                    color: _getStatusColor(),
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ),
      ],
    );
  }
}
