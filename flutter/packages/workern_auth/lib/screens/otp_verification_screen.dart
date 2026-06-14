import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_auth/firebase_auth.dart'
    as auth
    show PhoneAuthProvider;
import 'package:pinput/pinput.dart';
import 'package:workern_widgets/workern_widgets.dart';

class OtpVerificationScreen extends StatefulWidget {
  final String phoneNumber;
  final Color primaryColor;
  final String verificationId;
  final VoidCallback onVerified;
  final Function(String) onError;
  final VoidCallback onBack;
  final VoidCallback onResendOTP;

  const OtpVerificationScreen({
    super.key,
    required this.phoneNumber,
    required this.primaryColor,
    required this.verificationId,
    required this.onVerified,
    required this.onError,
    required this.onBack,
    required this.onResendOTP,
  });

  @override
  State<OtpVerificationScreen> createState() => _OtpVerificationScreenState();
}

class _OtpVerificationScreenState extends State<OtpVerificationScreen> {
  String _otpValue = '';
  final _isVerifying = ValueNotifier<bool>(false);
  final _resendCountdown = ValueNotifier<int>(0);
  final _errorMessage = ValueNotifier<String?>('');

  @override
  void initState() {
    super.initState();
    _startResendCountdown();
  }

  @override
  void dispose() {
    _isVerifying.dispose();
    _resendCountdown.dispose();
    _errorMessage.dispose();
    super.dispose();
  }

  void _startResendCountdown() {
    _resendCountdown.value = 33;
    _errorMessage.value = '';
    Future.doWhile(() async {
      await Future.delayed(const Duration(seconds: 1));
      if (mounted) _resendCountdown.value--;
      return _resendCountdown.value > 0 && mounted;
    });
  }

  void _handleResendOTP() {
    _otpValue = '';
    _startResendCountdown();
    widget.onResendOTP();
  }

  Future<void> _verifyOTP() async {
    final otp = _otpValue.replaceAll(' ', '');
    if (otp.length != 6 || _isVerifying.value) return;

    _isVerifying.value = true;

    try {
      final credential = auth.PhoneAuthProvider.credential(
        verificationId: widget.verificationId,
        smsCode: otp,
      );
      await FirebaseAuth.instance.signInWithCredential(credential);
      if (mounted) widget.onVerified();
    } catch (e) {
      if (mounted) {
        _isVerifying.value = false;
        final errorMsg = _mapErrorMessage(e.toString());
        _errorMessage.value = errorMsg;
        widget.onError(e.toString());
        debugPrint('❌ OTP verification failed: $e');
      }
    }
  }

