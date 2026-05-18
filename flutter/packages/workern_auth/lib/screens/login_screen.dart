import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter/gestures.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:firebase_auth/firebase_auth.dart'
    as fbAuth
    show
        FirebaseAuth,
        AuthCredential,
        PhoneAuthCredential,
        MultiFactorResolver,
        UserCredential,
        ConfirmationResult;
import 'package:firebase_ui_auth/firebase_ui_auth.dart';
import 'package:firebase_ui_oauth_google/firebase_ui_oauth_google.dart';
import 'package:firebase_ui_oauth_apple/firebase_ui_oauth_apple.dart';
import 'package:workern_widgets/workern_widgets.dart';
import '../models/country_code.dart';
import 'otp_verification_screen.dart';
import '../widgets/auth_snackbar.dart';

/// Authentication flow states
enum _AuthStep { enterPhone, enterOTP, loading }

/// A customizable login screen with custom UI
///
/// Features:
/// - Custom branding (app name, description, colors)
/// - Phone, Email, and Social auth
/// - Modern UI matching industry standards
/// - Proper async flow handling with auth state tracking
class LoginScreen extends StatefulWidget {
  /// Application name to display at the top
  final String appName;

  /// Application description/tagline
  final String appDescription;

  /// Primary color for the app branding
  final Color primaryColor;

  /// Optional logo widget
  final Widget? logo;

  /// Google OAuth client ID for Google Sign-In
  /// If provided, Google Sign-In button will be shown
  final String? googleClientId;

  /// Whether to show Sign in with Apple button
  /// Defaults to true on iOS/macOS where it is required by App Store guidelines
  final bool showAppleSignIn;

  /// URL to open when user taps "Terms of Service"
  final String? termsUrl;

  /// URL to open when user taps "Privacy Policy"
  final String? privacyPolicyUrl;

  /// URL to open when user taps "Content Policies"
  final String? contentPoliciesUrl;

  /// Optional app-level error snackbar renderer.
  /// If not provided, a default themed auth snackbar is used.
  final void Function(BuildContext context, String message)? onErrorMessage;

