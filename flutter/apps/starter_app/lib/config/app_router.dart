import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:firebase_auth/firebase_auth.dart' as firebase_auth;
import 'package:workern_auth/workern_auth.dart';
import '../screens/app_shell.dart';
import '../screens/home_screen.dart';
import '../screens/explore_screen.dart';
import 'auth_config.dart';
import 'app_colors.dart';

/// Notifies GoRouter whenever Firebase auth state changes so the redirect
/// function is re-evaluated without recreating the entire router.
class _AuthNotifier extends ChangeNotifier {
  _AuthNotifier() {
    firebase_auth.FirebaseAuth.instance
        .authStateChanges()
        .listen((_) => notifyListeners());
  }
}

/// Stable router — created once per app lifetime.
/// Reads [FirebaseAuth.instance.currentUser] synchronously inside redirect so
/// no extra stream subscription is needed at the call site.
final routerProvider = Provider<GoRouter>((ref) {
  final notifier = _AuthNotifier();
  ref.onDispose(notifier.dispose);

  return GoRouter(
    initialLocation: '/',
    refreshListenable: notifier,
    onException: (context, state, router) {
      final uri = state.uri;
      if (uri.scheme.contains('googleusercontent') ||
          uri.host == 'firebaseauth') {
        return;
      }
      router.go('/');
    },
    redirect: (context, state) {
      final user = firebase_auth.FirebaseAuth.instance.currentUser;
      final isAuthenticated = user != null;
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
});