  String _mapErrorMessage(String error) {
    if (error.contains('invalid-verification-code')) {
      return 'Invalid OTP. Please try again.';
    } else if (error.contains('code-expired')) {
      return 'OTP has expired. Please request a new one.';
    } else if (error.contains('too-many-attempts')) {
      return 'Too many attempts. Please try again later.';
    } else {
      return 'Verification failed. Please try again.';
    }
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return Scaffold(
      backgroundColor: cs.surface,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.arrow_back, color: cs.onSurface),
          onPressed: widget.onBack,
        ),
        title: Text(
          'OTP Verification',
          style: TextStyle(
            color: cs.onSurface,
            fontWeight: FontWeight.bold,
          ),
        ),
        centerTitle: true,
      ),
      body: GestureDetector(
        behavior: HitTestBehavior.translucent,
        onTap: () => FocusScope.of(context).unfocus(),
        child: Stack(
          children: [
            const WorkernAmbientBackground(),
            SafeArea(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const SizedBox(height: 40),
                    Text(
                      'We have sent a verification code to',
                      style: Theme.of(
                        context,
                      ).textTheme.bodyLarge?.copyWith(color: cs.onSurfaceVariant),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 8),
                    Text(
                      widget.phoneNumber,
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                        color: cs.onSurface,
                      ),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 40),

                    // OTP Input — pinput uses a single hidden TextField,
                    // so the keyboard never flickers between slots.
                    Center(
                      child: Builder(
                        builder: (context) {
                          final borderColor = cs.outline.withValues(alpha: 0.3);
                          const cellSize = 52.0;
                          final textStyle = TextStyle(
                            fontSize: 22,
                            fontWeight: FontWeight.w600,
                            color: cs.onSurface,
                            letterSpacing: 0,
                          );

                          final defaultTheme = PinTheme(
                            width: cellSize,
                            height: cellSize,
                            textStyle: textStyle,
                            decoration: BoxDecoration(
                              color: cs.onSurface.withValues(alpha: 0.05),
                              border: Border.all(color: borderColor),
                              borderRadius: BorderRadius.circular(8),
                            ),
                          );

                          return Pinput(
                            length: 6,
                            keyboardType: TextInputType.number,
                            autofocus: true,
                            cursor: Container(
                              width: 2.0,
                              height: 24,
                              decoration: BoxDecoration(
                                color: widget.primaryColor,
                                borderRadius: BorderRadius.circular(1),
                              ),
                            ),
                            onCompleted: (value) {
                              _otpValue = value;
                              _verifyOTP();
                            },
                            onChanged: (value) => _otpValue = value,
                            defaultPinTheme: defaultTheme,
                            focusedPinTheme: defaultTheme.copyWith(
                              decoration: BoxDecoration(
                                color: cs.onSurface.withValues(alpha: 0.02),
                                border: Border.all(
                                  color: widget.primaryColor,
                                  width: 2.0,
                                ),
                                borderRadius: BorderRadius.circular(8),
                                boxShadow: [
                                  BoxShadow(
                                    color: widget.primaryColor.withValues(
                                      alpha: 0.15,
                                    ),
                                    blurRadius: 4,
                                    spreadRadius: 2,
                                  ),
                                ],
                              ),
                            ),
                            submittedPinTheme: defaultTheme.copyWith(
                              decoration: defaultTheme.decoration?.copyWith(
                                border: Border.all(
                                  color: widget.primaryColor.withValues(alpha: 0.6),
                                ),
                              ),
                            ),
                            separatorBuilder: (index) => index == 2
                                ? const SizedBox(width: 20)
                                : const SizedBox(width: 8),
                          );
                        },
                      ),
                    ),
                    const SizedBox(height: 24),

                    // Error message display
                    ValueListenableBuilder<String?>(
                      valueListenable: _errorMessage,
                      builder: (context, error, _) =>
                          error != null && error.isNotEmpty
                          ? Container(
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: cs.errorContainer.withValues(alpha: 0.2),
                                border: Border.all(
                                  color: cs.error.withValues(alpha: 0.5),
                                ),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Text(
                                error,
                                style: TextStyle(
                                  color: cs.error,
                                  fontSize: 13,
                                  fontWeight: FontWeight.w500,
                                ),
                                textAlign: TextAlign.center,
                              ),
                            )
                          : const SizedBox.shrink(),
                    ),
                    const SizedBox(height: 24),

                    ValueListenableBuilder<bool>(
                      valueListenable: _isVerifying,
                      builder: (context, isVerifying, _) => isVerifying
                          ? Center(
                              child: Column(
                                children: [
                                  CircularProgressIndicator(
                                    valueColor: AlwaysStoppedAnimation<Color>(
                                      widget.primaryColor,
                                    ),
                                  ),
                                  const SizedBox(height: 16),
                                  Text(
                                    'Verifying...',
                                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                      color: cs.onSurfaceVariant,
                                    ),
                                  ),
                                ],
                              ),
                            )
                          : const SizedBox.shrink(),
                    ),
                    const SizedBox(height: 12),

                    // Resend OTP Section with ScalePress
                    ValueListenableBuilder<int>(
                      valueListenable: _resendCountdown,
                      builder: (context, countdown, _) => ScalePress(
                        active: countdown == 0,
                        onTap: countdown == 0 ? _handleResendOTP : null,
                        child: Center(
                          child: Padding(
                            padding: const EdgeInsets.symmetric(vertical: 8.0),
                            child: RichText(
                              text: TextSpan(
                                style: Theme.of(context).textTheme.bodyMedium
                                    ?.copyWith(color: cs.onSurfaceVariant),
                                children: [
                                  const TextSpan(text: "Didn't get the OTP? "),
                                  TextSpan(
                                    text: countdown > 0
                                        ? 'Resend in ${countdown}s'
                                        : 'Resend SMS',
                                    style: TextStyle(
                                      color: countdown > 0
                                          ? cs.onSurfaceVariant.withValues(alpha: 0.5)
                                          : widget.primaryColor,
                                      fontWeight: countdown > 0
                                          ? FontWeight.normal
                                          : FontWeight.w600,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 24),

                    // Back to phone number option with ScalePress
                    ScalePress(
                      onTap: widget.onBack,
                      child: Padding(
                        padding: const EdgeInsets.symmetric(vertical: 12.0),
                        child: Text(
                          'Use a different mobile number',
                          style: TextStyle(
                            color: widget.primaryColor,
                            fontWeight: FontWeight.bold,
                          ),
                          textAlign: TextAlign.center,
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
