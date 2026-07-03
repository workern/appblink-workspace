import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';

/// Returns true if user is authenticated (non-anonymous).
/// If not, navigates to /login with a back-redirect and returns false.
bool requireAuth(BuildContext context, {String? returnTo}) {
  final auth = context.read<AuthProvider>();
  if (auth.firebaseUser != null && !auth.isAnonymous) return true;
  // GoRouterState.of() throws if context is outside the router tree (e.g. bottom sheets).
  // Fall back to '/home' as the return destination in that case.
  String from;
  try {
    from = returnTo ?? GoRouterState.of(context).uri.toString();
  } catch (_) {
    from = returnTo ?? '/home';
  }
  GoRouter.of(context).push('/login?from=${Uri.encodeComponent(from)}');
  return false;
}
