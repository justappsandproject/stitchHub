import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:stitchhub_mobile/core/notifications/push_notification_service.dart';
import 'package:stitchhub_mobile/core/router/app_router.dart';
import 'package:stitchhub_mobile/core/theme/app_theme.dart';
import 'package:stitchhub_mobile/domain/entities/user_entity.dart';
import 'package:stitchhub_mobile/injection_container.dart';
import 'package:stitchhub_mobile/presentation/blocs/auth/auth_bloc.dart';
import 'package:stitchhub_mobile/presentation/blocs/billing/billing_bloc.dart';
import 'package:stitchhub_mobile/presentation/blocs/dashboard/dashboard_bloc.dart';
import 'package:stitchhub_mobile/presentation/blocs/messages/messages_bloc.dart';
import 'package:stitchhub_mobile/presentation/blocs/orders/orders_bloc.dart';
import 'package:stitchhub_mobile/presentation/blocs/sync/sync_bloc.dart';

class StitchHubApp extends StatefulWidget {
  const StitchHubApp({super.key});

  @override
  State<StitchHubApp> createState() => _StitchHubAppState();
}

class _StitchHubAppState extends State<StitchHubApp> {
  late final AuthBloc _authBloc = sl<AuthBloc>()..add(const AuthStarted());
  late final _AuthRefresh _authRefresh = _AuthRefresh();
  late final GoRouter _router = AppRouter.create(
    user: () => _authRefresh.user,
    refreshListenable: _authRefresh,
  );

  @override
  void initState() {
    super.initState();
    sl<SyncBloc>().add(const SyncStarted());
    sl<PushNotificationService>().initialize();
    _authBloc.stream.listen((state) {
      _authRefresh.update(state);
      if (state is AuthAuthenticated) {
        sl<SyncBloc>().add(const SyncNowRequested());
        sl<PushNotificationService>().syncTokenWithApi();
      }
    });
  }

  @override
  void dispose() {
    _authRefresh.dispose();
    _router.dispose();
    _authBloc.close();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return MultiBlocProvider(
      providers: [
        BlocProvider.value(value: _authBloc),
        BlocProvider.value(value: sl<SyncBloc>()),
        BlocProvider(create: (_) => sl<OrdersBloc>()),
        BlocProvider(create: (_) => sl<DashboardBloc>()),
        BlocProvider(create: (_) => sl<MessagesBloc>()),
        BlocProvider(create: (_) => sl<BillingBloc>()),
      ],
      child: MaterialApp.router(
        title: 'StitchHub',
        debugShowCheckedModeBanner: false,
        theme: AppTheme.light(),
        darkTheme: AppTheme.dark(),
        themeMode: ThemeMode.system,
        routerConfig: _router,
      ),
    );
  }
}

class _AuthRefresh extends ChangeNotifier {
  AuthState _state = const AuthInitial();

  UserEntity? get user =>
      _state is AuthAuthenticated ? (_state as AuthAuthenticated).user : null;

  void update(AuthState state) {
    _state = state;
    notifyListeners();
  }
}