  const LoginScreen({
    super.key,
    this.appName = 'App',
    this.appDescription = 'Welcome to our app',
    this.primaryColor = Colors.blue,
    this.logo,
    this.googleClientId,
    this.showAppleSignIn = true,
    this.termsUrl,
    this.privacyPolicyUrl,
    this.contentPoliciesUrl,
    this.onErrorMessage,
  });

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen>
    implements PhoneAuthListener {
  final TextEditingController _phoneController = TextEditingController();
  late CountryCode _selectedCountry;
  _AuthStep _currentStep = _AuthStep.enterPhone;
  String? _verificationId;
  String _phoneNumber = '';

  late final PhoneAuthProvider phoneProvider = PhoneAuthProvider()
    ..authListener = this
    ..auth = fbAuth.FirebaseAuth.instance;

  @override
  void initState() {
    super.initState();
    // Initialize with India as default
    _selectedCountry = countryCodes.firstWhere(
      (c) => c.code == 'IN',
      orElse: () => countryCodes[0],
    );

    // Check if user is already signed in
    _checkInitialAuthState();
  }

  void _checkInitialAuthState() {
    // If user is already signed in, they shouldn't be on login screen
    // The router should handle this, but as a fallback we check here
    final currentUser = fbAuth.FirebaseAuth.instance.currentUser;
    if (currentUser != null) {
      debugPrint('⚠️ User already signed in: ${currentUser.uid}');
      // Don't change state - let the router handle navigation
    }
  }

  @override
  fbAuth.FirebaseAuth get auth => fbAuth.FirebaseAuth.instance;

  @override
  AuthProvider get provider => phoneProvider;

  @override
  void onCredentialReceived(fbAuth.AuthCredential credential) {
    if (credential is fbAuth.PhoneAuthCredential) {
      phoneProvider.onCredentialReceived(credential, AuthAction.signIn);
    }
  }

  @override
  void onMFARequired(fbAuth.MultiFactorResolver resolver) {
    // MFA not implemented yet
  }

  @override
  void dispose() {
    _phoneController.dispose();
    super.dispose();
  }

  void _verifyPhoneNumber() {
    // Prevent double submission
    if (_currentStep != _AuthStep.enterPhone) return;

    final rawPhoneInput = _phoneController.text.trim();
    final digitsOnlyPhone = rawPhoneInput.replaceAll(RegExp(r'[^0-9]'), '');

    if (digitsOnlyPhone.isEmpty) {
      _showError('Please enter a phone number');
      return;
    }

    final hasInvalidCharacters = rawPhoneInput != digitsOnlyPhone;
    if (hasInvalidCharacters) {
      _showError('Please enter a valid mobile number using digits only.');
      return;
    }

    if (digitsOnlyPhone.length < 7 || digitsOnlyPhone.length > 15) {
      _showError('Please enter a valid mobile number.');
      return;
    }

    final phoneNumber = _selectedCountry.dialCode + digitsOnlyPhone;

    setState(() => _currentStep = _AuthStep.loading);
    _phoneNumber = phoneNumber;

    phoneProvider.sendVerificationCode(
      phoneNumber: phoneNumber,
      action: AuthAction.signIn,
    );
  }

  void _resendOTP() {
    if (_phoneNumber.isEmpty) {
      _showError('Phone number is missing. Please try again.');
      return;
    }

    if (mounted) {
      setState(() => _currentStep = _AuthStep.loading);
    }

    phoneProvider.sendVerificationCode(
      phoneNumber: _phoneNumber,
      action: AuthAction.signIn,
    );
  }

  @override
  void onCodeSent(String verificationId, [int? forceResendToken]) {
    if (mounted) {
      setState(() {
        _currentStep = _AuthStep.enterOTP;
        _verificationId = verificationId;
      });
      debugPrint(
        '✅ OTP sent to $_phoneNumber, verification ID: $verificationId',
      );
    }
  }

  @override
  void onSMSCodeRequested(String phoneNumber) {
    // Called before onCodeSent
    debugPrint('📱 SMS code requested for: $phoneNumber');
  }

  @override
  void onVerificationCompleted(fbAuth.PhoneAuthCredential credential) {
    // Auto sign-in if available (instant verification)
    if (mounted) {
      setState(() => _currentStep = _AuthStep.loading);
      phoneProvider.onCredentialReceived(credential, AuthAction.signIn);
    }
  }

  @override
  void onBeforeSignIn() {
    if (mounted) {
      // Only set loading if we're in a valid auth flow (not initial load)
      if (_currentStep == _AuthStep.enterPhone ||
          _currentStep == _AuthStep.enterOTP) {
        setState(() => _currentStep = _AuthStep.loading);
      }
    }
  }

  @override
  void onSignedIn(fbAuth.UserCredential credential) {
    // Don't navigate here - let the router handle it via authStateChanges()
    debugPrint('✅ User signed in: ${credential.user?.phoneNumber}');
  }

  @override
  void onError(Object error) {
    if (mounted) {
      final errorMessage = _mapAuthErrorMessage(error, step: _currentStep);
      // If OTP has already been sent, stay on OTP screen so the user can retry.
      final hasActiveOtpFlow = _verificationId != null;
      setState(() {
        _currentStep = hasActiveOtpFlow
            ? _AuthStep.enterOTP
            : _AuthStep.enterPhone;
        if (!hasActiveOtpFlow) {
          _verificationId = null;
        }
      });

      _showError(errorMessage);
      debugPrint('❌ Auth error: $error');
    }
  }

  String _mapAuthErrorMessage(Object error, {required _AuthStep step}) {
    final message = error.toString();

    if (message.contains('firebase_auth/invalid-phone-number') ||
        message.contains('invalid-phone-number') ||
        message.contains('firebase_auth/missing-phone-number') ||
        message.contains('missing-phone-number')) {
      return 'Please enter a valid mobile number and try again.';
    }

    if (message.contains('firebase_auth/missing-client-identifier')) {
      return 'Verification setup is incomplete for this Android build. Please update Firebase SHA fingerprints and refresh google-services.json.';
    }

    if (message.contains('firebase_auth/invalid-verification-code') ||
        message.contains('invalid-verification-code')) {
      return 'Incorrect OTP. Please enter the 6-digit code sent to your phone.';
    }

    if (message.contains('firebase_auth/session-expired') ||
        message.contains('session-expired')) {
      return 'This OTP has expired. Please request a new code.';
    }

    if (message.contains('firebase_auth/too-many-requests') ||
        message.contains('too-many-requests')) {
      return 'Too many attempts. Please wait a moment before trying again.';
    }

    if (step == _AuthStep.enterPhone) {
      return 'Could not send OTP right now. Please check your mobile number and try again.';
    }

    if (message.contains('AutoresolutionFailedException') ||
        message.contains('SmsRetrieverHelper')) {
      return 'Auto OTP detection timed out. Please enter the code manually or resend SMS.';
    }

    return 'Could not verify OTP right now. Please try again.';
  }

  @override
  void onCanceled() {
    if (mounted) {
      setState(() => _currentStep = _AuthStep.enterPhone);
    }
  }

  @override
  void onConfirmationRequested(fbAuth.ConfirmationResult result) {}

  @override
  void onCredentialLinked(fbAuth.AuthCredential credential) {}

  void _showError(String message) {
    final show = widget.onErrorMessage;
    if (show != null) {
      show(context, message);
      return;
    }

    AuthSnackBar.showError(context, message);
  }

  @override
  Widget build(BuildContext context) {
    // Show appropriate screen based on current step
    return switch (_currentStep) {
      _AuthStep.enterPhone => _buildPhoneEntryScreen(),
      _AuthStep.enterOTP => _buildOTPScreen(),
      _AuthStep.loading => _buildLoadingScreen(),
    };
  }

  Widget _buildPhoneEntryScreen() {
    final cs = Theme.of(context).colorScheme;
    return Scaffold(
      backgroundColor: cs.surface,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: 48),
              // Header
              if (widget.logo != null) ...[
                Center(
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(22),
                    child: widget.logo!,
                  ),
                ),
                const SizedBox(height: 20),
              ],
              Text(
                widget.appName,
                style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: cs.onSurface,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 6),
              Text(
                widget.appDescription,
                style: Theme.of(
                  context,
                ).textTheme.bodyMedium?.copyWith(color: cs.onSurfaceVariant),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 40),
              Text(
                'Log in or sign up',
                style: Theme.of(context).textTheme.titleSmall?.copyWith(
                  color: cs.onSurfaceVariant,
                  letterSpacing: 0.2,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 20),
              // Phone input with country selector in vertical alignment
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Country code selector with search
                  WorkernSelectWithSearch<CountryCode>(
                    label: 'Select Country',
                    initialValue: _selectedCountry,
                    items: countryCodes,
                    placeholder: 'Choose your country',
                    searchPlaceholder: 'Search country...',
                    noResultsText: 'No country found',
                    searchPredicate: (country, query) =>
                        country.name.toLowerCase().contains(
                          query.toLowerCase(),
                        ) ||
                        country.dialCode.contains(query),
                    itemBuilder: (context, country) => Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          country.flag,
                          style: const TextStyle(fontSize: 18),
                        ),
                        const SizedBox(width: 8),
                        Text(
                          country.name,
                          style: const TextStyle(fontSize: 13),
                        ),
                        const SizedBox(width: 8),
                        Text(
                          country.dialCode,
                          style: const TextStyle(
                            fontSize: 12,
                            color: Colors.grey,
                          ),
                        ),
                      ],
                    ),
                    selectedOptionBuilder: (context, country) => Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          country.flag,
                          style: const TextStyle(fontSize: 18),
                        ),
                        const SizedBox(width: 8),
                        Text('${country.name} (${country.dialCode})'),
                      ],
                    ),
                    onChanged: (CountryCode? newCountry) {
                      if (newCountry != null) {
                        setState(() => _selectedCountry = newCountry);
                      }
                    },
                  ),
                  const SizedBox(height: 16),
                  // Phone number input
                  PrefixTextField(
                    controller: _phoneController,
                    currencySymbol: _selectedCountry.dialCode,
                    labelText: 'Mobile Number',
                    hintText: 'Enter your mobile number',
                    keyboardType: TextInputType.phone,
                    primaryColor: widget.primaryColor,
                    onChanged: (_) => setState(() {}),
                  ),
                ],
              ),
              const SizedBox(height: 20),

              // Continue button
              WorkernPrimaryButton(
                label: 'Continue',
                onPressed: _verifyPhoneNumber,
                primaryColor: widget.primaryColor,
                height: 56,
                fontSize: 16,
                borderRadius: 8,
              ),
              const SizedBox(height: 32),

              // Social sign-in options
              if (widget.googleClientId != null ||
                  (widget.showAppleSignIn && Platform.isIOS)) ...[
                // OR Divider
                Row(
                  children: [
                    Expanded(child: Divider(color: cs.outlineVariant)),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      child: Text(
                        'OR',
                        style: TextStyle(
                          color: cs.onSurfaceVariant,
                          fontWeight: FontWeight.w500,
                          fontSize: 12,
                        ),
                      ),
                    ),
                    Expanded(child: Divider(color: cs.outlineVariant)),
                  ],
                ),
                const SizedBox(height: 24),

                // Sign in with Apple (iOS only, shown first per Apple guidelines)
                if (widget.showAppleSignIn && Platform.isIOS) ...[
                  OAuthProviderButton(
                    provider: AppleProvider(),
                    action: AuthAction.signIn,
                  ),
                  const SizedBox(height: 12),
                ],

                // Google Sign-In Button
                if (widget.googleClientId != null) ...[
                  OAuthProviderButton(
                    provider: GoogleProvider(clientId: widget.googleClientId!),
                    action: AuthAction.signIn,
                  ),
                ],
                const SizedBox(height: 32),
              ],

              // Footer
              _buildPolicyFooter(context),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildOTPScreen() {
    if (_verificationId == null) {
      return _buildPhoneEntryScreen();
    }

    return OtpVerificationScreen(
      phoneNumber: _phoneNumber,
      primaryColor: widget.primaryColor,
      verificationId: _verificationId!,
      onVerified: () {
        // Auth state will change automatically, no need to navigate
        if (mounted) {
          setState(() => _currentStep = _AuthStep.loading);
        }
      },
      onError: (error) {
        if (mounted) {
          _showError(_mapAuthErrorMessage(error, step: _AuthStep.enterOTP));
          setState(() => _currentStep = _AuthStep.enterOTP);
        }
      },
      onBack: () {
        if (mounted) {
          setState(() {
            _currentStep = _AuthStep.enterPhone;
            _verificationId = null;
          });
        }
      },
      onResendOTP: () {
        // Request a new OTP while staying in OTP flow
        _resendOTP();
      },
    );
  }

  Widget _buildLoadingScreen() {
    final cs = Theme.of(context).colorScheme;
    return Scaffold(
      backgroundColor: cs.surface,
      body: SafeArea(
        child: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              EggClockLoader(size: 120, color: widget.primaryColor),
              const SizedBox(height: 24),
              Text(
                'Signing you in...',
                style: Theme.of(
                  context,
                ).textTheme.bodyLarge?.copyWith(color: cs.onSurface),
              ),
            ],
          ),
        ),
      ),
    );
  }

  TextSpan _policyLink(String text, String? url, Color color) {
    final hasUrl = url != null && url.isNotEmpty;
    return TextSpan(
      text: text,
      style: TextStyle(
        color: hasUrl ? color : color.withOpacity(0.5),
        fontWeight: FontWeight.w500,
        decoration: hasUrl ? TextDecoration.underline : null,
        decorationColor: color,
      ),
      recognizer: hasUrl
          ? (TapGestureRecognizer()
              ..onTap = () => launchUrl(
                Uri.parse(url),
                mode: LaunchMode.externalApplication,
              ))
          : null,
    );
  }

  Widget _buildPolicyFooter(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(top: 16, bottom: 8),
      child: RichText(
        textAlign: TextAlign.center,
        text: TextSpan(
          style: Theme.of(
            context,
          ).textTheme.bodySmall?.copyWith(color: Colors.black54),
          children: [
            const TextSpan(text: 'By continuing, you agree to our '),
            _policyLink(
              'Terms of Service',
              widget.termsUrl,
              widget.primaryColor,
            ),
            const TextSpan(text: ' & '),
            _policyLink(
              'Privacy Policy',
              widget.privacyPolicyUrl,
              widget.primaryColor,
            ),
          ],
        ),
      ),
    );
  }
}
