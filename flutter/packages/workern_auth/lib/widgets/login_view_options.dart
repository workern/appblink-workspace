import 'package:flutter/material.dart';

class LoginViewOptions extends StatelessWidget {
  final VoidCallback onEmailTap;
  final VoidCallback onGoogleTap;
  final VoidCallback onSignUpTap;

  const LoginViewOptions({
    super.key,
    required this.onEmailTap,
    required this.onGoogleTap,
    required this.onSignUpTap,
  });

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 40.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const SizedBox(height: 60),
            const Text(
              'Welcome to Workern',
              style: TextStyle(fontSize: 32, fontWeight: FontWeight.bold),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            const Text(
              'Sign in to your account',
              style: TextStyle(fontSize: 16, color: Colors.grey),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 60),
            ElevatedButton.icon(
              onPressed: onGoogleTap,
              icon: const Icon(Icons.g_mobiledata),
              label: const Text('Continue with Google'),
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.symmetric(
                  horizontal: 24,
                  vertical: 16,
                ),
                minimumSize: const Size(double.infinity, 50),
              ),
            ),
            const SizedBox(height: 16),
            ElevatedButton.icon(
              onPressed: onEmailTap,
              icon: const Icon(Icons.email),
              label: const Text('Continue with Email'),
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.symmetric(
                  horizontal: 24,
                  vertical: 16,
                ),
                minimumSize: const Size(double.infinity, 50),
              ),
            ),
            const SizedBox(height: 40),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Text("Don't have an account? "),
                TextButton(
                  onPressed: onSignUpTap,
                  child: const Text('Sign up'),
                ),
              ],
            ),
            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }
}
