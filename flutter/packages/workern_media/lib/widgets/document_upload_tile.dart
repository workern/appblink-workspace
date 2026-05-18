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

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        GestureDetector(
          onTap: _pickAndUploadDocument,
          child: Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              border: Border.all(
                color: _isUploaded ? _primaryColor : Colors.grey.shade300,
              ),
              borderRadius: BorderRadius.circular(6),
              color: _isUploaded
                  ? _primaryColor.withOpacity(0.05)
                  : Colors.transparent,
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
                  Icon(
                    _isUploaded ? Icons.check_circle : Icons.cloud_upload,
                    color: _isUploaded ? _primaryColor : Colors.grey.shade500,
                    size: 24,
                  ),
                const SizedBox(width: 12),
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
                        _isUploading
                            ? 'Uploading...'
                            : widget.subtitle ??
                                  (_isUploaded
                                      ? 'Uploaded ✓'
                                      : (widget.isOptional ? 'Optional' : '')),
                        style: Theme.of(context).textTheme.labelSmall?.copyWith(
                          color: _isUploading || _isUploaded
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
        ),
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
