import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:firebase_auth/firebase_auth.dart' as firebase_auth;
import 'package:workern_auth/workern_auth.dart';
import '../screens/app_shell.dart';
import '../screens/home_screen.dart';
import '../screens/explore_screen.dart';
import 'auth_config.dart';
import 'app_colors.dart';

GoRouter createRouter(
  firebase_auth.User? firebaseUser, {
  bool isLoading = false,
}) => GoRouter(
  initialLocation: '/',
  onException: (context, state, router) {
    // Silently ignore Firebase Auth callback deep links (reCAPTCHA, email links).
    // These have a custom URL scheme and are handled by firebase_auth internally;
    // GoRouter should not try to navigate to them.
    final uri = state.uri;
    if (uri.scheme.contains('googleusercontent') ||
        uri.host == 'firebaseauth') {
      return;
    }
    router.go('/');
  },
  redirect: (context, state) {
    if (isLoading) return null;
    final isAuthenticated = firebaseUser != null;
    final loc = state.matchedLocation;
    if (!isAuthenticated && loc != '/' && loc != '/login') return '/login';
    if (!isAuthenticated && loc == '/') return '/login';
    if (isAuthenticated && (loc == '/' || loc == '/login')) return '/home';
    return null;
  },
  routes: [
    GoRoute(path: '/', redirect: (_, _) => '/login'),
    GoRoute(
      path: '/login',
      builder: (context, state) => LoginScreen(
        appName: 'Starter App',
        appDescription: 'Starter app with Firebase and Workern services',
        primaryColor: AppColors.primary,
        logo: Image.asset('assets/icons/icon_1024.png', width: 80, height: 80),
        googleClientId: GOOGLE_CLIENT_ID,
      ),
    ),

    // ── Authenticated shell with bottom navigation ────────────────────────
    StatefulShellRoute.indexedStack(
      builder: (context, state, shell) => AppShell(shell: shell),
      branches: [
        StatefulShellBranch(
          routes: [
            GoRoute(path: '/home', builder: (_, _) => const HomeTabContent()),
          ],
        ),
        StatefulShellBranch(
          routes: [
            GoRoute(path: '/explore', builder: (_, _) => const ExploreScreen()),
          ],
        ),
      ],
    ),

    // ── Profile (full-screen with own Scaffold/AppBar) ────────────────────
    GoRoute(
      path: '/profile',
      builder: (context, _) => AccountProfileScreen(
        deleteAccountFnName: 'starterapp-account-deleteaccount',
        primaryColor: AppColors.primary,
        appBarColor: Theme.of(context).scaffoldBackgroundColor,
        appBarForegroundColor: Theme.of(context).colorScheme.onSurface,
        deleteAccountSubtitle:
            'Permanently delete your account and all Starter App data',
        deleteAccountConfirmMessage:
            'This will permanently delete your account and all associated data. '
            'This action cannot be undone.',
      ),
    ),
  ],
);
// End of file
