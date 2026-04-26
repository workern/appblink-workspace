import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/billing_package_model.dart';
import '../providers/billing_providers.dart';

class SubscriptionScreen extends ConsumerStatefulWidget {
  final String title;
  final List<String> features;
  final Color? primaryColor;
  final String continueButtonText;
  final String? privacyPolicyUrl;
  final String? termsOfUseUrl;
  final VoidCallback? onClose;
  final VoidCallback? onSuccess;

  const SubscriptionScreen({
    super.key,
    required this.title,
    required this.features,
    this.primaryColor,
    this.continueButtonText = 'CONTINUE',
    this.privacyPolicyUrl,
    this.termsOfUseUrl,
    this.onClose,
    this.onSuccess,
  });

  @override
  ConsumerState<SubscriptionScreen> createState() => _SubscriptionScreenState();
}

class _SubscriptionScreenState extends ConsumerState<SubscriptionScreen> {
  int _selectedIndex = 0;

  Color get _primaryColor => widget.primaryColor ?? const Color(0xFFE91E63);

  @override
  Widget build(BuildContext context) {
    final packagesAsync = ref.watch(billingPackagesProvider);
    final purchaseState = ref.watch(purchaseStateProvider);
    final isProcessing = purchaseState == PurchaseState.loading;

    // React to success/error transitions
    ref.listen<PurchaseState>(purchaseStateProvider, (previous, next) {
      if (next == PurchaseState.success) {
        widget.onSuccess?.call();
        Navigator.of(context).pop();
      } else if (next == PurchaseState.error) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Purchase failed. Please try again.'),
            backgroundColor: Colors.red,
          ),
        );
        ref.read(purchaseStateProvider.notifier).reset();
      }
    });

    return Scaffold(
      backgroundColor: Colors.black,
      body: SafeArea(
        child: Stack(
          children: [
            _buildBackgroundParticles(),
            Column(
              children: [
                Align(
                  alignment: Alignment.topLeft,
                  child: IconButton(
                    icon: const Icon(Icons.close, color: Colors.white, size: 28),
                    onPressed: widget.onClose ?? () => Navigator.of(context).pop(),
                  ),
                ),
                Expanded(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.all(24),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const SizedBox(height: 40),
                        Text(
                          widget.title,
                          style: const TextStyle(
                            fontSize: 32,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                          ),
                        ),
                        const SizedBox(height: 32),
                        ...widget.features.map(
                          (feature) => Padding(
                            padding: const EdgeInsets.only(bottom: 16),
                            child: Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Icon(Icons.arrow_forward, color: Colors.white70, size: 20),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Text(
                                    feature,
                                    style: const TextStyle(fontSize: 18, color: Colors.white70),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                        const SizedBox(height: 48),
                        packagesAsync.when(
                          loading: () => const Center(
                            child: Padding(
                              padding: EdgeInsets.all(32),
                              child: CircularProgressIndicator(color: Colors.white),
                            ),
                          ),
                          error: (e, _) => Center(
                            child: Text(
                              'Failed to load packages.\n$e',
                              style: const TextStyle(color: Colors.white60),
                              textAlign: TextAlign.center,
                            ),
                          ),
                          data: (packages) => Column(
                            children: [
                              ...packages.asMap().entries.map((entry) {
                                final index = entry.key;
                                final package = entry.value;
                                return Padding(
                                  padding: EdgeInsets.only(
                                    bottom: index < packages.length - 1 ? 16 : 0,
                                  ),
                                  child: _buildPackageCard(package, index, _selectedIndex == index),
                                );
                              }),
                              const SizedBox(height: 32),
                              SizedBox(
                                width: double.infinity,
                                height: 56,
                                child: ElevatedButton(
                                  onPressed: isProcessing
                                      ? null
                                      : () {
                                          if (packages.isNotEmpty) {
                                            ref.read(purchaseStateProvider.notifier).purchase(packages[_selectedIndex]);
                                          }
                                        },
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: _primaryColor,
                                    foregroundColor: Colors.white,
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                    elevation: 0,
                                  ),
                                  child: isProcessing
                                      ? const SizedBox(
                                          height: 24,
                                          width: 24,
                                          child: CircularProgressIndicator(
                                            strokeWidth: 2,
                                            valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                                          ),
                                        )
                                      : Text(
                                          widget.continueButtonText,
                                          style: const TextStyle(
                                            fontSize: 18,
                                            fontWeight: FontWeight.bold,
                                            letterSpacing: 1,
                                          ),
                                        ),
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 24),
                        Center(
                          child: TextButton(
                            onPressed: isProcessing
                                ? null
                                : () => ref.read(purchaseStateProvider.notifier).restore(),
                            child: const Text(
                              'Restore Purchase',
                              style: TextStyle(color: Colors.white70, fontSize: 16),
                            ),
                          ),
                        ),
                        const SizedBox(height: 16),
                        if (widget.privacyPolicyUrl != null || widget.termsOfUseUrl != null)
                          Center(
                            child: Text.rich(
                              TextSpan(
                                children: [
                                  if (widget.privacyPolicyUrl != null)
                                    const TextSpan(
                                      text: 'Privacy Policy',
                                      style: TextStyle(color: Colors.white60, fontSize: 14),
                                    ),
                                  if (widget.privacyPolicyUrl != null && widget.termsOfUseUrl != null)
                                    const TextSpan(
                                      text: ' | ',
                                      style: TextStyle(color: Colors.white60, fontSize: 14),
                                    ),
                                  if (widget.termsOfUseUrl != null)
                                    const TextSpan(
                                      text: 'Terms of Use',
                                      style: TextStyle(color: Colors.white60, fontSize: 14),
                                    ),
                                ],
                              ),
                            ),
                          ),
                        const SizedBox(height: 32),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPackageCard(BillingPackageModel package, int index, bool isSelected) {
    return InkWell(
      onTap: () => setState(() => _selectedIndex = index),
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: Colors.transparent,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isSelected ? _primaryColor : Colors.white30,
            width: isSelected ? 3 : 1,
          ),
        ),
        child: Row(
          children: [
            Container(
              width: 28,
              height: 28,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: isSelected ? _primaryColor : Colors.transparent,
                border: Border.all(
                  color: isSelected ? _primaryColor : Colors.white30,
                  width: 2,
                ),
              ),
              child: isSelected
                  ? const Icon(Icons.check, color: Colors.white, size: 18)
                  : null,
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    package.title,
                    style: const TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                  if (package.description.isNotEmpty) ...[
                    const SizedBox(height: 4),
                    Text(
                      package.description,
                      style: const TextStyle(fontSize: 14, color: Colors.white60),
                    ),
                  ],
                ],
              ),
            ),
            Text(
              package.price,
              style: const TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: Colors.white,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBackgroundParticles() {
    return Positioned.fill(child: CustomPaint(painter: _ParticlesPainter()));
  }
}

class _ParticlesPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = Colors.white.withValues(alpha: 0.1)
      ..style = PaintingStyle.fill;

    for (int i = 0; i < 30; i++) {
      final x = (i * 37) % size.width;
      final y = (i * 73) % size.height;
      final radius = (i % 3) + 1.0;
      canvas.drawCircle(Offset(x, y), radius, paint);
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
